// React Imports
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrepareStackParamList } from '../navigation/PrepareStack';
// Firebase Imports
import { auth } from '../firebaseConfig';
import { DocumentData } from 'firebase/firestore';
// Type Imports
import { Checklist, ChecklistWithStatus } from '../types';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg';
// Service Imports
import { listenToChecklistProgress, fetchChecklistsData } from '../services/checklistServices';

// Props type for navigation
type Props = NativeStackScreenProps<PrepareStackParamList, 'ChecklistList'>;

// Define Step Background Colors
const bgColors = [
  '#FF6666', '#FF9044', '#7F93FF', '#52C87D', '#BB85ED', '#FF7F7F',
  '#FFD966', '#66CCFF', '#33CC99', '#D291FF', '#33CCCC', '#FFB3C6'
];

const ChecklistList = ({ navigation }: Props) => {
  // Get user (assert non-null)
  const user = auth.currentUser!

  // States
  const [checklists, setChecklists] = useState<ChecklistWithStatus[]>([]);

  useEffect(() => {
    const loadChecklistsWithProgress = async () => {
      try {
        // 1. Load cached checklists (with status!) first
        const cached = await AsyncStorage.getItem(`checklists_${user.uid}`);
        if (cached) {
          const parsed: ChecklistWithStatus[] = JSON.parse(cached);
          setChecklists(parsed);
        }

        // 2. Fetch base checklists from Firestore
        const checklistDocs = await fetchChecklistsData();
        const baseChecklists: ChecklistWithStatus[] = checklistDocs.map(doc => {
          const data = doc.data() as Omit<Checklist, 'id'>;
          return { ...data, id: doc.id, status: 'Not Started' };
        });

        // Update structure in case new checklists were added
        setChecklists(prev => {
          const prevMap = new Map(prev.map(c => [c.id, c]));
          return baseChecklists.map(checklist => prevMap.get(checklist.id) || checklist);
        });

        // 3. Listen for progress updates
        const unsubscribe = listenToChecklistProgress(user.uid, (progressDocs: DocumentData) => {
          setChecklists(prev => {
            const updated = prev.map(checklist => {
              const progressDoc = progressDocs.find((doc: DocumentData) => doc.id === checklist.id);
              if (!progressDoc) return { ...checklist, status: 'Not Started' };

              const checkedItems: boolean[] = progressDoc.checkedItems || [];
              const total = checklist.items.length;
              const checkedCount = checkedItems.filter(Boolean).length;

              let status: 'Completed' | 'In Progress' | 'Not Started' = 'Not Started';
              if (checkedCount === 0) status = 'Not Started';
              else if (checkedCount === total) status = 'Completed';
              else status = 'In Progress';

              return { ...checklist, status };
            });

            // 4. Save fresh statuses to cache
            AsyncStorage.setItem(`checklists_${user.uid}`, JSON.stringify(updated));
            return updated;
          });
        });

        return unsubscribe;
      } catch (err: any) {
        console.error('Error loading checklists: ', err.message);
      }
    };

    const unsubscribePromise = loadChecklistsWithProgress();
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe?.());
    };
  }, [user]);

  if (checklists.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text className='text-white'>Loading checklists...</Text>
      </View>
    );
  }

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
          <Text className="font-poppins-semibold text-white text-2xl">Checklists</Text>
        </View>
        {/* Spacer for alignment (Right) */}
        <View style={{ width: 45 }} />
      </View>
      {/* Checklist List */}
      <View className='px-6'>
        <FlatList
          data={checklists}
          keyExtractor={(item, index) => item.id + index.toString()}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            // Determine background color
            const bgColor = bgColors[index % bgColors.length];

            return (
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => navigation.navigate('ChecklistDetail', { checklist: item })}
                className='shadow-md mb-6'
              >
                <View style={{ backgroundColor: bgColor }} className='rounded-3xl px-6 py-4 flex-row justify-between'>
                  {/* // Checklist Title & Number of items */}
                  <View className='flex-1 mr-5'>
                    <Text className='text-white font-poppins-bold text-lg'>{item.title}</Text>
                    <Text className='text-white text-base mt-1 font-poppins-medium'>{item.items.length} items</Text>
                  </View>
                  {/* Completion status */}
                  <View className={`self-start px-3 pb-1 rounded-full backdrop-blur-sm bg-white/20 border border-white/30`}>
                    <Text className={`text-white font-poppins-medium text-base mt-1`}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#ccc' },
  title: { fontSize: 18, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4 },
  progress: { fontSize: 14, color: '#007AFF', marginTop: 4 },
});

export default ChecklistList;
