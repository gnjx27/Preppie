// This file in TEMPORARY and will not be included in the final app.
// Used only to upload content to Firestore easily.

// Firebase Imports
import { doc, collection, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// Data Imports
import quizzes from '../assets/data/quiz.json';
import checklists from '../assets/data/checklists.json';
import badges from '../assets/data/badges.json';
import riskProfiles from '../assets/data/disasterRiskProfiles.json';

/**
 * Uploads quizzes in the quiz JSON file to Firestore
 */
export const uploadQuiz = async () => {
  try {
    // quizData is an array imported directly from JSON
    for (const quiz of quizzes) {
      const quizDocRef = doc(collection(db, 'quiz'));
      await setDoc(quizDocRef, {
        title: quiz.title,
        type: quiz.type,
        disasterType: quiz.disasterType,
        questions: quiz.questions,
      });
      console.log(`Uploaded quiz: ${quiz.title}`);
    }
    console.log('All quizzes uploaded successfully!');
  } catch (err) {
    console.error('Error uploading quizzes:', err.message);
  }
}

/**
 * Uploads checklists in the checklist JSON file to Firestore
 */
export const uploadChecklist = async () => {
  try {
    // checklist imported from JSON
    for (const checklist of checklists) {
      const checklistDocRef = doc(collection(db, 'checklist'));
      await setDoc(checklistDocRef, {
        ...checklist
      });
      console.log(`Uploaded checklist: ${checklist.title}`);
    }
    console.log('All checklists uploaded successfully!');
  } catch (err) {
    console.error('Error uploading checklists: '. err.message);
  }
}

/**
 * Upload badges in the badges JSON file to Firestore
 */
export const uploadBadges = async () => {
  try { 
    for (const badge of badges) {
      const badgeDocRef = doc(collection(db, 'badge'));
      await setDoc(badgeDocRef, {
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
        pointsRequired: badge.pointsRequired
      });
      console.log(`Uploaded badge: ${badge.title}`);
    }
    console.log("All badges uploaded successfully!");
  } catch (err) {
    console.error('Error uploading badges to firestore: ', err.message);
  }
}

/**
 * Upload risk profiles in disasterRiskProfiles JSON file to Firestore
 */
export const uploadRiskProfiles = async () => {
  try {
    for (const [isoCode, data] of Object.entries(riskProfiles)) {
      const profileDocRef = doc(collection(db, 'riskProfiles'), isoCode);
      await setDoc(profileDocRef, {
        Country: data.Country,
        DisasterRiskTypes: data.DisasterRiskTypes,
      });
      console.log(`Uploaded risk profile for ${isoCode}`);
    }
    console.log('All risk profiles uploaded successfully!');
  } catch (err) {
    console.error('Error uploading risk profiles:', err.message);
  }
};