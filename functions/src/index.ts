// Firebase Imports
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
// Type Imports
import { GdacsResponse } from './cloudTypes';
// Service Imports
import { sendExpoNotifications, prepareUserNotification, notifyUserOfOngoingDisasters } from './services/cloudNotificationServices';
import { checkAndPrepareAlert, extractAffectedCountryCodes } from './services/cloudAlertServices';
import { getAffectedUsersByCountryCode, getUserExpoTokens } from './services/cloudUserServices';

// Initialise app
admin.initializeApp();

// Link to Firestore
export const db = admin.firestore();

// GDACS API URL
const GDACS_API_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/latest";

/**
 * Polls GDACS API for the latest disaster alerts and updates Firestore.
 * Runs every hour.
 */
export const pollGdacsAlerts = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'UTC',
}, async (event) => {
  try {
    // Fetch response from GDACS API
    const response = await fetch(GDACS_API_URL);
    if (!response.ok) {
      console.error("Failed to fetch GDACS alerts");
      return;
    }

    // Store response as GdacsResponse type
    const data: GdacsResponse = await response.json();
    console.log(`Fetched ${data.features.length} GDACS alerts`);

    // Process and store alerts in Firestore
    const batch = db.batch();
    let newAlerts = 0;
    let updatedAlerts = 0;
    let skippedAlerts = 0;

    // Iterate through alerts
    for (const feature of data.features) {
      // Get alert from data feature field (as per response json structure)
      const alert = feature.properties;

      // Check if alert is new or needs to be udpated (skip if not) and format alert for storage in Firestore
      const { docId, alertData, status } = await checkAndPrepareAlert(alert, feature)
      if (status === 'skipped') {
        skippedAlerts++;
        continue;
      }

      // Add alert to batch for batch upload later
      batch.set(db.collection('disasters').doc(docId), alertData, { merge: true });

      if (status === 'new') {
        newAlerts++;
      } else {
        updatedAlerts++;
      }

      // Extract affected countries
      const countryCodes = extractAffectedCountryCodes(alert);

      // Get affected users ids
      const affectedUserIds = await getAffectedUsersByCountryCode(countryCodes);
      console.log(`Alert ${docId} affects ${affectedUserIds.length} users: ${affectedUserIds}`);

      // Get expo push tokens of affected users
      const expoPushTokens = await getUserExpoTokens(affectedUserIds);

      // If there are expo push tokens
      if (expoPushTokens.length > 0) {
        // Push notifications to affected users via expo api
        await sendExpoNotifications(expoPushTokens, alert);

        // Update the notifications collection for each of the users
        const notificationBatch = db.batch();
        for (const userId of affectedUserIds) {
          const { userNotificationRef, notificationData, status } = await prepareUserNotification(alert, userId);
          if (status === 'save') {
            notificationBatch.set(userNotificationRef, notificationData)
          }
        }
        await notificationBatch.commit();
      }
    }

    // Only commit if there are actual changes to make
    if (newAlerts > 0 || updatedAlerts > 0) {
      await batch.commit();
    }

    console.log(`Alert processing summary - New: ${newAlerts}, Updated: ${updatedAlerts}, Skipped: ${skippedAlerts}`);
    console.log(`GDACS Alert Sync Summary -> New: ${newAlerts}, Updated: ${updatedAlerts}, Skipped: ${skippedAlerts}`);

  } catch (error) {
    console.error("Error polling GDACS alerts:", error);
  }
});

/**
 * Push on-going disaster alerts when user location changes
 */
export const onUserLocationChange = onDocumentUpdated("users/{userId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  const userId = event.params.userId;

  console.log(`onUserLocationChange triggered for user: ${userId}`);
  console.log(`Before location:`, before?.location);
  console.log(`After location:`, after?.location);

  const oldLocation = before?.location?.countryCode;
  const newLocation = after?.location?.countryCode;
  if (!newLocation || oldLocation === newLocation) return;
  await notifyUserOfOngoingDisasters(userId, newLocation);
});

/**
 * Reset recurring checklists so user can complete them again
 */
export const resetMonthlyChecklists = onSchedule(
  {
    schedule: '0 0 1 * *', // Midnight on the 1st of every month
    timeZone: 'UTC'
  },
  async () => {
    console.log(`Starting recurring checklist reset...`);

    try {
      // Get current month string (month-yyyy-mm)
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const currentMonth = `month-${year}-${month}`;
      // const currentMonth = 'month-2025-09'; // Hardcode date for testing

      // Fetch all users
      const usersSnapshot = await db.collection('users').get();

      // Iterate through each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Fetch all checklist progress documents for user
        const progressSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('checklistProgress')
          .get();

        // Iterate through each checklist progress
        for (const progressDoc of progressSnapshot.docs) {
          const progressData = progressDoc.data();
          const checklistId = progressData.checklistId;

          // Fetch the corresponding checklist metadata to check type/frequency
          const checklistSnap = await db.collection('checklist').doc(checklistId).get();
          if (!checklistSnap.exists) continue;
          const checklistData = checklistSnap.data();

          // Only reset monthly recurring checklists
          if (checklistData?.type !== 'recurring' || checklistData?.frequency !== 'monthly') continue;

          // Skip if user has already completed this checklist in the current month
          const completedPeriods: string[] = progressData.completedPeriods || [];
          if (completedPeriods.includes(currentMonth)) continue;

          // Reset checkedItems to all false
          const resetCheckedItems = (progressData.checkedItems || []).map(() => false);

          // Update Firestore
          await db
            .collection('users')
            .doc(userId)
            .collection('checklistProgress')
            .doc(checklistId)
            .update({
              checkedItems: resetCheckedItems
            });

          console.log(`Reset checklist ${checklistId} for user ${userId} for ${currentMonth}`);
        }
      }
      console.log('Monthly checklist reset function completed.');
    } catch (err: any) {
      console.error('Error trying to reset monthly recurring checklists: ', err.message);
    }
  }
)