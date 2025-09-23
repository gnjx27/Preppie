// React Imports
import React from 'react'
// Navigation Imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Firebase Imports
import { User } from 'firebase/auth';
// Component Imports
import MainStack from './MainStack';
import AuthStack from './AuthStack';

// RootStackParamList type for navigation
export type RootStackParamList = {
    Home: undefined;
    MainTabs: undefined;
    AuthStack: undefined;
}

// RootStackNavigator Props type
type RootStackNavigatorProps = {
    user: User | null;
}

// Create root stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator: React.FC<RootStackNavigatorProps> = ({ user }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
            <Stack.Screen name='MainTabs' component={MainStack}/>
        ) : (
            <Stack.Screen name='AuthStack' component={AuthStack} />
        )}
    </Stack.Navigator>
  )
}

export default RootStackNavigator