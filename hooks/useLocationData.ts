// React Imports
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Custom Utils Imports
import { getDeviceCoords, getDeviceLocationData, getEmergencyNumbers } from '../services/locationServices';
// Types Imports
import type { EmergencyNumbersType } from '../types';
// Expo Location Imports
import * as Location from 'expo-location';

/**
 * 
 * @returns isLoading, coords, isocode2, countryName, emergencyNumbers
 */
export const useLocationData = () => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
    const [isocode2, setIsocode2] = useState<string>('');
    const [countryName, setCountryName] = useState<string>('');
    const [emergencyNumbers, setEmergencyNumbers] = useState<EmergencyNumbersType | null>(null);

    useEffect(() => {
        const fetchLocationData = async () => {
            try {
                const coords = await getDeviceCoords();
                if (!coords) return;
                setCoords(coords);

                // Get location data (ISO2 country code and country name)
                const locationData = await getDeviceLocationData(coords)

                // If location data is not found, return early
                if (!locationData) {
                    Alert.alert('Location Error', 'Could not determine your location. Please enable location services.');
                    return;
                }

                setIsocode2(locationData.iso2);
                setCountryName(locationData.name);

                await getEmergencyNumbers(locationData.iso2);
                const numbersString = await AsyncStorage.getItem('emergencyNumbers');
                if (numbersString) {
                    setEmergencyNumbers(JSON.parse(numbersString));
                }

            } catch (err: any) {
                Alert.alert('Preload Error', err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLocationData();
    }, []);

    return { isLoading, coords, isocode2, countryName, emergencyNumbers };
}