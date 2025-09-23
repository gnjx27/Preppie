// React Imports
import React, { useState } from 'react';
import { View, TextInput, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Data Imports
import emergencyGuides from '../assets/data/emergencyGuides.json';
import { disasterImages } from '../constants/imageMaps';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../navigation/LearnStack';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg'
import SearchIcon from '../assets/icons/SearchIcon.svg'
import X from '../assets/icons/X.svg';

// Props Type for navigation
type Props = NativeStackScreenProps<LearnStackParamList, 'EmergencyList'>;

const EmergencyList = ({ navigation }: Props) => {
  // State management for search query and search mode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  // Filtered guides
  const filteredGuides = emergencyGuides.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView>
      {/* Top Navigation */}
      <View className="h-16 flex-row items-center justify-between px-4 mt-4 mb-4">
          {/* Back Button (Left) */}
          <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
              <BackButton width={45} height={45} />
          </TouchableOpacity>
          {/* Center Title or Search Bar */}
          {searchMode ? (
            <TextInput
              className="flex-1 mx-4 px-4 py-2 bg-white rounded-full text-black"
              placeholder="Search for guides..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          ) : (
            <View className="absolute left-0 right-0 items-center">
              <Text className="font-poppins-semibold text-white text-2xl">Emergency Guides</Text>
            </View>
          )}
          {/* Search Toggle Icon */}
          <TouchableOpacity 
            className='p-1' 
            onPress={() => {
              if (searchMode) {
                setSearchQuery('');
                setSearchMode(false);
              } else {
                setSearchMode(true);
              }
            }}
            activeOpacity={1}
          >
            {searchMode ? <X width={34} height={34}  /> : <SearchIcon width={34} height={34} />}
          </TouchableOpacity>
      </View>
      {/* Emergency Guide List */}
      <View>
        <FlatList
          data={filteredGuides}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className='mx-10 mt-7'
              onPress={() => navigation.navigate('EmergencyDetail', { guide: item })}
            >
              <Text className='font-poppins-medium text-white text-lg ml-3'>{item.title}</Text>
              <View className='mt-2 shadow-sm'>
                <Image 
                  source={disasterImages[item.imageKey]}
                  resizeMode="cover"
                  style={{ width: '100%', height: 200, borderRadius: 20 }}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default EmergencyList;
