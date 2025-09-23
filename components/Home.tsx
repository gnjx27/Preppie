// React Imports
import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView,
    Image as RNImage, TouchableOpacity, FlatList,
    Dimensions, NativeScrollEvent, NativeSyntheticEvent,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Expo Imports
import { Image as ExpoImage } from 'expo-image';
// Icon Imports
import LocationIcon from '../assets/icons/LocationIcon.svg';
import NotificationIcon from '../assets/icons/NotificationIcon.svg';
import ArrowIcon from '../assets/icons/ArrowIcon.svg';
// Firebase Imports
import { auth, db } from '../firebaseConfig';
import { doc, DocumentData, onSnapshot } from 'firebase/firestore';
// Navigation Imports
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/MainStack';
import { PrepareStackParamList } from '../navigation/PrepareStack';
import { HomeStackParamList } from '../navigation/HomeStack';
import { LearnStackParamList } from '../navigation/LearnStack';
// Custom Hooks Imports
import { useLocationData } from '../hooks/useLocationData';
import { registerForPushNotificationsAsync } from '../hooks/useNotifications';
// Service Imports
import { listenToLatestNotification } from '../services/notificationServices';
import { checkAndUpdateUserLocation } from '../services/locationServices';
import { getDisasterRiskProfile } from '../services/riskProfileServices';
import { fetchRecurringChecklists, listenToChecklistProgress } from '../services/checklistServices';
import { listenToRecommendedQuizzes } from '../services/quizServices';
import { getBadgeProgress, getBadges } from '../services/badgeServices';
// Data Imports
import emergencyGuides from '../assets/data/emergencyGuides.json';
import { disasterImages } from '../constants/imageMaps';
// Firestore Upload Functions Imports
import { uploadQuiz, uploadChecklist, uploadBadges, uploadRiskProfiles } from '../scripts/uploadToFirestore';
// Type Imports
import { EmergencyGuide, RecurringChecklistWithProgress, Quiz, Badge, Checklist } from '../types';

// Composite navigation prop combining:
// 1. Bottom Tab navigation for the 'Home' tab,
// 2. Native Stack navigation within the Home stack (e.g., Home and Notifications screens),
// 3. Native Stack navigation for the Prepare stack (nested under the Prepare tab).
// 4. Native Stack navigation for the Learn stack (under learn tab)
// This allows the HomeScreen component to access navigation methods from all these layers.
type HomeStackNavProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;
type TabNavProp = BottomTabNavigationProp<TabParamList, 'Home'>;
type PrepareStackNavProp = NativeStackNavigationProp<PrepareStackParamList>;
type LearnStackNavProp = NativeStackNavigationProp<LearnStackParamList>;
type HomeScreenNavigationProp = CompositeNavigationProp<
    TabNavProp,
    CompositeNavigationProp<
        HomeStackNavProp,
        CompositeNavigationProp<PrepareStackNavProp, LearnStackNavProp>
    >
>;

// Navigation Props Type
type Props = {
    navigation: HomeScreenNavigationProp;
};

// Alignment for quiz recommendation carousel
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.785; // show 1 card fully at a time
const CARD_SPACING = 16; // spacing between cards

