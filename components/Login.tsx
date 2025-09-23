// React Imports
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Firebase Imports
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthStack';
// Icon Imports
import { Feather } from '@expo/vector-icons';

// Props type for navigation
type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const Login = ({ navigation }: Props) => {
  // States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle login
  const handleLogin = async () => {
    // Input validation
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    // Try Firebase login
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Successful login: clear loginError and continue
      setLoginError('');
    } catch (err: any) {
      // Failed login: set error message
      if (err.code === 'auth/invalid-credential') {
        setLoginError('Incorrect email or password.');
      }
      else {
        setLoginError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <SafeAreaView className='flex-1 justify-center items-center'>
      <View className='w-4/5 h-5/6 flex-col justify-between'>
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
          {/* Loggin subtitle */}
          <Text className='font-poppins-medium text-white text-center mt-4 text-lg'>Login</Text>
          {/* Email input field  */}
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
        </View>
        {/* Bottom Section */}
        <View>
          {/* Error message */}
          {loginError !== '' && (
            <Text className="text-center font-poppins-medium text-red-500 mt-2">{loginError}</Text>
          )}
          {/* Login button & don't have an account */}
          <View>
            {/* Login button */}
            <TouchableOpacity onPress={() => handleLogin()} className='flex-row justify-center items-center bg-[#5576F6] shadow-sm mt-6 h-14 px-6 rounded-full w-full'>
              <Text className='text-xl text-center font-poppins-medium text-white'>Login</Text>
            </TouchableOpacity>
            {/* Don't have an account */}
            <View className='flex-row items-center justify-center w-full mt-4'>
              <Text className='text-white font-poppins-medium mr-2'>
                Don't have an account?
              </Text>
              <Text className='underline font-poppins-bold text-[#CAEFDD]' onPress={() => navigation.navigate('Register')}>
                Sign up
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default Login