// React Imports
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Button, Image, TouchableOpacity } from 'react-native';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../navigation/LearnStack';
// Service Imports
import { replaceEmergencyNumbers } from '../services/locationServices';
// Async Imports
import AsyncStorage from "@react-native-async-storage/async-storage";
// Type Imports
import { EmergencyNumbersType } from '../types';
// Icon & Image Imports
import BackButton from '../assets/icons/BackButton.svg';
import { firstAidImages } from '../constants/imageMaps';
import FirstAidTitleIcon from '../assets/icons/FirstAidTitleIcon.svg';
import FirstAidSymptomIcon from '../assets/icons/FirstAidSymptomIcon.svg';
import DangerIconAfter from '../assets/icons/DangerIconAfter.svg';
import StepPoint from '../assets/icons/StepPoint.svg';

// Props type for navigation
type Props = NativeStackScreenProps<LearnStackParamList, 'FirstAidDetail'>;

// Define Step Background Colors
const stepColors = [
  '#FF6666', '#FF9044', '#7F93FF', '#52C87D', '#BB85ED', '#FF7F7F',
  '#FFD966', '#66CCFF', '#66FFCC', '#D291FF', '#66FFFF', '#FFB3C6'
];

const FirstAidDetail = ({ route, navigation }: Props) => {
  // Get guide from route parmas
  const { guide } = route.params;
  
  // States
  const [emergencyNumbers, setEmergencyNumbers] = useState<EmergencyNumbersType>();

  useEffect(() => {
    // Get emergency numbers from async storage
    const loadNumbers = async () => {
      const data = await AsyncStorage.getItem('emergencyNumbers');
      if (data) {
        setEmergencyNumbers(JSON.parse(data));
      }
    }
    loadNumbers();
  }, []);

  // Get ambulance number
  const ambulanceNumber = emergencyNumbers?.ambulance?.[0] || '';

  return (
    <View>
      {/* Top Navigation */}
      <View className="absolute z-10 top-16 h-16 flex-row items-center justify-between px-4 mt-4">
        {/* Back Button (absolute position on top left) */}
        <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
          <BackButton width={45} height={45} />
        </TouchableOpacity>

        {/* Spacer for alignment (Right) */}
        <View style={{ width: 45 }} />
      </View>
      <ScrollView>
        {/* Guide Image */}
        <Image
          resizeMode='cover'
          style={{ width: '100%', height: 250 }}
          source={firstAidImages[guide.imageKey]}
        />
        {/* Content */}
        <View className='px-7 pb-6'>
          {/* Guide Title & Description */}
          <View className='bg-[#FF4443] shadow-md rounded-2xl px-6 py-5 mt-6'>
            {/* Icon Title & Description */}
            <View className='flex-row'>
              {/* Icon */}
              <View className='mr-3'>
                <FirstAidTitleIcon width={48} height={48} />
              </View>
              {/* Title & Description */}
              <View className='flex-1'>
                <Text className='font-poppins-bold text-xl mb-1 text-white'>{guide.title}</Text>
                <Text className='font-poppins-medium text-xs text-white/80'>{guide.description}</Text>
              </View>
            </View>
            {/* Subtitle */}
            <View>
              <Text className='font-poppins-semibold text-white mt-2'>{guide['sub-title']}</Text>
            </View>
          </View>
          {/* Symptoms */}
          <View className='bg-white rounded-2xl mt-5 px-6 py-5'>
            {/* Icon Title & Description */}
            <View className='flex-row'>
              {/* Icon */}
              <View className='mr-3'>
                <FirstAidSymptomIcon width={48} height={48} />
              </View>
              {/* Title */}
              <View>
                <Text className='font-poppins-semibold text-lg text-[#101827] mb-1'>Recognize the Symptoms</Text>
                <Text className='font-poppins-medium text-sm text-[#555D6A]'>Warning signs to look out for</Text>
              </View>
            </View>
            {/* List of Symptoms */}
            <View className='px-4 mt-2'>
              {guide.symptoms.map((symptom: string, i: number) => (
                <View key={i} className='flex-row mt-2'>
                    <View className='mt-2 mr-4'><StepPoint /></View>
                    <Text className='font-poppins-medium text-[#555D6A]'>{symptom}</Text>
                </View>
              ))}
            </View>
          </View>
          {/* Steps */}
          <View className='bg-white rounded-2xl mt-5 px-6 py-5'>
            {/* Icon Title & Description */}
            <View className='flex-row'>
              {/* Icon */}
              <View className='mr-3'>
                <DangerIconAfter width={48} height={48} />
              </View>
              {/* Title + Description */}
              <View>
                <Text className='font-poppins-semibold text-lg text-[#101827] mb-1'>What to do?</Text>
                <Text className='font-poppins-medium text-sm text-[#555D6A]'>Follow these steps in order</Text>
              </View>
            </View>
            <View className="h-px w-full bg-gray-300 my-4" />
            {/* Steps List */}
            {guide.steps.map((stepItem: any, i: number) => {
              const stepBgColor = stepColors[i % stepColors.length];

              return (
                <View key={`step-${i}`} className="mb-4">
                  {/* Step block with background color */}
                  <View className="px-3 py-2 rounded-2xl" style={{ backgroundColor: stepBgColor }}>
                    <View className="flex-row items-start">
                      {/* Step number circle */}
                      <View className="bg-[#D9D9D9]/40 w-10 h-10 rounded-full items-center justify-center mr-4">
                        <Text className="font-poppins-bold text-white text-lg">{i + 1}</Text>
                      </View>
                      {/* Step text */}
                      <Text className="text-white font-poppins-semibold flex-1">
                        {replaceEmergencyNumbers(stepItem.step, ambulanceNumber)}
                      </Text>
                    </View>
                  </View>

                  {/* Optional Notes */}
                  {Array.isArray(stepItem.note) && stepItem.note.length > 0 && (
                    stepItem.note.map((note: string, j: number) => (
                      <View key={`note-${i}-${j}`} className="flex-row pl-4 pr-8 mt-3">
                        <View className="mr-4 mt-2">
                          <StepPoint />
                        </View>
                        <Text className="font-poppins-medium text-[#555D6A]">
                          {replaceEmergencyNumbers(note, ambulanceNumber)}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 18, fontStyle: 'italic', marginBottom: 12 },
  description: { fontSize: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  listItem: { fontSize: 16, marginLeft: 8, marginBottom: 4 },
  note: { fontSize: 14, color: 'gray', marginLeft: 16 }
});

export default FirstAidDetail;
