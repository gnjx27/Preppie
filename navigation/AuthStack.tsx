// React Imports
import React from 'react'
// Navigation Imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Components Imports
import Login from '../components/Login';
import Register from '../components/Register';

// AuthStackParamList type for navigation
export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
}

// Create auth stack navigator
const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
    return (
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="Login"
                component={Login}
            />
            <Stack.Screen
                name="Register"
                component={Register}
            />
        </Stack.Navigator>
    )
}

export default AuthStack