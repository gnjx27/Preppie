// Firebase Imports
import { doc, DocumentData, collection, getDocs, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// Type Imports
import { Quiz, QuizWithScore } from '../types';

/**
 * 
 * @param riskProfile 
 * @returns recommended quizzes based on user's risk profile (cap at 5 quizzes)
 */
export const fetchRecommendedQuizzes = async (riskProfile: DocumentData, uid: string) => {
    try {
        // Get risk types from risk profile
        const riskTypes: string[] = riskProfile?.DisasterRiskTypes || [];
        // Fetch all quizzes
        const quizSnap = await getDocs(collection(db, 'quiz'));
        const allQuizzes: Quiz[] = quizSnap.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Quiz, "id">) // cast everything except id
        }));
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', uid));
        const userData = userDoc.data();
        // Fetch completed quiz IDs
        const completedQuizIds = Object.entries(userData?.quizResults || {})
            .filter(([_, result]: [String, any]) => result.isCompleted === true)
            .map(([quizId]) => quizId);
        // Filter diasaster quizzes
        let disasterQuizzes = allQuizzes.filter((q: any) =>
            q.type === 'disaster' && // Check if quiz type is disaster
            riskTypes.includes(q.disasterType?.toLowerCase()) && // Check if quiz disaster type matches risk profile
            !completedQuizIds.includes(q.id) // Check if quiz is not completed by user
        )
        // IF fewer than 5, fill with first-aid quizzes
        if (disasterQuizzes.length < 5) {
            // Filter incomplete first-aid quizzes
            const firstAidQuizzes = allQuizzes.filter((q: any) =>
                q.type === 'first-aid' &&
                !completedQuizIds.includes(q.id)
            );
            disasterQuizzes = disasterQuizzes.concat(firstAidQuizzes);
        }
        // Cap at 5 quizzes
        return disasterQuizzes.slice(0, 5);
    } catch (err: any) {
        console.error("Error fetching recommended quizzes: ", err.message);
        return [];
    }
}

/**
 * Get quizzes from Firestore
 * @returns Quizzes with type QuizWithScore for eventual concatenation of user scores
 */
export const getQuizzes = async (): Promise<QuizWithScore[]> => {
    const quizSnapshot = await getDocs(collection(db, 'quiz'));
    return quizSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Quiz, 'id'>),
    }));
}

/**
 * Listen to changes in quiz status and call fetchRecommendedQuizzes to update home page
 * @param uid 
 * @param riskProfile 
 * @param callback 
 */
export const listenToRecommendedQuizzes = (
    uid: string,
    riskProfile: DocumentData,
    callback: (quizzes: Quiz[]) => void
) => {
    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, async (snapshot) => {
        if (!snapshot.exists()) return;

        try {
            const quizzes = await fetchRecommendedQuizzes(riskProfile, uid);
            callback(quizzes);
        } catch (err: any) {
            console.error("Error updating recommended quizzes:", err.message);
        }
    });
    return unsubscribe;
};