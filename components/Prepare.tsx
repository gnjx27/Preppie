// React Imports
import { View, Text, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react'
// Navigation Imports
import { CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrepareStackParamList } from '../navigation/PrepareStack';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg';

// Props type for navigation
type Props = NativeStackScreenProps<PrepareStackParamList, 'PrepareMain'>;

const Prepare = ({ navigation, route }: Props) => {
    // Check navigation flag from route params (navigating from home)
    useEffect(() => {
        if (route.params?.openQuizList) {
            navigation.setParams({ openQuizList: false });
            navigation.navigate('QuizList');
        } else if (route.params?.openChecklistList) {
            navigation.setParams({ openChecklistList: false });
            navigation.navigate('ChecklistList');
        } else if (route.params?.openQuiz) {
            const quiz = route.params.openQuiz;

            navigation.dispatch(
                CommonActions.reset({
                    index: 2,
                    routes: [
                        { name: 'PrepareMain' },
                        { name: 'QuizList' },
                        { name: 'QuizDetail', params: { quiz }}
                    ],
                })
            );
        }
    }, [route.params])

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
                    <Text className="font-poppins-semibold text-white text-2xl">Prepare</Text>
                </View>
                {/* Spacer for alignment (Right) */}
                <View style={{ width: 45 }} />
            </View>
            {/* Quizzes */}
            <View className='mt-4 flex-col items-center'>
                {/* Quizzes Title */}
                <Text className='text-white font-poppins-semibold text-xl'>Quizzes</Text>
                {/* Quizzes Image */}
                <View className='mt-4'>
                    <TouchableOpacity onPress={() => navigation.navigate('QuizList')}>
                        <Image
                            source={require('../assets/images/QuizzesImage.png')}
                            resizeMode='cover'
                        />
                    </TouchableOpacity>
                </View>
            </View>
            {/* Checklists */}
            <View className='mt-5 flex-col items-center'>
                {/* Checklists Title */}
                <Text className='text-center text-white font-poppins-semibold text-xl'>Checklists</Text>
                {/* Checklists Image */}
                <View className='mt-4'>
                    <TouchableOpacity onPress={() => navigation.navigate('ChecklistList')}>
                        <Image
                            source={require('../assets/images/ChecklistsImage.png')}
                            resizeMode='cover'
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Prepare