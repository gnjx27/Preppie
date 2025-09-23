// Firebase Imports
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, onSnapshot, DocumentData } from 'firebase/firestore';
import { Unsubscribe } from 'firebase/auth';

/**
 * Get latest notification for the user from Firestore
 * @returns latest notification document or null if none found
 */
export const getLatestNotification = async (uid: string) => {
    try {
        // Get ref for notification sub collection in users collection
        const notificationsRef = collection(db, 'users', uid, 'notifications');
        // Query to get latest notification
        const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const latest = snapshot.docs[0].data();
            return latest;
        } else {
            console.log("getLatestNotification: No notifications found in subcollection.");
            return null;
        }
    } catch (err) {
        console.error("getLatestNotification: ", err);
        return null;
    }
}

/**
 * Get all notifications for the user
 * @returns Array of notification objects or empty array if none found
 */
export const getNotifications = async (uid: string) => {
    try {
        // Get ref for notification sub collection in users collection
        const notificationsRef = collection(db, 'users', uid, 'notifications');
        // Query to get all notification
        const q = query(notificationsRef, orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const allNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return allNotifications;
        } else {
            console.log("getNotifications: No notifications found.");
            return [];
        }
    } catch (err) {
        console.error("getNotifications error:", err);
        return [];
    }
}

/**
 * Apply real-time listener to user notifications (latest notification)
 * @param uid 
 * @param onUpdate 
 */
export const listenToLatestNotification = (uid: string, onUpdate: (notification: DocumentData | null) => void): Unsubscribe => {
    const notificationsRef = collection(db, 'users', uid, 'notifications');
    const notificationsQuery = query(
        notificationsRef, 
        orderBy('timestamp', 'desc'), 
        limit(1)
    );
    
    return onSnapshot(notificationsQuery, (snapshot) => {
        if (!snapshot.empty) {
            const latestDoc = snapshot.docs[0];
            const notificationData = {
                id: latestDoc.id,
                ...latestDoc.data()
            };
            onUpdate(notificationData);
        } else {
            onUpdate(null);
        }
    }, (error) => {
        console.error("Error listening to notifications: ", error);
        onUpdate(null);
    });
}