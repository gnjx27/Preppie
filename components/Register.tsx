// React Imports
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';
// Firebase Imports
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
// Icon Imports
import Feather from 'react-native-vector-icons/Feather';

// Props type for navigation
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const Register = ({ navigation }: Props) => {
  // States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassowrd] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle register
  const handleRegister = async () => {
    // Input validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    // Try register user with Firebase
    try {
      // 1. Create auth account 
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // 2. Save username in Firebase authentication
      await updateProfile(user, {
        displayName: username,
      });
      // // 3. Give user 0 points in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        points: 0,
        earnedBadges: ['sZrcPApAPWlBYTtLN5zY'],
      });
      Alert.alert('Success', 'Account created!');
    } catch (err: any) {
      Alert.alert('Register Error', err.message);
    }
  }

  return (
    <SafeAreaView className='flex-1 justify-center items-center'>
      <KeyboardAvoidingView
        className="w-full"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0} // adjust if needed
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className='w-4/5 flex-col justify-between'>
            {/* Top Section */}
            <View>
              {/* Image */}
              <View className='flex flex-row justify-center'>
                <Image
                  source={require('../assets/images/LoginImage.png')}
                  className='h-44'
                  resizeMode='contain'
                />
              </View>
              {/* Preppie Title */}
              <Text className='font-courgette text-white text-center text-5xl mt-2'>Preppie</Text>
              {/* Sign up subtitle */}
              <Text className='font-poppins-medium text-white text-center mt-4 text-lg'>Sign up</Text>
              {/* Username input field */}
              <View className='flex-row items-center bg-white shadow-sm mt-6 h-14 px-6 w-full rounded-full'>
                <TextInput
                  className='font-poppins-medium text-black/70 h-full w-full'
                  placeholder="Username"
                  autoCapitalize="none"
                  onChangeText={setUsername}
                  value={username}
                  placeholderTextColor="rgba(0, 0, 0, 0.7)"
                />
              </View>
              {/* Email input field */}
              <View className='flex-row items-center bg-white shadow-sm mt-6 h-14 px-6 w-full rounded-full'>
                <TextInput
                  className='font-poppins-medium text-black/70 h-full w-full'
                  placeholder="Email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  value={email}
                  placeholderTextColor="rgba(0, 0, 0, 0.7)"
                />
              </View>
              {/* Password input field */}
              <View className='flex-row items-center bg-white shadow-sm mt-6 h-14 px-6 w-full rounded-full'>
                <TextInput
                  className='font-poppins-medium text-black/70 h-full flex-1'
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  value={password}
                  placeholderTextColor="rgba(0, 0, 0, 0.7)"
                />
                <TouchableOpacity activeOpacity={1} onPress={() => setShowPassword(!showPassword)}>
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#999" />
                </TouchableOpacity>
              </View>
              {/* Confirm password input field */}
              <View className='flex-row items-center bg-white shadow-sm mt-6 h-14 px-6 w-full rounded-full'>
                <TextInput
                  className='font-poppins-medium text-black/70 h-full flex-1'
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirmPassword}
                  onChangeText={setConfirmPassowrd}
                  value={confirmPassword}
                  placeholderTextColor="rgba(0, 0, 0, 0.7)"
                />
                <TouchableOpacity activeOpacity={1} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </View>
            {/* Bottom Section */}
            <View>
              {/* Sign up button & already have an account */}
              <View>
                {/* Login button */}
                <TouchableOpacity onPress={() => handleRegister()} className='flex-row justify-center items-center bg-[#5576F6] shadow-sm mt-6 h-14 px-6 rounded-full w-full'>
                  <Text className='text-xl text-center font-poppins-medium text-white'>Sign up</Text>
                </TouchableOpacity>
                {/* Already have an account */}
                <View className='flex-row items-center justify-center w-full mt-4'>
                  <Text className='text-white font-poppins-medium mr-2'>
                    Already have an account?
                  </Text>
                  <Text className='underline font-poppins-bold text-[#CAEFDD]' onPress={() => navigation.navigate('Login')}>
                    Login
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Register