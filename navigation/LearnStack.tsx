// React Imports
import React from 'react'
// Navigation Imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Component Imports
import Learn from '../components/Learn';
import EmergencyList from '../components/EmergencyList';
import EmergencyDetail from '../components/EmergencyDetail';
import FirstAidList from '../components/FirstAidList';
import FirstAidDetail from '../components/FirstAidDetail';
// Data Imports
import emergencyGuides from '../assets/data/emergencyGuides.json';
import firstAidGuides from '../assets/data/firstAid.json';

// LearnStackParamList type for nested learn stack navigation
export type LearnStackParamList = {
    LearnMain: { openEmergencyDetail?: typeof emergencyGuides[0]; openEmergencyList?: boolean; } | undefined;
    EmergencyList: undefined;
    EmergencyDetail: { guide: typeof emergencyGuides[0] };
    FirstAidList: undefined;
    FirstAidDetail: { guide: typeof firstAidGuides[0] };
}

// Create learn stack navigator
const Stack = createNativeStackNavigator<LearnStackParamList>();

const LearnStack = () => {    
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="LearnMain" component={Learn} />
            <Stack.Screen name="EmergencyList" component={EmergencyList} />
            <Stack.Screen name="EmergencyDetail" component={EmergencyDetail} />
            <Stack.Screen name="FirstAidList" component={FirstAidList} />
            <Stack.Screen name="FirstAidDetail" component={FirstAidDetail} />
        </Stack.Navigator>
    );
}

export default LearnStack