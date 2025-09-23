// Firebase Imports
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Get user's risk profile from Firestore
 * @param isocode2 
 * @returns Firestore risk profile document data
 */
export const getDisasterRiskProfile = async (isocode2: string) => {
    try {
        // Ref & snap for disaster risk profile for current isocode2
        const profileRef = doc(db, 'riskProfiles', isocode2);
        const profileSnap = await getDoc(profileRef);

        // Check if snap exists
        if (profileSnap.exists()) {
            // Return risk profile data
            return profileSnap.data();
        } else {
            console.warn('No risk profile found for:', isocode2);
        }
    } catch (err: any) {
        console.error('Error getting risk profile:', err.message);
    }
}