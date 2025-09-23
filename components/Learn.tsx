// React Imports
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect } from 'react'
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg'
// Navigation Imports
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../navigation/LearnStack';

// Prop Type for navigation
type Props = NativeStackScreenProps<LearnStackParamList, 'LearnMain'>;

const Learn = ({ navigation, route }:Props) => {
    // Check navigation flag from route params (navigating from home)
    useEffect(() => {
        if (route.params?.openEmergencyList) {
            navigation.setParams({ openEmergencyList: false });
            navigation.navigate('EmergencyList');
        } else if (route.params?.openEmergencyDetail) {
            const guide = route.params.openEmergencyDetail;
            navigation.setParams({ openEmergencyDetail: undefined });
            navigation.navigate('EmergencyDetail', { guide });
        }
    }, [route.params])

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
                    <Text className="font-poppins-semibold text-white text-2xl">Learn</Text>
                </View>
                {/* Spacer for alignment (Right) */}
                <View style={{ width: 45 }} />
            </View>
            {/* Disaster Guides */}
            <View className='mt-4 flex-col items-center'>
                {/* Disaster Guides Title */}
                <Text className='text-center text-white font-poppins-semibold text-xl'>Disaster Guides</Text>
                {/* Disaster Guides Image */}
                <View className='mt-4'>
                    <TouchableOpacity onPress={() => navigation.navigate('EmergencyList')}>
                        <Image 
                            source={require('../assets/images/DisasterGuidesImage.png')}
                            resizeMode='cover'
                        />
                    </TouchableOpacity>
                </View>
            </View>
            {/* First Aid Guides */}
            <View className='mt-5 flex-col items-center'>
                {/* First Aid Guides Title */}
                <Text className='text-center text-white font-poppins-semibold text-xl'>First Aid Guides</Text>
                {/* First Aid Guides Image */}
                <View className='mt-4'>
                    <TouchableOpacity onPress={() => navigation.navigate('FirstAidList')}>
                        <Image 
                            source={require('../assets/images/FirstAidGuidesImage.png')}
                            resizeMode='cover'
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Learn