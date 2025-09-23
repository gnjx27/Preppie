// Firebase Imports
import * as admin from 'firebase-admin';
import { db } from '../index';
// Service Imports
import { getUserExpoTokens } from './cloudUserServices';
// Type Imports
import { GdacsAlert } from "../cloudTypes";

/**
 * Format Notification to save in Firestore
 * @param alert 
 * @returns notification
 */
export const formatNotification = (alert: GdacsAlert) => {
  console.log('=== DEBUG formatNotification ===');
  console.log('Alert eventid:', alert.eventid);
  console.log('Alert url object:', JSON.stringify(alert.url, null, 2));
  console.log('Alert url.report:', alert.url?.report);
  console.log('================');
  return {
    title: `${alert.alertlevel} Alert`,
    description: `${alert.htmldescription}`,
    isRead: false,
    icon: alert.icon || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    data: {
      eventid: alert.eventid,
      episodeid: alert.episodeid,
      eventtype: alert.eventtype,
      severity: alert.severitydata.severitytext,
      fromdate: alert.fromdate,
      todate: alert.todate,
      reportUrl: alert.url?.report || null
    }
  };
}

/** * Sends Expo push notifications to a list of tokens.
 * Uses the Expo Push API to send notifications
 * in chunks of 100 tokens at a time.
 * @param {string[]} tokens - Array of Expo push tokens.
 * @param {GdacsAlert} alert - The GDACS alert to include in the notification.
 */
export const sendExpoNotifications = async (tokens: string[], alert: GdacsAlert) => {
  const expoEndpoint = 'https://exp.host/--/api/v2/push/send';
  const chunkSize = 100;

  for (let i = 0; i < tokens.length; i += chunkSize) {
    const chunk = tokens.slice(i, i + chunkSize);
    const messages = chunk.map(token => ({
      to: token,
      sound: 'default',
      priority: 'high',
      title: `⚠️ ${alert.alertlevel} Alert`,
      body: `${alert.htmldescription}`,
      data: {
        eventid: alert.eventid,
        episodeid: alert.episodeid,
        eventtype: alert.eventtype,
        severity: alert.severitydata.severitytext,
        fromdate: alert.fromdate,
        todate: alert.todate,
        reportUrl: alert.url || null,
      }
    }));

    try {
      const response = await fetch(expoEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const result = await response.json();
      console.log(`Expo response for ${chunk.length} tokens: `, JSON.stringify(result, null, 2));
    } catch (err: any) {
      console.log('Error sending notification to user: ', err.message);
    }
  }
}

/**
 * Creates unique notification id, formats notification, and skips notification if already exists for user.
 * @param alert 
 * @param userId 
 * @returns userNotificationRef, notificationData, status (save/skipped)
 */
export const prepareUserNotification = async (alert: GdacsAlert, userId: string) => {
  // Create unique notification ID with alert event id, alert episode id, and user id
  const notificationId = `${alert.eventid}-${alert.episodeid}-${userId}`;
  const userNotificationRef = db.collection('users').doc(userId).collection('notifications').doc(notificationId);

  // Skip if notification already exists 
  const existingNotification = await userNotificationRef.get();
  if (existingNotification.exists) return { userNotificationRef, notificationData: null, status: 'skipped' };

  // Format notifcation
  const notificationData = formatNotification(alert);

  // Return notification ref, notificationData, and status
  return { userNotificationRef, notificationData, status: 'save' };
}

/**
 * Notify user of on-going disasters
 * @param userId
 * @param userLocation
 */
export const notifyUserOfOngoingDisasters = async (userId: string, userLocation: string) => {
  console.log(`notifyUserOfOngoingDisasters called for user ${userId} with location ${userLocation}`);

  // Get today's date
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Get on-going disasters
  const disastersSnap = await db.collection('disasters').get();
  const onGoingDisasters = disastersSnap.docs.filter(doc => {
    const data = doc.data();
    const fromDateStr = data.fromdate.toDate().toISOString().split('T')[0];
    const toDateStr = data.todate.toDate().toISOString().split('T')[0];
    return fromDateStr <= todayStr && toDateStr >= todayStr;
  });

  if (onGoingDisasters.length === 0) {
    console.log(`No ongoing disasters at the moment for user ${userId}`);
    return;
  }

  // Filter disasters that affect this user's location
  const relevantDisasters = onGoingDisasters.filter((doc) => {
    const data = doc.data();
    return data.affectedcountries?.some(
      (c: any) => c.iso2 === userLocation
    );
  });

  if (relevantDisasters.length === 0) {
    console.log(`No relevant ongoing disasters for user ${userId}`);
    return;
  }

  console.log(
    `Found ${relevantDisasters.length} relevant disasters for user ${userId}`
  );

  // Collect push tokens
  const expoPushTokens = await getUserExpoTokens([userId]);

  // Prepare a batch for Firestore
  const batch = db.batch();

  for (const disasterDoc of relevantDisasters) {
    const alert = disasterDoc.data();

    // Convert Firestore timestamps to ISO strings
    if ((alert.fromdate as admin.firestore.Timestamp)?.toDate) {
      alert.fromdate = (alert.fromdate as admin.firestore.Timestamp).toDate().toISOString();
    }
    if ((alert.todate as admin.firestore.Timestamp)?.toDate) {
      alert.todate = (alert.todate as admin.firestore.Timestamp).toDate().toISOString();
    }

    // Reconstruct the url object from the stored reportUrl
    if (alert.reportUrl) {
      alert.url = {
        report: alert.reportUrl
      };
    }

    // Prepare notification doc
    const { userNotificationRef, notificationData, status } =
      await prepareUserNotification(alert as GdacsAlert, userId);

    if (status === "save") {
      batch.set(userNotificationRef, notificationData);
    }

    // Send push notifications if available
    if (expoPushTokens.length > 0) {
      await sendExpoNotifications(expoPushTokens, alert as GdacsAlert);
    }
  }

  await batch.commit();
};
