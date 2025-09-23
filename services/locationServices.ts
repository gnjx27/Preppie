// Firebase Imports
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// Expo Location Imports
import * as Location from 'expo-location';
// React Async Storage Imports
import AsyncStorage from "@react-native-async-storage/async-storage";
// Data Imports
import emergencyNumbers from '../assets/data/emergencyNumbers.json';

// Set threshold for travel distance
const TRAVEL_THRESHOLD_KM = 50;

/**
 * Get distance between 2 coordinates
 * @param lat1 
 * @param lon1 
 * @param lat2 
 * @param lon2 
 * @returns distance in kilometers
 */
export const getDistanceInKM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (val: number): number => (val * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Checks and updates user location in Firestore.
 * Updates when location changes region or over travel distance threshold.
 * @param uid 
 * @param coords 
 * @param countryCode 
 * @return void
 */
export const checkAndUpdateUserLocation = async (
    uid: string,
    coords: { latitude: number, longitude: number },
    countryCode: string
) => {
    // Check parameters provided
    if (!uid || !coords || !countryCode) return;

    // Get user snap from Firestore 
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    // If usersnap does not exist
    if (!userSnap.exists()) {
        // Save device current location to Firestore
        await setDoc(userRef, {
            location: {
                countryCode,
                latitude: coords.latitude,
                longitude: coords.longitude
            }
        }, { merge: true });
        console.log('Location saved for the first time');
        return;
    }

    // Get previously saved location from Firstore
    const prevLocation = userSnap.data()?.location;
    // If no previous location
    if (!prevLocation) {
        // Save current location to Firestore
        await setDoc(userRef, {
            location: {
                countryCode,
                latitude: coords.latitude,
                longitude: coords.longitude
            }
        }, { merge: true });
        console.log('No previous location found, location saved')
        return;
    }

    // Check if previous location countryCode is different from current location
    if (prevLocation.countryCode !== countryCode) {
        // If its different update location to current location country code
        await setDoc(userRef, {
            location: {
                countryCode,
                latitude: coords.latitude,
                longitude: coords.longitude
            }
        });
        console.log('Country changed, location updated');
        return;
    }

    // Get distance between previously saved coords and current coords
    const distance = getDistanceInKM(
        prevLocation.latitude,
        prevLocation.longitude,
        coords.latitude,
        coords.longitude
    );

    // If distance more then travel threshold
    if (distance > TRAVEL_THRESHOLD_KM) {
        // Update location in Firestore
        await setDoc(userRef, {
            location: {
                countryCode,
                latitude: coords.latitude,
                longitude: coords.longitude
            }
        });
        console.log('Travelled over threshold, location updated');
    }
}

/**
 * Get device current location coordinates.
 * @returns Promise<Location.LocationObjectCoords | null> - Returns coordinates or null if permission denied.
 */
export const getDeviceCoords = async (): Promise<Location.LocationObjectCoords | null> => {
    // ask permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return null;
    }

    // get coords
    const location = await Location.getCurrentPositionAsync({});
    return location.coords;
}

/**
 * Get device location data (ISO2 country code and country name) and save in async storage.
 * @param coords 
 * @returns locationData or void if not found.
 */
export const getDeviceLocationData = async (coords: Location.LocationObjectCoords | null): Promise<{ iso2: string; name: string } | void> => {
    if (coords) { // IF coords are provided
        // Get geocode
        const geocode = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude,
        });

        // Get ISO2 country code
        const countryCode = geocode[0]?.isoCountryCode;
        // Get country name
        const countryName = geocode[0]?.country;

        if (!countryCode || !countryName) { // IF country code & name is not found
            console.warn('Could not determine country code from location');
            return;
        }

        // Store ISO2 country code and country name
        const locationData = {
            iso2: countryCode,
            name: countryName
        }

        await AsyncStorage.setItem('deviceLocation', JSON.stringify(locationData));
        return locationData
    }
}

/**
 * Get emergency numbers for a specific country code from the emergencyNumbers.json file.
 * Stores the emergency numbers in AsyncStorage under the key 'emergencyNumbers'.
 * @param countryCode
 */
export const getEmergencyNumbers = async (countryCode: string) => {
    const match = emergencyNumbers.find(
        (entry) => entry.Country?.ISOCode === countryCode
    );

    if (!match) {
        console.warn(`No emergency numbers found for country code: ${countryCode}`);
        return null;
    }

    const numbers = {
        ambulance: match.Ambulance?.All?.filter(Boolean) || [],
        fire: match.Fire?.All?.filter(Boolean) || [],
        police: match.Police?.All?.filter(Boolean) || [],
        dispatch: match.Dispatch?.All?.filter(Boolean) || [],
        notes: match.Notes || false
    }

    await AsyncStorage.setItem('emergencyNumbers', JSON.stringify(numbers));
}

/**
 * Replaces any emergency number with the emergency numbers for user's current location.
 * @param text 
 * @param ambulanceNumber 
 * @returns text with replaced emergency numbers.
 * @throws Error if text or ambulanceNumber is not provided.
 * @throws Error if unable to replace emergency numbers.
 */
export const replaceEmergencyNumbers = (text: string, ambulanceNumber: string): string => {
    if (!text) return text;
    return text.replace(/\b\d{3}\b/g, ambulanceNumber);
}