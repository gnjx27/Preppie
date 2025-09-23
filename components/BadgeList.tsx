// React Imports
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Firebase Imports
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg';
import BadgeEarnedIcon from '../assets/icons/BadgeEarnedIcon.svg';
import BadgeLockedIcon from '../assets/icons/BadgeLockedIcon.svg';
// Navigation Imports
import { TabParamList } from '../navigation/MainStack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Type Imports
import { Badge } from '../types';
// Service Imports
import { getBadges } from '../services/badgeServices';

// Props type for navigation
type Props = NativeStackScreenProps<TabParamList, 'Badge'>;

// Define Step Background Colors
const bgColors = [
    '#FF6666', '#FF9044', '#7F93FF', '#52C87D', '#BB85ED', '#FF7F7F',
    '#FFD966', '#66CCFF', '#66FFCC', '#D291FF', '#66FFFF', '#FFB3C6'
];

const BadgeList = ({ navigation }: Props) => {
    // State management for badges, earned badges, and loading
    const [badges, setBadges] = useState<Badge[]>([]);
    const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());

    // Fetch badge collection from cache first, then Firestore
    useEffect(() => {
        const fetchBadges = async () => {
            try {
                // 1. Load badges from AsyncStorage (local cache) if available
                const cached = await AsyncStorage.getItem('badges');
                if (cached) {
                    const parsed: Badge[] = JSON.parse(cached);
                    parsed.sort((a, b) => a.pointsRequired - b.pointsRequired);
                    setBadges(parsed);
                }

                // 2. Fetch badges from Firestore
                const badgesFromFirestore = await getBadges();
                if (badgesFromFirestore) {
                    setBadges(badgesFromFirestore);
                    await AsyncStorage.setItem('badges', JSON.stringify(badgesFromFirestore));
                }
            } catch (err: any) {
                console.error('Error loading badges: ', err.message);
            }
        }

        fetchBadges();
    }, []);

    // Subscribe to real-time updates for user's earned badges from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        // onSnapshot ensures any change to user's earned badges updates immediately
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const earned: string[] = data.earnedBadges || [];
                setEarnedBadges(new Set(earned));
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <SafeAreaView>
            {/* Top Navigation */}
            <View className="h-16 flex-row items-center justify-between px-4 mt-4 mb-4">
                {/* Back Button (Left) */}
                <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
                <BackButton width={45} height={45} />
                </TouchableOpacity>
                {/* Absolutely centered title */}
                <View className="absolute left-0 right-0 items-center">
                    <Text className="font-poppins-semibold text-white text-2xl">Badges</Text>
                </View>
                {/* Spacer for alignment (Right) */}
                <View style={{ width: 45 }} />
            </View>
            {/* Badge List */}
            <View className='px-6'>
                <FlatList
                    data={badges}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 200 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                        const isEarned = earnedBadges.has(item.id);
                        const bgColor = bgColors[index % bgColors.length];

                        return (
                            // Badge Card
                            <View style={{ backgroundColor: !isEarned ? `${bgColor}50` : bgColor }} className={`flex-1 shadow-md rounded-3xl px-6 py-5 flex-row justify-between mb-4`}>
                                {/* Badge Icon and Text */}
                                <View className='flex-row flex-1'>
                                    {/* Badge Icon */}
                                    <Text className='text-4xl mt-2 mr-3'>{item.icon}</Text>
                                    {/* Badge Title, Description, Points, & Tier */}
                                    <View className='flex-1'>
                                        <Text className='font-poppins-bold text-white text-lg mb-1'>{item.title}</Text>
                                        <Text className='font-poppins-semibold text-sm text-white mb-1'>{item.description}</Text>
                                    </View>
                                </View>
                                {/* Earned/Locked Icon */}
                                <View>
                                    {isEarned ? (
                                        <BadgeEarnedIcon />
                                    ) : (
                                        <BadgeLockedIcon />
                                    )}
                                </View>
                            </View>
                        );
                    }}
                />
        </View>
        </SafeAreaView>
    );
};

export default BadgeList;