// React Imports
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react'
// Navigation Imports
import { HomeStackParamList } from '../navigation/HomeStack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg'
import ArrowIcon from '../assets/icons/ArrowIcon.svg';
// Firebase Imports
import { DocumentData } from 'firebase/firestore'
import { auth } from '../firebaseConfig';
// Service Imports
import { getNotifications } from '../services/notificationServices';

// Navigation Prop Type
type Props = NativeStackScreenProps<HomeStackParamList, 'Notifications'>;

const Notifications = ({ navigation }: Props) => {
  // Get current user (assert non-null)
  const user = auth.currentUser!;

  // States
  const [notifications, setNotifications] = useState<DocumentData[] | []>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNotifications(user.uid);
      setNotifications(data ?? []);
      setLoading(false);
    }
    fetchNotifications();
  }, [])

  return (
    <SafeAreaView>
      {/* Top Navigation */}
      <View className="h-16 flex-row items-center justify-between px-4 mt-4 mb-4">
        {/* Back Button (Left) */}
        <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
          <BackButton width={45} height={45} />
        </TouchableOpacity>
        {/* Absolutely centered title */}
        <View className="absolute left-0 right-0 items-center">
          <Text className="font-poppins-semibold text-white text-2xl">Notifications</Text>
        </View>
        {/* Spacer for alignment (Right) */}
        <View style={{ width: 45 }} />
      </View>
      {/* List Notifications */}
      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text className="text-white text-center mt-10">Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          <Text className="text-white text-center mt-10">No notifications yet.</Text>
        ) : (
          notifications.map((notif, index) => (
            <View key={index} className='bg-[#5576F6] py-4 px-6 mt-4 rounded-3xl shadow-sm mb-2'>
              {/* Top Section */}
              <View className='flex flex-row justify-between flex-1'>
                {/* Top Left */}
                <View className='flex flex-row items-center'>
                  {/* Alert Icon */}
                  <View className='mr-3'>
                    <Image
                      source={{ uri: notif.icon }}
                      style={{ width: 24, height: 24 }}
                      resizeMode="contain"
                    />
                  </View>
                  {/* Title */}
                  <Text className='font-poppins-bold text-white text-lg'>
                    {notif.title}
                  </Text>
                </View>
              </View>
              {/* Bottom Section */}
              <View className='mt-2'>
                {/* Description */}
                <Text className='font-poppins-medium text-white'>
                  {notif.description}
                </Text>
                {/* Episode Id + Read Report Button */}
                <View className='flex-row items-center'>
                  <Text className='font-poppins-medium text-white/70 text-sm mb-1'>
                    Episode {notif.data.episodeid}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => Linking.openURL(notif.data.reportUrl)}
                    className="flex-row self-start items-center bg-white/20 px-4 py-3 rounded-full ml-auto"
                  >
                    <Text className="font-poppins-semibold text-white text-xs mr-1">
                      Read report
                    </Text>
                    <ArrowIcon />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Notifications