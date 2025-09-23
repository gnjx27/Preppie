// React Imports
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrepareStackParamList } from '../navigation/PrepareStack';
// Firebase Imports
import { DocumentData } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg';
import ChecklistCheckedIcon from '../assets/icons/ChecklistCheckedIcon.svg';
// Utils Imports
import { getCurrentPeriod } from '../services/utils';
// Lottie Animation Imports
import LottieView from 'lottie-react-native';
// Service Imports
import { getChecklistProgress, updateChecklistProgress } from '../services/userServices';

// Props type for navigation
type Props = NativeStackScreenProps<PrepareStackParamList, 'ChecklistDetail'>;

const ChecklistDetail = ({ route, navigation }: Props) => {
    // Get checklist from route params (the modified checklist item from the ChecklistList screen)
    const { checklist } = route.params;

    // Get user
    const user = auth.currentUser!;

    // States
    const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
    const [showAnimation, setShowAnimation] = useState<boolean>(false);
    const [pointsAnimation] = useState(new Animated.Value(0));
    const [animationText, setAnimationText] = useState<string>('');
    const [progressDoc, setProgressDoc] = useState<DocumentData>();

    // Fetch checklist progress when component mounts or checklist changes
    useEffect(() => {
        const fetchProgress = async () => {
            try { // Fetch checklist progress (which items are checked)
                const checklistProgress = await getChecklistProgress(user.uid, checklist.id);
                if (checklistProgress) {
                    setProgressDoc(checklistProgress);
                    setCheckedItems(checklistProgress?.checkedItems || Array(checklist.items.length).fill(false));
                } else {
                    setCheckedItems(new Array(checklist.items.length).fill(false)); // default unchecked
                }
            } catch (err: any) {
                console.error('Failed to fetch checklist progress:', err.message);
                setCheckedItems(new Array(checklist.items.length).fill(false));
            }
        };

        fetchProgress();
    }, [checklist]);

    const saveProgress = async () => {
        // Check if checklist is fully completed
        const isFullyCompleted = checkedItems.every(item => item === true);

        // Determine if points should be awarded based on existing progressDoc
        let awardPoints = false;
        let pointsToAward = 0;

        // If checklist is fully completed
        if (isFullyCompleted) {
            if (checklist.type === 'recurring') { // If checklist type is recurring
                // Get current completion period
                const currentPeriod = getCurrentPeriod(checklist.frequency ?? 'none');
                // const currentPeriod = `month-2025-10`; // FOR TESTING
                // Get list of completed periods for checklist
                const completedPeriods: string[] = Array.isArray(progressDoc?.completedPeriods)
                    ? progressDoc.completedPeriods
                    : [];
                // If current period not in completed periods (new period) -> award points
                if (!completedPeriods.includes(currentPeriod)) {
                    awardPoints = true;
                    pointsToAward = 100;
                }
            } else { // If checklist type is one-time
                if (!progressDoc?.isCompleted) { // If checklist has not been completed before -> award points
                    awardPoints = true;
                    pointsToAward = 50;
                }
            }

            // Start animation immediately with correct text
            setAnimationText(
                awardPoints
                    ? `🎉 Checklist completed! +${pointsToAward} points`
                    : `🎉 Checklist completed!`
            );
            setShowAnimation(true);
            pointsAnimation.setValue(0);
            Animated.timing(pointsAnimation, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }).start();
        }

        // Update checklist progress in Firestore
        updateChecklistProgress(user.uid, checklist, checkedItems, isFullyCompleted, awardPoints, pointsToAward, progressDoc);

        // Show alert for partial completion only
        if (!isFullyCompleted) {
            Alert.alert(
                'Progress saved',
                `Your checklist progress has been saved.`,
                [
                    {
                        text: 'OK'
                    }
                ]
            );
        }
    };

    // Toggle item checked state
    const toggleItem = (index: number) => {
        setCheckedItems(prev => {
            const updated = [...prev];
            updated[index] = !updated[index];
            return updated;
        });
    };

    return (
        <SafeAreaView className='flex-1'>
            {/* Top Navigation */}
            <View className="h-16 flex-row items-center justify-between px-4 mt-4 mb-4">
                {/* Back Button (Left) */}
                <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
                    <BackButton width={45} height={45} />
                </TouchableOpacity>
                {/* Absolutely centered title */}
                <View className="absolute left-0 right-0 items-center">
                    <Text className="font-poppins-semibold text-white text-2xl">Checklist</Text>
                </View>
                {/* Spacer for alignment (Right) */}
                <View style={{ width: 45 }} />
            </View>
            {/* Confetti Animation */}
            {showAnimation && (
                <View className="absolute inset-0 justify-center items-center bg-black/50 z-50">
                    <LottieView
                        source={require('../assets/animations/successConfetti.json')}
                        autoPlay
                        loop={false}
                        style={{
                            width: '60%',
                            maxWidth: 300,
                            aspectRatio: 1,
                        }}
                        onAnimationFinish={() => setShowAnimation(false)}
                    />
                    {/* Points Text */}
                    <View className="absolute" style={{ top: '60%' }}>
                        <Text className="font-bold text-xl text-yellow-400">
                            {animationText}
                        </Text>
                    </View>
                </View>
            )}

            {/* Checklist Section */}
            <View className='px-6 flex-1 mb-10'>
                {/* Checklist Card */}
                <View className='flex-1 px-6 bg-white rounded-3xl py-6'>
                    {/* Checklist Content */}
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Checklist Title & Description */}
                        <Text className='font-poppins-semibold text-base mt-2 mb-2'>{checklist.title}</Text>
                        <Text className='font-poppins-medium text-sm text-[#676C73] mb-4'>{checklist.description}</Text>
                        {/* Checklist Options */}
                        {checklist.items.map((item: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={1}
                                onPress={() => toggleItem(index)}
                                className={`flex-row justify-between px-4 py-3 rounded-xl border
                                    ${checkedItems[index] ? 'bg-[#DCFCE7] border-[#17A34A]' : 'border-[#D9D9D9]'} mb-3`}
                            >
                                {/* Option Text */}
                                <Text className="font-poppins-medium text-sm text-[#555D6A] flex-1 pr-3">
                                    {item}
                                </Text>
                                {/* Checked Icon */}
                                <View className="w-6 h-6">
                                    {checkedItems[index] ? ( // Show icon if selected only
                                        <ChecklistCheckedIcon />
                                    ) : (
                                        <ChecklistCheckedIcon style={{ opacity: 0 }} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                        {/* Save Progress Button */}
                        <TouchableOpacity onPress={saveProgress} className='bg-[#6980FB] mt-6 mb-6 py-2 rounded-full shadow-sm'>
                            <Text className='font-poppins-semibold text-base text-center text-white'>Save Progress</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ChecklistDetail;
