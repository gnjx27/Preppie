// React Imports
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
// Navigation Imports
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
// Components
import RootStackNavigator from './navigation/RootStackNavigator';
// Firebase Imports
import { auth } from './firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
// Global CSS Imports
import './global.css';
// Font Imports
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Courgette_400Regular } from '@expo-google-fonts/courgette';

// Custom theme for navigation
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#24255E',
  },
};

const app = () => {
  // States
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Courgette_400Regular,
  });

  // Set listener for user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer theme={MyTheme}>
      <RootStackNavigator user={user} />
    </NavigationContainer>
  );
}

export default app;
