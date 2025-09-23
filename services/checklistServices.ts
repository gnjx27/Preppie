// Firebase Imports
import { collection, query, where, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// Type Imports
import { Checklist } from '../types';
import { Unsubscribe } from 'firebase/auth';

/**
 * Fetch checklists of type "recurring" from Firestore.
 * @returns Array of recurring checklists metadata.
 */
export const fetchRecurringChecklists = async (): Promise<Checklist[]> => {
    try {
        // Get checklists from Firestore with type "recurring"
        const checklistRef = collection(db, 'checklist');
        const recurringQuery = query(checklistRef, where('type', '==', 'recurring'));
        const querySnap = await getDocs(recurringQuery);

        // Store recurring checklists metadata
        const recurringChecklists = querySnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                type: data.type,
                frequency: data.frequency,
                description: data.description || '',
                items: data.items || [],
            };
        });
        return recurringChecklists;
    } catch (err: any) {
        console.error("fetchRecurringChecklists error:", err);
        return [];
    }
}

/**
 * Fetch completed periods and append them to the recurring checklists metadata.
 * @param recurringChecklists - Array of recurring checklists metadata.
 * @returns Recurring checklists objects with completedPeriods attached.
 */
export const fetchRecurringChecklistCompletedPeriods = async (recurringChecklists: Checklist[], uid: string) => {
    // Fetch completed periods for each recurring checklist
    const updatedChecklists = await Promise.all(
        recurringChecklists.map(async (checklist) => {
            try {
                const progressDocRef = doc(db, 'users', uid, 'checklistProgress', checklist.id);
                const progressSnap = await getDoc(progressDocRef);
                // If progress exists, get completed periods array
                const completedPeriods: string[] = progressSnap.exists() && progressSnap.data().completedPeriods
                    ? progressSnap.data().completedPeriods
                    : [];
                return {
                    ...checklist,
                    completedPeriods
                }
            } catch (err: any) {
                console.error(`Error fetching completed periods for checklist ${checklist.id}: `, err.message);
                return {
                    ...checklist,
                    completedPeriods: []
                }
            }
        })
    )
    return updatedChecklists;
}

/**
 * Fetch checklists from Firestore 
 * @returns Checklist docs
 */
export const fetchChecklistsData = async (): Promise<QueryDocumentSnapshot<DocumentData>[]> => {
    try {
        const checklistCol = collection(db, 'checklist');
        const checklistSnapshot = await getDocs(checklistCol);
        return checklistSnapshot.docs;
    } catch (err: any) {
        console.error('fetchChecklistsData: ', err.message);
        return [];
    }
}

/**
 * Apply real-time listener to user checklistProgress
 * @param uid 
 * @param onUpdate 
 */
export const listenToChecklistProgress = (uid: string, onUpdate: (progressDocs: DocumentData) => void): Unsubscribe => {
    const progressRef = collection(db, 'users', uid, 'checklistProgress');
    return onSnapshot(progressRef, (snapshot) => {
        const progress = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }))
        onUpdate(progress);
    })
}