// React Imports
import React from 'react'
// Navigation Imports
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Components Imports
import Home from '../components/Home';
import Notifications from '../components/Notifications';
import Settings from '../components/Settings';

// Home stack type
export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  Settings: undefined;
}

// Create stack navigator
const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name='Home' component={Home} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name='Settings' component={Settings} />
    </Stack.Navigator>
  )
}

export default HomeStack