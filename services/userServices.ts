// Firebase Imports
import { db, storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, increment, DocumentData } from 'firebase/firestore';
// Type Imports
import { Quiz, Checklist } from '../types';
// Service Imports
import { getCurrentPeriod } from './utils';
import { checkAndAwardBadges } from './badgeServices';

/**
 * Upload image to Firebase storage
 * @param uid 
 * @param imageUri 
 * @returns image download URL
 */
export const uploadImageToStorage = async (uid: string, imageUri: string): Promise<string> => {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profile_pictures/${uid}.jpg`);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
};

/**
 * Delete profile image from Firebase storage
 * @param uid 
 */
export const deleteProfileImage = async (uid: string) => {
    const fileRef = ref(storage, `profile_pictures/${uid}.jpg`);
    await deleteObject(fileRef);
};

/**
 * Get entire user doc from Firestore
 * @param uid 
 */
export const getUserData = async (uid: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            throw Error('User record not found!');
        }
        return userSnap.data();
    } catch (err: any) {
        console.error('getUserData: ', err.message);
        return null;
    }
}

/**
 * Save user quiz result to Firestore
 * @param uid 
 * @param quiz 
 * @param percentage 
 * @param isCompleted
 */
export const saveUserQuizResult = async (uid: string, quiz: Quiz, percentage: number, isCompleted: boolean) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            [`quizResults.${quiz.id}.score`]: percentage,
            [`quizResults.${quiz.id}.isCompleted`]: isCompleted,
            [`quizResults.${quiz.id}.completedAt`]: isCompleted ? new Date().toISOString() : null,
            ...(isCompleted && { points: increment(25) })
        })
    } catch (err: any) {
        console.error('saveUserQuizResult: ', err.message);
    }
}

/**
 * Get checklist progress for user
 * @param uid 
 * @param checklistId 
 * @returns Checklist progress doc
 */
export const getChecklistProgress = async (uid: string, checklistId: string) => {
    try {
        const progressRef = doc(
            db,
            'users',
            uid,
            'checklistProgress',
            checklistId
        );
        const progressSnap = await getDoc(progressRef);
        return progressSnap.data();
    } catch (err: any) {
        console.error('getChecklistProgress: ', err.message);
        return {};
    }
}

/**
 * Update checklist progress in Firestore
 * @param uid 
 * @param checklist 
 * @param checkedItems 
 * @param isFullyCompleted 
 * @param awardPoints 
 * @param pointsToAward 
 * @param progressDoc 
 */
export const updateChecklistProgress = async (
    uid: string,
    checklist: Checklist,
    checkedItems: boolean[],
    isFullyCompleted: boolean,
    awardPoints: boolean,
    pointsToAward: number,
    progressDoc?: DocumentData
) => {
    const docRef = doc(db, 'users', uid, 'checklistProgress', checklist.id);
    const timestamp = new Date().toISOString();
    const frequency = checklist.frequency || 'none';
    const completedPeriods: string[] = progressDoc?.completedPeriods || [];

    let updatedDoc: any = {
        checklistId: checklist.id,
        checkedItems,
        timestamp,
        firstCompletionDate: progressDoc?.firstCompletionDate || null
    }

    if (isFullyCompleted) {
        // If existing checklist progress doesn't have first completion date -> update with current timestamp
        if (!progressDoc?.firstCompletionDate) updatedDoc.firstCompletionDate = timestamp;

        // If checklist is recurring type 
        if (checklist.type === 'recurring') {
            // Get current period
            const currentPeriod = getCurrentPeriod(frequency);
            // const currentPeriod = `month-2025-10`; // FOR TESTING
            // Update completed periods to append current period
            updatedDoc.completedPeriods = [...new Set([...completedPeriods, currentPeriod])];
        } else { // Else if checklist is not recurring type
            updatedDoc.completedPeriods = ["one-time"];
            updatedDoc.isCompleted = true;
        }
    } else { // Else if checklist not fully completed, just append pre existing completedPeriods/isCompleted to updatedDoc
        updatedDoc.completedPeriods = completedPeriods;
        updatedDoc.isCompleted = progressDoc?.isCompleted || false;
    }

    // Update user points if applicable
    if (awardPoints) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { points: increment(pointsToAward) });
        await checkAndAwardBadges(uid);
        console.log(`Awarded ${pointsToAward} points for checklist ${checklist.id}`);
    }

    // Save checklist progress
    await setDoc(docRef, updatedDoc);
}