// React Imports
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
// Expo Notifications Imports
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device'; 
// Firebase Imports
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Notifications Config
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowAlert: true,
    }),
});

/**
 * Register user for push notifications
 * @param userId 
 * @returns Expo token
 */
export const registerForPushNotificationsAsync = async (userId: string) => {
    let token: string | undefined;

    // Android notification config
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        // Get permissions for notifications
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        // Check if permission granted and request if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return undefined;
        }

        try {
            // Get Expo push token
            token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Push token:', token);

            // Save token to Firestore
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, { expoPushToken: token }, { merge: true });
            const userDoc = await getDoc(doc(db, 'users', userId));
            console.log('User doc after setting token:', userDoc.data());

        } catch (error) {
            console.error('Error getting or saving push token:', error);
        }
    } else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
} 