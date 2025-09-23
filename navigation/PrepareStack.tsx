// React Imports
import { View, Text } from 'react-native'
import React from 'react'
// Navigation Imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Component Imports
import Prepare from '../components/Prepare';
import QuizList from '../components/QuizList';
import QuizDetail from '../components/QuizDetail';
import ChecklistList from '../components/ChecklistList';
import ChecklistDetail from '../components/ChecklistDetail';
// Type Imports
import { Quiz, ChecklistWithStatus } from '../types'

// PrepareStackParamList type for nested prepare stack navigation
export type PrepareStackParamList = {
    PrepareMain: { openQuizList?: boolean; openChecklistList?: boolean; openQuiz?: Quiz } | undefined;
    QuizList: undefined;
    QuizDetail: { quiz: Quiz };
    ChecklistList: undefined;
    ChecklistDetail: { checklist: ChecklistWithStatus };
}

// Create prepare stack navigator
const Stack = createNativeStackNavigator<PrepareStackParamList>();

const PrepareStack = () => {    
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PrepareMain" component={Prepare} />
            <Stack.Screen name="QuizList" component={QuizList} />
            <Stack.Screen name="QuizDetail" component={QuizDetail} />
            <Stack.Screen name="ChecklistList" component={ChecklistList} />
            <Stack.Screen name="ChecklistDetail" component={ChecklistDetail} />
        </Stack.Navigator>
    );
}

export default PrepareStack