// React Imports
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Dimensions, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../navigation/LearnStack';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg';
import StepPoint from '../assets/icons/StepPoint.svg';
import DangerIconBefore from '../assets/icons/DangerIconBefore.svg';
import DangerIconDuring from '../assets/icons/DangerIconDuring.svg';
import DangerIconAfter from '../assets/icons/DangerIconAfter.svg';
// Async Storage Imports
import AsyncStorage from '@react-native-async-storage/async-storage';
// Type Imports
import { EmergencyNumbersType } from '../types';
// Service Imports
import { replaceEmergencyNumbers } from '../services/locationServices';
// Image Map Import
import { disasterImages } from '../constants/imageMaps';

// Props type for navigation
type Props = NativeStackScreenProps<LearnStackParamList, 'EmergencyDetail'>;

// Calculate card size
const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2); // 16px margin on each side

// Define Step Background Colors
const stepColors = [
  '#FF6666', '#FF9044', '#7F93FF', '#52C87D', '#BB85ED', '#FF7F7F',
  '#FFD966', '#66CCFF', '#66FFCC', '#D291FF', '#66FFFF', '#FFB3C6'
];

const EmergencyDetail = ({ route, navigation }: Props) => {
  // Get guide from route parameters
  const { guide } = route.params;

  // States 
  const [emergencyNumbers, setEmergencyNumbers] = useState<EmergencyNumbersType>();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Use ref for flat list
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Get emergency numbers from async storage
    const loadNumbers = async () => {
      const data = await AsyncStorage.getItem('emergencyNumbers');
      if (data) {
        setEmergencyNumbers(JSON.parse(data));
      }
    };
    loadNumbers();
  }, []);

  // Get ambulance number from emergencyNumbers
  const ambulanceNumber = emergencyNumbers?.ambulance?.[0] || '';

  // Carousell Data
  const carouselData = [
    {
      id: 'overview',
      title: guide.title,
      content: guide.description,
      imageKey: guide.imageKey,
      type: 'overview'
    },
    {
      id: 'before',
      title: 'before',
      content: guide.before,
      type: 'steps'
    },
    {
      id: 'during',
      title: 'during',
      content: guide.during,
      type: 'steps'
    },
    {
      id: 'after',
      title: 'after',
      content: guide.after,
      type: 'steps'
    }
  ];

  /**
   * Return card for guide description/overview
   * @param item 
   * @returns 
   */
  const renderOverviewCard = (item: any) => (
    <ScrollView showsVerticalScrollIndicator={false} className="rounded-3xl shadow-sm pb-5" style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }}>
      {/* Inside Flatlist Card Container */}
      <View className='bg-[#5576F6] rounded-3xl pb-4'>
        {/* Guide Image */}
        <Image
          source={disasterImages[item.imageKey]}
          resizeMode="cover"
          style={{ width: '100%', height: 200, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        />
        {/* Guide Description */}
        <View>
          <View className="px-6 mt-4">
            {item.content.map((desc: string, i: number) => (
              <Text key={i} className="text-white font-poppins-medium text-base mb-2">
                {desc}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  /**
   * Return card for guide steps
   * @param item 
   * @returns 
   */
  const renderStepsCard = (item: any) => {
    // Determine the correct icon based on title
    const renderDangerIcon = () => {
      switch (item.title.toLowerCase()) {
        case 'before':
          return <DangerIconBefore />;
        case 'during':
          return <DangerIconDuring />;
        case 'after':
          return <DangerIconAfter />;
        default:
          return null;
      }
    };

    return (
      <View className="bg-white rounded-3xl px-6 py-6 flex-1" style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN }}>
        {/* Inside Flatlist Card Container */}
        <View className="flex-1">
          {/* Top Section (icon title and description) */}
          <View className='flex-row mb-4'>
            {/* Dynamic Danger Icon */}
            <View className='mr-4'>
              {renderDangerIcon()}
            </View>
            {/* Title + Description */}
            <View>
              <Text className="font-poppins-semibold text-lg mb-1">What to do {item.title}</Text>
              <Text className='font-poppins-medium text-[#676C73]'>Follow these steps</Text>
            </View>
          </View>
          {/* Guide Steps */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {item.content.map((stepItem: any, i: number) => {
              // Determine which background color to use
              const stepBgColor = stepColors[i % stepColors.length];

              // Handle different formats (string vs object)
              if (typeof stepItem === 'string') {
                return (
                  <Text key={i} className="text-base mb-3 leading-6">
                    • {replaceEmergencyNumbers(stepItem, ambulanceNumber)}
                  </Text>
                );
              } else {
                return (
                  <View key={i} className="mb-4">
                    {/* Step name with dynamic background */}
                    <View className='px-4 py-3 rounded-3xl' style={{ backgroundColor: stepBgColor }}>
                      {/* Step number and name */}
                      <View className='flex-row'>
                        <View className='bg-[#D9D9D9]/40 w-10 h-10 rounded-full flex-row items-center justify-center mr-4'>
                          <Text className='font-poppins-bold text-white text-lg'>{i + 1}</Text>
                        </View>
                        <Text className="text-white font-poppins-semibold flex-1">
                          {replaceEmergencyNumbers(stepItem.step, ambulanceNumber)}
                        </Text>
                      </View>
                    </View>

                    {stepItem.notes?.map((note: string, j: number) => (
                      <View key={j} className='flex-row pl-4 pr-8 mt-3'>
                        <View className='mr-4 mt-2'><StepPoint /></View>
                        <Text className='font-poppins-medium text-[#555D6A]'>
                          {replaceEmergencyNumbers(note, ambulanceNumber)}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              }
            })}
          </ScrollView>
        </View>
      </View>
    );
  }

  const renderCard = ({ item }: { item: any }) => {
    if (item.type === 'overview') {
      return renderOverviewCard(item);
    } else {
      return renderStepsCard(item);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <SafeAreaView className="flex-1">
      {/* Top Navigation */}
      <View className="h-16 flex-row items-center justify-between px-4 mt-4">
        {/* Back Button (Left) */}
        <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
          <BackButton width={45} height={45} />
        </TouchableOpacity>
        {/* Absolutely centered title */}
        <View className="absolute left-0 right-0 items-center">
          <Text className="font-poppins-semibold text-white text-2xl">
            {guide.title}
          </Text>
        </View>
        {/* Spacer for alignment (Right) */}
        <View style={{ width: 45 }} />
      </View>

      {/* Carousel & Page Indicator */}
      <View className='flex-col flex-1'>
        {/* Carousel */}
        <View className='flex-1'>
          <FlatList
            ref={flatListRef}
            data={carouselData}
            renderItem={renderCard}
            horizontal
            snapToInterval={CARD_WIDTH + (CARD_MARGIN * 2)}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingVertical: 20 }}
          />
        </View>
        {/* Page Indicators */}
        <View className="flex-row mt-auto justify-center items-center py-8">
          {carouselData.map((_, index) => (
            <TouchableOpacity
              key={index}
              className={`w-3 h-3 rounded-full mx-1 ${index === currentIndex ? 'bg-[#D5D7E8]' : 'bg-gray-500'
                }`}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index });
              }}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EmergencyDetail;