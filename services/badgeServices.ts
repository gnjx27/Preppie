// Firebase Imports
import { doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// Type Imports
import { Badge } from '../types';

/**
 * Check if a user has earned any badges based on their quiz results
 * @param userId 
 */
export const checkAndAwardBadges = async (userId: string) => {
    try {
        // Reference to Firestore user data
        const userRef = doc(db, 'users', userId);
        // Get doc for reference
        const userSnap = await getDoc(userRef);
        // Return if user doesn't exist
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        // User's points
        const currentPoints = userData.points || 0;
        // User's earned badges
        const earnedBadges = userData.earnedBadges || [];

        // Fetch all badges from Firestore
        const badgeSnap = await getDocs(collection(db, 'badge'));
        const newlyEarned: string[] = [];

        // Iterate through each badge
        badgeSnap.forEach((docSnap) => {
            const badge = docSnap.data() as { pointsRequired: number };
            const badgeId = docSnap.id;

            // Skip already earned badges
            if (earnedBadges.includes(badgeId)) return;

            // Award badge if user points >= points required
            if (currentPoints >= badge.pointsRequired) {
                newlyEarned.push(badgeId);
            }
        });

        // Update Firestore if there are newly earned badges
        if (newlyEarned.length > 0) {
            await updateDoc(userRef, {
                earnedBadges: [...earnedBadges, ...newlyEarned]
            });
            console.log(`New badges awarded: `, newlyEarned);

            // Send push notifications for newly earned badges
            for (const badgeId of newlyEarned) {
                // Get the badge data to send in notification
                const badgeDoc = badgeSnap.docs.find(doc => doc.id === badgeId);
                if (badgeDoc) {
                    const badgeData = badgeDoc.data();
                    await sendBadgePushNotification(userId, badgeId, badgeData.title, badgeData.icon);
                }
            } 
        }
    } catch (err: any) {
        console.error('Error checking/awarding badges: ', err.message);
    }
}

/**
 * Get highest badge user has and the badge after that
 * @params badges, userPoints
 * @returns highest badge user has and the badge after that
 */
export const getBadgeProgress = (badges: Badge[], userPoints: number) => {
    if (badges.length === 0) return { currentBadge: null, nextBadge: null };

    // Assume badges are already sorted by pointsRequired
    let currentBadge: Badge | null = null;
    let nextBadge: Badge | null = null;

    for (let i = 0; i < badges.length; i++) {
        if (userPoints >= badges[i].pointsRequired) {
            currentBadge = badges[i];
            nextBadge = badges[i + 1] || null;
        }
    }

    return { currentBadge, nextBadge };
}

/**
 * Get badges from Firestore 
 * @returns Badge docs in ascending pointsRequired
 */
export const getBadges = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'badge'));
        const badgeList: Badge[] = querySnapshot.docs.map(doc => {
            const data = doc.data() as Omit<Badge, 'id'>;
            return {
                id: doc.id,
                ...data
            }
        });
        // Sort by points
        badgeList.sort((a, b) => a.pointsRequired - b.pointsRequired);
        return badgeList;
    } catch (err: any) {
        console.error("Error fetching badges: ", err.message);
    }
};

/**
 * Send push notification when user earns a badge
 * @param userId 
 * @param badgeId 
 * @param badgeTitle 
 * @param badgeIcon 
 */
const sendBadgePushNotification = async (userId: string, badgeId: string, badgeTitle: string, badgeIcon: string) => {
    try {
        // Get user's expo token from Firestore
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const expoPushToken = userDoc.data()?.expoPushToken;
        
        if (!expoPushToken) {
            console.log('No expo push token found for user:', userId);
            return;
        }
        
        const message = {
            to: expoPushToken,
            sound: 'default',
            title: `${badgeIcon} Badge Earned!`,
            body: `Congratulations! You've earned the ${badgeTitle} badge.`,
            data: {
                type: 'badge',
                badgeId: badgeId,
                badgeTitle: badgeTitle,
                badgeIcon: badgeIcon
            }
        };
        
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });
        
        const result = await response.json();
        console.log(`Badge notification sent for badge ${badgeTitle}:`, result);
    } catch (error) {
        console.error('Error sending badge notification:', error);
    }
};