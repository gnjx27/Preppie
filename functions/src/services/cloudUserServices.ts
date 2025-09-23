// Firebase Imports
import { db } from "../index";

/**
 * Fetches affected users based on country codes.
 * Uses Firestore's 'in' query to fetch users in chunks.
 * @param affectedCountryCodes
 * @returns affectedUsersIds
 */
export const getAffectedUsersByCountryCode = async (affectedCountryCodes: string[]): Promise<string[]> => {
    if (!Array.isArray(affectedCountryCodes) || affectedCountryCodes.length === 0) return [];

    const affectedUsersIds: string[] = [];
    const chunkSize = 10;

    for (let i = 0; i < affectedCountryCodes.length; i += chunkSize) {
        const chunk = affectedCountryCodes.slice(i, i + chunkSize);

        const snapshot = await db.collection('users')
            .where('location.countryCode', 'in', chunk)
            .get();

        snapshot.forEach(doc => {
            affectedUsersIds.push(doc.id);
        });
    }

    return affectedUsersIds;
};

/**
 * Get expo tokens for list of users
 * @param affectedUserIds 
 * @returns expoPushTokens
 */
export const getUserExpoTokens = async (affectedUserIds: string[]) => {
    const expoPushTokens: string[] = [];
    for (const userId of affectedUserIds) {
        const userDoc = await db.collection('users').doc(userId).get();
        const token = userDoc.data()?.expoPushToken;
        if (token) {
            expoPushTokens.push(token);
        }
    }
    return expoPushTokens;
}