const Home = ({ navigation }: Props) => {
    // Get current user (assert non-null since navigation guards auth status)
    const user = auth.currentUser!;

    // States
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [riskProfile, setRiskProfile] = useState<DocumentData | null>(null);
    const [recommendedEmergencyGuides, setRecommendedEmergencyGuides] = useState<EmergencyGuide[]>([]);
    const [latestNotification, setLatestNotification] = useState<DocumentData | null>(null);
    const [recurringChecklistsWithProgress, setRecurringChecklistsWithProgress] = useState<RecurringChecklistWithProgress[]>([]);
    const [recommendedQuizzes, setRecommendedQuizzes] = useState<Quiz[]>([]);
    const [activeIndexQuizzes, setActiveIndexQuizzes] = useState(0);
    const [activeIndexGuides, setActiveIndexGuides] = useState(0);
    const [userPoints, setUserPoints] = useState<number>(0);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
    const [nextBadge, setNextBadge] = useState<Badge | null>(null);

    // Get current year
    const currentYear = new Date().getFullYear();

    // Upload content to Firestore (uncomment if needed)
    // useEffect(() => {uploadQuiz();}, []);
    // useEffect(() => {uploadChecklist();}, []);
    // useEffect(() => {uploadBadges();}, []);
    // useEffect(() => {uploadRiskProfiles();}, []);

    // Call useLocationData custom hook to get location data
    const { coords, isocode2, countryName, emergencyNumbers } = useLocationData();

    // Update Firestore user document if user location changed
    useEffect(() => {
        if (coords && isocode2 && user) {
            checkAndUpdateUserLocation(user.uid, coords, isocode2);
        }
    }, [coords, isocode2, user]);

    // Listen to Firebase authentication state and ID token changes
    // Updates profilePicture whenever user's auth info changes (login, logout, token refresh, profile updates) 
    useEffect(() => {
        const unsubscribe = auth.onIdTokenChanged((user) => {
            if (user) {
                setProfilePicture(user.photoURL ?? '');
            }
        });
        return () => unsubscribe();
    }, []);

    // Subscribe to real-time updates for the user's document in Firestore
    // Updates userPoints whenever the user's document changes
    useEffect(() => {
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setUserPoints(data.points ?? 0);
            }
        });
        return () => unsubscribe();
    }, []);

    // Register for push notifications
    useEffect(() => {
        if (user) {
            registerForPushNotificationsAsync(user.uid);
        }
    }, [user]);

    // Listen to real-time updates for latest notification
    useEffect(() => {
        const unsubscribe = listenToLatestNotification(user.uid, (notification) => {
            setLatestNotification(notification);
            if (notification) {
                console.log("Latest notification updated: ", notification);
            } else {
                console.log("No notifications");
            }
        });
        return () => unsubscribe();
    }, [user]);

    // Fetch disaster risk profile from Firestore
    useEffect(() => {
        const fetchRiskProfile = async () => {
            const riskProfileFromFirestore = await getDisasterRiskProfile(isocode2);
            if (riskProfileFromFirestore) {
                setRiskProfile(riskProfileFromFirestore);
            }
        };
        if (isocode2) {
            fetchRiskProfile();
        }
    }, [isocode2, user]);

    // Filter emergency guides based on risk profile for recommendations
    useEffect(() => {
        // Check if risk profile and disaster risk types exists
        if (!riskProfile?.DisasterRiskTypes) return;
        // Filter emergency guides based on disaster risk types 
        const filtered = emergencyGuides.filter(guide =>
            riskProfile.DisasterRiskTypes.includes(guide.disasterType?.toLowerCase())
        );
        setRecommendedEmergencyGuides(filtered);
    }, [riskProfile]);

    // Fetch recurring checklists with completed periods and set listener for checklistProgress
    useEffect(() => {
        let baseChecklists: Checklist[] = [];
        const init = async () => {
            // 1. Fetch base recurring checklist definitions
            baseChecklists = await fetchRecurringChecklists();
            setRecurringChecklistsWithProgress(
                baseChecklists.map(cl => ({ ...cl, completedPeriods: [] }))
            );
            // 2. Attach real-time listener
            const unsubscribe = listenToChecklistProgress(user.uid, (progressDocs) => {
                const progMap = new Map(
                    (progressDocs as { id: string; completedPeriods?: unknown }[]).map(pd => [
                        pd.id,
                        Array.isArray(pd.completedPeriods) ? (pd.completedPeriods as string[]) : []
                    ])
                );
                const merged = baseChecklists.map(cl => ({
                    ...cl,
                    completedPeriods: progMap.get(cl.id) ?? []
                }));
                setRecurringChecklistsWithProgress(merged);
            });
            return unsubscribe;
        };
        const unsubscribePromise = init();
        return () => {
            unsubscribePromise.then(unsub => unsub?.());
        };
    }, [user]);

    // Listen for recommended quizzes in real-time
    useEffect(() => {
        if (!riskProfile?.DisasterRiskTypes) return;
        const unsubscribe = listenToRecommendedQuizzes(user.uid, riskProfile, (quizzes) => {
            setRecommendedQuizzes(quizzes);
            console.log("Updated recommended quizzes:", quizzes.map(q => q.title));
        });
        return () => unsubscribe();
    }, [riskProfile, user]);

    // Fetch badges
    useEffect(() => {
        const fetchBadges = async () => {
            const badgesFromFirestore = await getBadges();
            if (badgesFromFirestore) {
                setBadges(badgesFromFirestore);
            }
        };
        fetchBadges();
    }, []);

    // Update current badge and next badge
    useEffect(() => {
        if (badges.length > 0) {
            const { currentBadge, nextBadge } = getBadgeProgress(badges, userPoints);
            setCurrentBadge(currentBadge);
            setNextBadge(nextBadge);
        }
    }, [badges, userPoints]);

    // Handle scroll for quiz recommendation carousel
    const handleScrollQuizzes = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
        setActiveIndexQuizzes(index);
    };

    // Handle scroll for guide recommendation carousel
    const handleScrollGuides = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
        setActiveIndexGuides(index);
    }

    return (
        <SafeAreaView>
            <View className='px-7'>
                {/* Sticky top bar */}
                <View className='flex flex-row justify-between'>
                    {/* Location Details */}
                    <View className='flex flex-row items-center'>
                        <View className='mr-2'><LocationIcon /></View>
                        <Text className='font-poppins text-md text-white'>
                            {isocode2 ? `${countryName}` : 'No device location.'}
                        </Text>
                    </View>
                    <View className='w-24 flex flex-row justify-between items-center'>
                        {/* Notification Bell Icon/Button */}
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => navigation.navigate('Notifications')}
                        >
                            <NotificationIcon />
                        </TouchableOpacity>
                        {/* Profile Picture & Settings Icon/Button */}
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                            <View className="w-9 h-9 rounded-full bg-white/20 overflow-hidden">
                                <ExpoImage
                                    source={
                                        profilePicture
                                            ? { uri: profilePicture, cache: 'force-cache' } // Use cached version if available
                                            : require('../assets/images/DefaultProfilePic.png') // Fallback placeholder
                                    }
                                    style={{ width: '100%', height: '100%', borderRadius: 50 }}
                                    contentFit='cover'
                                />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Scrollable Content */}
                <ScrollView
                    className='h-full mt-4'
                    contentContainerStyle={{ paddingBottom: 150 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Preppie text */}
                    <Text className='font-courgette text-white text-center text-2xl mt-2'>Preppie</Text>
                    {/* Emergency Numbers */}
                    {emergencyNumbers ? (
                        <View className='flex flex-row bg-white items-center mt-4 justify-between py-3 px-5 rounded-3xl shadow-sm'>
                            <Text className='font-poppins-medium text-sm'>Emergency Contacts: </Text>
                            <View className='flex flex-row w-40 justify-between'>
                                <Text className='font-poppins-medium text-sm'>🚑 {emergencyNumbers.ambulance.join(', ') || 'N/A'}</Text>
                                <Text className='font-poppins-medium text-sm'>🔥 {emergencyNumbers.fire.join(', ') || 'N/A'}</Text>
                                <Text className='font-poppins-medium text-sm'>👮 {emergencyNumbers.police.join(', ') || 'N/A'}</Text>
                            </View>
                        </View>
                    ) : (
                        <Text>Loading emergency numbers...</Text>
                    )}

                    {/* Latest notification */}
                    {latestNotification && (
                        <View className='bg-[#5576F6] py-4 px-6 mt-4 rounded-3xl shadow-sm'>
                            {/* Top Section */}
                            <View className='flex flex-row justify-between items-center'>
                                {/* Top Left */}
                                <View className='flex flex-row items-center'>
                                    {/* Alert Icon */}
                                    <View className='mr-3'>
                                        <RNImage
                                            source={{ uri: latestNotification.icon }}
                                            style={{ width: 24, height: 24 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    {/* Title */}
                                    <Text className='font-poppins-bold text-white text-lg'>
                                        {latestNotification.title}
                                    </Text>
                                </View>
                            </View>
                            {/* Bottom Section */}
                            <View className='mt-2'>
                                {/* Description */}
                                <Text className='font-poppins-medium text-white'>
                                    {latestNotification.description}
                                </Text>
                                {/* Episode Id + Read Report Button */}
                                <View className='flex-row items-center'>
                                    <Text className='font-poppins-medium text-white/70 text-sm mb-1'>
                                        Episode {latestNotification.data.episodeid}
                                    </Text>
                                    <TouchableOpacity
                                        activeOpacity={1}
                                        onPress={() => Linking.openURL(latestNotification.data.reportUrl)}
                                        className="flex-row self-start items-center bg-white/20 px-4 py-3 rounded-full ml-auto"
                                    >
                                        <Text className="font-poppins-semibold text-white text-xs mr-1">
                                            Read report
                                        </Text>
                                        <ArrowIcon />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Badge Progress */}
                    {currentBadge && userPoints != null && (
                        <View className="bg-white/10 rounded-2xl p-4 shadow-sm mt-4">
                            {/* Header: current points and next goal */}
                            <View className="flex-row items-center justify-between mb-4">
                                <View>
                                    <Text className="font-poppins-bold text-white text-xl">
                                        {String(userPoints)} pts
                                    </Text>
                                    <Text className="font-poppins text-white/70 text-xs">
                                        Your Points
                                    </Text>
                                </View>
                                {nextBadge && (
                                    <View className="items-end">
                                        <Text className="font-poppins-medium text-white/90 text-sm">
                                            {String(Math.max(0, nextBadge.pointsRequired - userPoints))} pts to go 🚀
                                        </Text>
                                        <Text className="font-poppins text-white/70 text-xs">
                                            Next: {nextBadge.icon ? String(nextBadge.title) : '—'}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Progress Section */}
                            <View className="space-y-3">
                                <View className="flex-row items-center">

                                    {/* Current Badge */}
                                    <View className="items-center mr-3">
                                        <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mb-1">
                                            <Text className="text-lg">
                                                {currentBadge.icon ? String(currentBadge.icon) : ''}
                                            </Text>
                                        </View>
                                        <Text className="font-poppins text-white/80 text-xs">
                                            {currentBadge.pointsRequired != null ? String(currentBadge.pointsRequired) : '0'}
                                        </Text>
                                    </View>

                                    {/* Progress Bar */}
                                    <View className="flex-1 mx-2 mb-4">
                                        <View className="bg-white/20 rounded-full h-2 overflow-hidden">
                                            <View
                                                className="h-2 bg-emerald-500 rounded-full"
                                                style={{
                                                    width: `${nextBadge && nextBadge.pointsRequired !== currentBadge.pointsRequired
                                                        ? Math.min(
                                                            100,
                                                            ((userPoints - currentBadge.pointsRequired) /
                                                                (nextBadge.pointsRequired - currentBadge.pointsRequired)) *
                                                            100
                                                        )
                                                        : 0
                                                        }%`,
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {/* Next Badge */}
                                    {nextBadge && (
                                        <View className="items-center ml-3">
                                            <View className="w-10 h-10 bg-white/10 border-2 border-white/30 rounded-full items-center justify-center mb-1">
                                                <Text className="text-lg opacity-70">
                                                    {nextBadge.icon ? String(nextBadge.icon) : ''}
                                                </Text>
                                            </View>
                                            <Text className="font-poppins text-white/80 text-xs">
                                                {nextBadge.pointsRequired != null ? String(nextBadge.pointsRequired) : '0'}
                                            </Text>
                                        </View>
                                    )}

                                </View>

                                {/* Progress percentage + CTA */}
                                <View className="flex-row justify-between items-center mt-2">
                                    <Text className="font-poppins text-white/60 text-xs">
                                        Progress: {Math.round(
                                            nextBadge && nextBadge.pointsRequired !== currentBadge.pointsRequired
                                                ? ((userPoints - currentBadge.pointsRequired) /
                                                    (nextBadge.pointsRequired - currentBadge.pointsRequired)) *
                                                100
                                                : 0
                                        )}
                                        %
                                    </Text>
                                    <TouchableOpacity
                                        className="flex-row items-center bg-white/20 px-4 py-3 rounded-full"
                                        onPress={() => navigation.navigate('Prepare', { screen: 'PrepareMain' })}
                                    >
                                        <Text className="font-poppins-md text-white text-xs mr-1">
                                            Earn more points!
                                        </Text>
                                        <ArrowIcon />
                                    </TouchableOpacity>
                                </View>

                            </View>
                        </View>
                    )}


                    {/* Quiz & Checklist Progress */}
                    <View className='mt-4'>
                        {/* Monthly Checklist Streak Progress */}
                        {recurringChecklistsWithProgress
                            .filter((cl) => cl.frequency === 'monthly') // Only show monthly checklists
                            .map((cl) => {
                                const completedPeriods = cl.completedPeriods.filter((period) =>
                                    period.startsWith(`month-${currentYear}`)
                                );

                                // Get completed month numbers (e.g. "month-2025-08" -> 8)
                                const completedMonthNumbers = completedPeriods.map((period) =>
                                    parseInt(period.split('-')[2])
                                );

                                // Start from first completed month
                                const firstMonth = Math.min(...completedMonthNumbers);
                                const monthsToRender = Array.from(
                                    { length: 12 - (firstMonth - 1) },
                                    (_, i) => firstMonth + i
                                );

                                return (
                                    <View
                                        key={cl.id}
                                        className="bg-white/10 rounded-3xl px-5 py-4 shadow-sm mb-4"
                                    >
                                        {/* Title */}
                                        <Text className="font-poppins-bold text-base text-white mb-1">
                                            📦 {cl.title}
                                        </Text>

                                        {completedMonthNumbers.length === 0 ? (
                                            // User hasn't completed any months yet
                                            <Text className="font-poppins text-sm text-white">
                                                You haven’t completed this checklist yet. Start this month to stay prepared!
                                            </Text>
                                        ) : (
                                            <>
                                                {/* Subtitle / Streak count */}
                                                <Text className="font-poppins text-sm text-white/70 mb-4">
                                                    🔥 {completedMonthNumbers.length}-month streak!
                                                </Text>

                                                {/* Streak bar */}
                                                <View className="flex-row flex-wrap gap-2">
                                                    {monthsToRender.map((monthNumber, index) => {
                                                        const isCompleted = completedMonthNumbers.includes(monthNumber);

                                                        // Convert month number to short name (e.g. 8 -> Aug)
                                                        const monthLabel = new Date(
                                                            currentYear,
                                                            monthNumber - 1
                                                        ).toLocaleString('default', { month: 'short' });

                                                        return (
                                                            <View
                                                                key={index}
                                                                className={`w-10 h-10 rounded-full items-center justify-center ${isCompleted ? 'bg-green-500' : 'bg-white/20'
                                                                    }`}
                                                            >
                                                                <Text className="text-white font-poppins text-xs">
                                                                    {monthLabel}
                                                                </Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </>
                                        )}
                                    </View>
                                );
                            })}
                    </View>

                    {/* Recommended */}
                    <View>
                        {/* Recommended Quizzes */}
                        <View className="bg-white/10 rounded-3xl p-5 shadow-sm mb-4">
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="font-poppins-bold text-white text-lg">
                                    📚 Recommended Quizzes
                                </Text>
                                <TouchableOpacity
                                    className="flex-row items-center bg-white/20 px-4 py-3 rounded-full"
                                    onPress={() => navigation.navigate('Prepare', { screen: 'PrepareMain', params: { openQuizList: true } })}
                                >
                                    <Text className="font-poppins text-white text-xs mr-1">View all</Text>
                                    <ArrowIcon />
                                </TouchableOpacity>
                            </View>

                            {/* Quiz Cards Container */}
                            <View className="overflow-hidden rounded-2xl">
                                <FlatList
                                    horizontal
                                    data={recommendedQuizzes}
                                    keyExtractor={(item) => item.id}
                                    showsHorizontalScrollIndicator={false}
                                    pagingEnabled
                                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                                    decelerationRate="fast"
                                    onScroll={handleScrollQuizzes}
                                    scrollEventThrottle={16}
                                    contentContainerStyle={{ paddingHorizontal: 0 }}
                                    renderItem={({ item, index }) => (
                                        <View style={{
                                            width: CARD_WIDTH,
                                            marginRight: index === recommendedQuizzes.length - 1 ? 0 : CARD_SPACING
                                        }}>
                                            <View className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/30">
                                                {/* Quiz Icon & Title */}
                                                <View className="flex-row items-center mb-3">
                                                    <View className="w-10 h-10 bg-blue-500/20 rounded-full items-center justify-center mr-3">
                                                        <Text className="text-lg">🧠</Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-gray-900 font-poppins-bold text-base leading-tight">
                                                            {item.title}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Quiz Info */}
                                                <View className="flex-row items-center justify-between">
                                                    <View className="flex-row items-center">
                                                        <Text className="text-gray-600 font-poppins text-sm">
                                                            📝 {item.questions.length} questions
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            navigation.navigate('Prepare', {
                                                                screen: 'PrepareMain',
                                                                params: { openQuiz: item },
                                                            })
                                                        }
                                                    >
                                                        <View className="bg-emerald-500/20 px-4 py-3 rounded-full">
                                                            <Text className="text-emerald-700 font-poppins-medium text-xs">
                                                                Start Quiz
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                />
                            </View>

                            {/* Dots Indicator */}
                            <View className="flex flex-row justify-center mt-3">
                                {recommendedQuizzes.map((_, index) => (
                                    <View
                                        key={index}
                                        className={`mx-1 w-2 h-2 rounded-full ${index === activeIndexQuizzes ? 'bg-white' : 'bg-white/50'}`}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Recommended Guides */}
                        <View className='bg-white/10 rounded-3xl p-5'>
                            {/* Header */}
                            <View className="flex-row items-center justify-between mb-6">
                                <View className="flex-row items-start">
                                    <View className='mt-1'>
                                        <Text className="text-xl">⚡️</Text>
                                    </View>
                                    <View>
                                        <Text className="font-poppins-bold text-white text-lg">
                                            Emergency Guides
                                        </Text>
                                        <Text className="font-poppins text-white/70 text-sm">
                                            Based on your location
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    className="flex-row items-center bg-white/20 px-4 py-3 rounded-full"
                                    onPress={() => navigation.navigate('Learn', { screen: 'LearnMain', params: { openEmergencyList: true } })}
                                >
                                    <Text className="font-poppins text-white text-xs mr-1">View all</Text>
                                    <ArrowIcon />
                                </TouchableOpacity>
                            </View>

                            {/* Guides Cards Container */}
                            <View className='rounded-2xl overflow-hidden'>
                                <FlatList
                                    horizontal
                                    data={recommendedEmergencyGuides}
                                    keyExtractor={(_, index) => index.toString()}
                                    showsHorizontalScrollIndicator={false}
                                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                                    contentContainerStyle={{ paddingHorizontal: 0 }}
                                    decelerationRate="fast"
                                    onScroll={handleScrollGuides}
                                    scrollEventThrottle={16}
                                    renderItem={({ item, index }) => (
                                        <View
                                            style={{
                                                width: CARD_WIDTH,
                                                marginRight: index === recommendedEmergencyGuides.length - 1 ? 0 : CARD_SPACING
                                            }}
                                        >
                                            <View className='rounded-2xl overflow-hidden'>
                                                <View className="rounded-2xl shadow-2xl bg-white/10">
                                                    {/* Guide Image */}
                                                    <View className="relative">
                                                        <RNImage
                                                            source={disasterImages[item.imageKey]}
                                                            resizeMode="cover"
                                                            style={{
                                                                width: '100%',
                                                                height: 160,
                                                                borderTopLeftRadius: 16,
                                                                borderTopRightRadius: 16
                                                            }}
                                                        />
                                                        {/* Overlay gradient for better text readability */}
                                                        <View className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                                        {/* Emergency badge */}
                                                        <View className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                                            <Text className="text-white font-poppins-bold text-xs">EMERGENCY</Text>
                                                        </View>
                                                    </View>

                                                    {/* Card Content */}
                                                    <View className="p-5">
                                                        {/* Guide Title */}
                                                        <View className="flex-row items-center mb-3">
                                                            <View className="w-8 h-8 bg-red-500/20 rounded-lg items-center justify-center mr-3">
                                                                <Text className="text-sm">🚨</Text>
                                                            </View>
                                                            <View className="flex-1">
                                                                <Text className="text-white font-poppins-bold text-base leading-tight">
                                                                    {item.title}
                                                                </Text>
                                                                <Text className="text-white/70 font-poppins text-xs mt-1">
                                                                    Emergency Response Guide
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        {/* Quick Info */}
                                                        <View className="flex-row items-center justify-between">
                                                            <View className="flex-row items-center">
                                                                <View className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                                                                <Text className="text-white/80 font-poppins text-xs">
                                                                    Ready to read
                                                                </Text>
                                                            </View>

                                                            {/* Action Button */}
                                                            <TouchableOpacity className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30"
                                                                onPress={() =>
                                                                    navigation.navigate('Learn', {
                                                                        screen: 'LearnMain',
                                                                        params: { openEmergencyDetail: item },
                                                                    })
                                                                }
                                                            >
                                                                <Text className="text-white font-poppins-medium text-xs">
                                                                    Read Guide →
                                                                </Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                />

                                {/* Dots Indicator */}
                                <View className="flex-row justify-center mt-5 px-6">
                                    {recommendedEmergencyGuides.map((_, index) => (
                                        <View
                                            key={index}
                                            className={`mx-1 w-2 h-2 rounded-full ${index === activeIndexGuides ? 'bg-white' : 'bg-white/40'
                                                }`}
                                        />
                                    ))}
                                </View>

                                {/* Bottom info */}
                                <View className="px-6 mt-4 mb-2">
                                    <View className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                        <View className="flex-row items-center">
                                            <View className="w-8 h-8 bg-blue-500/20 rounded-lg items-center justify-center mr-3">
                                                <Text className="text-sm">💡</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-white/90 font-poppins-medium text-sm">
                                                    Stay Prepared
                                                </Text>
                                                <Text className="text-white/70 font-poppins text-xs mt-0.5">
                                                    These guides are recommended based on disaster risks in {countryName || 'your area'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

export default Home;