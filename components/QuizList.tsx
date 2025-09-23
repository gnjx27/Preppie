// React Imports
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrepareStackParamList } from '../navigation/PrepareStack';
// Firebase Imports
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
// Type Imports
import { QuizResult, QuizWithScore } from '../types';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg';
// Service Imports
import { getQuizzes } from '../services/quizServices';

// Props type for navigation
type Props = NativeStackScreenProps<PrepareStackParamList, 'QuizList'>;

// Define Step Background Colors
const quizColors = [
    '#FF6666', '#FF9044', '#7F93FF', '#52C87D', '#BB85ED', '#FF7F7F',
    '#FFD966', '#66CCFF', '#33CC99', '#D291FF', '#33CCCC', '#FFB3C6'
];

const QuizList = ({ navigation }: Props) => {
    // State management for quizzes and loading
    const [quizzes, setQuizzes] = useState<QuizWithScore[]>([]);

    // Load cached quizzes first, then fetch from Firestore
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                // 1. Load quizzes from AsyncStorage
                const cached = await AsyncStorage.getItem('quizzes');
                if (cached) {
                    const parsed: QuizWithScore[] = JSON.parse(cached);
                    setQuizzes(parsed);
                }

                // 2. Fetch quizzes from Firstore
                const quizList: QuizWithScore[] = await getQuizzes();

                // 3. Preserve any existing user-specific results already in state
                setQuizzes((prevQuizzes) => {
                    const prevResults = new Map(prevQuizzes.map(q => [q.id, q]));
                    return quizList.map((quiz) => {
                        const existing = prevResults.get(quiz.id);
                        return {
                            ...quiz,
                            score: existing?.score,
                            isCompleted: existing?.isCompleted,
                            completedTimestamp: existing?.completedTimestamp
                        };
                    });
                });
                
                // 4. Save fresh list to cache
                await AsyncStorage.setItem('quizzes', JSON.stringify(quizList));
            } catch (err: any) {
                console.error('Error fetching quizzes: ', err.message);
            }
        }
        fetchQuizzes();
    }, []);

    // Subscribe to real-time updates for user quiz results from Firestore
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const quizResults: Record<string, QuizResult> = data.quizResults || {};

                // Merge quiz results into existing quiz list
                setQuizzes((prevQuizzes) =>
                    prevQuizzes.map((quiz) => {
                        const result = quizResults[quiz.id];
                        return {
                            ...quiz,
                            score: result?.score,
                            isCompleted: result?.isCompleted,
                            completedTimestamp: result?.completedTimestamp,
                        };
                    })
                );
            }
        });
        return () => unsubscribe();
    }, []);

    if (quizzes.length === 0) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text className='text-white'>loading quizzes...</Text>
            </View>
        );
    }

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
                    <Text className="font-poppins-semibold text-white text-2xl">Quizzes</Text>
                </View>
                {/* Spacer for alignment (Right) */}
                <View style={{ width: 45 }} />
            </View>
            {/* Quiz List */}
            <View className='px-6'>
                <FlatList
                    data={quizzes}
                    keyExtractor={(item, index) => item.title + index.toString()}
                    contentContainerStyle={{ paddingBottom: 200 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                        // Determine background color
                        const bgColor = quizColors[index % quizColors.length];

                        // Determine completion status
                        const getCompletionStatus = () => {
                            if (item.score === undefined) {
                                return "Not Started";
                            } else if (item.isCompleted) {
                                return "Completed";
                            } else {
                                return "In Progress";
                            }
                        }

                        return (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => navigation.navigate('QuizDetail', { quiz: item })}
                                className='shadow-md mb-6'
                            >
                                <View style={{ backgroundColor: bgColor }} className='rounded-3xl px-6 py-4 flex-row justify-between'>
                                    {/* Quiz Title & Number of Questions */}
                                    <View className='flex-1 mr-5'>
                                        <Text className="text-white font-poppins-bold text-lg">{item.title}</Text>
                                        <Text className="text-white text-base mt-1 font-poppins-medium">
                                            {item.questions.length} {item.questions.length === 1 ? 'question' : 'questions'} • 25pts
                                        </Text>
                                        <Text className="font-poppins-medium text-white text-base mt-1">
                                            Best score • {item.score !== undefined ? `${item.score}%` : '0%'}
                                        </Text>
                                    </View>
                                    {/* Completion Status */}
                                    <View className={`self-start px-3 pb-1 rounded-full backdrop-blur-sm bg-white/20 border border-white/30`}>
                                        <Text className={`text-white font-poppins-medium text-base mt-1`}>
                                            {getCompletionStatus()}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )
                    }
                    } />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    center: { justifyContent: 'center', alignItems: 'center' },
    item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#ccc' },
    title: { fontSize: 18, fontWeight: 'bold' },
    subtitle: { fontSize: 14, color: '#555', marginTop: 4 },
    score: { fontSize: 14, color: '#007AFF', marginTop: 4 },
});

export default QuizList;
