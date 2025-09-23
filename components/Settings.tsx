// React Imports
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
// Expo Imports
import { Image } from 'expo-image';
// Navigation Imports
import { HomeStackParamList } from '../navigation/HomeStack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
// Icon Imports
import BackButton from '../assets/icons/BackButton.svg'
// Firebase imports
import { signOut, updateProfile, reload } from 'firebase/auth';
import { auth } from '../firebaseConfig';
// Image Picker
import * as ImagePicker from 'expo-image-picker';
// Service Imports
import { deleteProfileImage, uploadImageToStorage } from '../services/userServices';

// Navigation Prop Type
type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

const Settings = ({ navigation }: Props) => {
    // Get current user (assert non-null)
    const user = auth.currentUser!;

    // State for username, profile picture, loading, and username editing
    const [username, setUsername] = useState<string>('');
    const [profilePicture, setProfilePicture] = useState<string>(user?.photoURL || '');
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
    const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
    const [newUsername, setNewUsername] = useState<string>('');
    const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

    // Sync state with auth.currentUser whenever it changes
    useEffect(() => {
        const syncUser = async () => {
            if (user) {
                setUsername(user.displayName || '');
                setProfilePicture(user.photoURL || '');
            }
        }
        syncUser();
    }, [user]);

    // Handle logout
    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel', },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await signOut(auth);
                        navigation.dispatch(
                            CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })
                        );
                    } catch (err: any) {
                        Alert.alert('Logout Error', err.message);
                    }
                }
            }
        ]
        );
    }

    // Handle profile picture change
    const handleChangeProfilePicture = () => {
        if (!user) return;
        Alert.alert('Change Profile Picture', 'Choose an option', [
            { text: 'Take Photo', onPress: () => pickImage('camera') },
            { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
            ...(profilePicture ? [{
                text: 'Remove Picture',
                style: 'destructive' as const,
                onPress: removeProfilePicture,
            }] : []),
            { text: 'Cancel', style: 'cancel' as const },
        ]);
    };

    // Pick image
    const pickImage = async (source: 'camera' | 'gallery') => {
        try {
            if (source === 'camera') { // IF source is camera ask for camera permission
                const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                if (cameraPermission.status !== 'granted') {
                    Alert.alert('Permission Required', 'Camera permission is required.');
                    return;
                }
            } else { // IF source is gallery ask for gallery permission
                const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (galleryPermission.status !== 'granted') {
                    Alert.alert('Permission Required', 'Gallery permission is required.');
                    return;
                }
            }

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });

            if (!result.canceled && result.assets[0]) {
                await uploadProfilePicture(result.assets[0].uri);
            }
        } catch (error: any) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image.');
        }
    };

    // Upload profile picture to Firebase Storage & update auth
    const uploadProfilePicture = async (imageUri: string) => {
        if (!user) return;

        setIsUploadingImage(true);
        try {
            const downloadURL = await uploadImageToStorage(user.uid, imageUri);
            await updateProfile(user, { photoURL: downloadURL });
            await reload(user);
            setProfilePicture(downloadURL);
            setIsLoadingImage(true);
        } catch (error: any) {
            console.error('Error uploading profile picture:', error);
            Alert.alert('Error', 'Failed to update profile picture.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Remove profile picture (just clear photoURL in auth)
    const removeProfilePicture = async () => {
        Alert.alert('Remove Profile Picture', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    setIsUploadingImage(true);
                    try {
                        // 1. Delete the file from firebase storage
                        if (user.photoURL) {
                            await deleteProfileImage(user.uid);
                        }
                        // 2. Clear auth profile
                        await updateProfile(user, { photoURL: "" });
                        // 3. Update profilePicture state
                        setProfilePicture('');
                        // 4. Reload user object from server
                        await reload(user);
                        Alert.alert('Success', 'Profile picture removed!');
                    } catch (error: any) {
                        console.error('Error removing profile picture:', error);
                        Alert.alert('Error', 'Failed to remove profile picture.');
                    } finally {
                        setIsUploadingImage(false);
                    }
                }
            }
        ]);
    };

    // Handle username change
    const handleChangeUsername = () => {
        setNewUsername(username);
        setIsEditingUsername(true);
    };

    // Save username changes
    const saveUsername = async () => {
        if (!user || !newUsername.trim()) {
            Alert.alert('Error', 'Please enter a valid username.');
            return;
        }
        if (newUsername.trim() === username) {
            setIsEditingUsername(false);
            return;
        }
        try {
            await updateProfile(user, { displayName: newUsername.trim() });
            setUsername(newUsername.trim());
            
            // Reload user object from server
            await reload(user);

            setIsEditingUsername(false);
            Alert.alert('Success', 'Username updated!');
        } catch (error: any) {
            console.error('Error updating username:', error);
            Alert.alert('Error', 'Failed to update username.');
        }
    };

    // Cancel username editing
    const cancelUsernameEdit = () => {
        setNewUsername('');
        setIsEditingUsername(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-br from-[#4A90E2] to-[#357ABD]">
            {/* Top Navigation */}
            <View className="h-16 flex-row items-center justify-between px-4 mt-4 mb-4">
                {/* Back Button (Left) */}
                <TouchableOpacity className='p-1' onPress={() => navigation.goBack()}>
                    <BackButton width={45} height={45} />
                </TouchableOpacity>
                {/* Absolutely centered title */}
                <View className="absolute left-0 right-0 items-center">
                    <Text className="font-poppins-semibold text-white text-2xl">Settings</Text>
                </View>
                {/* Spacer for alignment (Right) */}
                <View style={{ width: 45 }} />
            </View>

            <ScrollView
                className="flex-1 px-7"
                contentContainerStyle={{ paddingBottom: 50 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View className="bg-white/10 rounded-3xl p-6 mb-4 items-center">
                    {/* Profile Picture */}
                    <TouchableOpacity
                        onPress={handleChangeProfilePicture}
                        className="mb-4"
                        activeOpacity={0.7}
                        disabled={isUploadingImage}
                    >
                        <View className="relative">
                            {/* Profile Picture Container */}
                            <View className="w-32 h-32 rounded-full bg-white/20 border-4 border-white/30 shadow-lg overflow-hidden">
                                {isUploadingImage ? (
                                    <View className="w-full h-full items-center justify-center">
                                        <Text className="text-white text-2xl">⏳</Text>
                                        <Text className="text-white font-poppins text-xs mt-1">Uploading...</Text>
                                    </View>
                                ) : (
                                    <Image
                                        source={
                                            profilePicture
                                                ? { uri: profilePicture, cache: 'force-cache' } // Use cached version if available
                                                : require('../assets/images/DefaultProfilePic.png') // Fallback placeholder
                                        }
                                        style={{ width: '100%', height: '100%', borderRadius: 50 }}
                                        contentFit='cover'
                                        onLoadEnd={() => {
                                            if (isLoadingImage) {
                                                setIsLoadingImage(false);
                                                Alert.alert('Success', 'Profile picture updated!');
                                            }
                                        }}
                                    />
                                )}
                            </View>

                            {/* Camera Icon Overlay */}
                            {!isUploadingImage && (
                                <View className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-500 rounded-full items-center justify-center shadow-lg border-2 border-white">
                                    <Text className="text-white text-lg">📷</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Tap to change text */}
                    <Text className="font-poppins text-white/70 text-sm text-center">
                        {isUploadingImage ? 'Updating profile picture...' : 'Tap to change profile picture'}
                    </Text>
                </View>

                {/* Username Section */}
                <View className="bg-white/10 rounded-3xl p-5 mb-4">
                    {isEditingUsername ? (
                        // Editing Mode
                        <View>
                            <Text className="font-poppins text-white/70 text-sm mb-3">
                                Edit Username
                            </Text>
                            <View className="bg-white/20 rounded-2xl p-4 mb-4">
                                <TextInput
                                    value={newUsername}
                                    onChangeText={setNewUsername}
                                    placeholder="Enter new username"
                                    placeholderTextColor="rgba(255,255,255,0.5)"
                                    className="font-poppins text-white text-base"
                                    maxLength={30}
                                    autoFocus={true}
                                    returnKeyType="done"
                                    onSubmitEditing={saveUsername}
                                />
                            </View>
                            <View className="flex-row space-x-3">
                                <TouchableOpacity
                                    onPress={saveUsername}
                                    className="flex-1 mr-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl py-3 items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="font-poppins-medium text-emerald-300 text-sm">
                                        Save Changes
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={cancelUsernameEdit}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl py-3 items-center"
                                    activeOpacity={0.7}
                                >
                                    <Text className="font-poppins-medium text-white/70 text-sm">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        // Display Mode
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="font-poppins text-white/70 text-sm mb-1">
                                    Username
                                </Text>
                                <Text className="font-poppins-bold text-white text-lg">
                                    {username}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleChangeUsername}
                                className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <Text className="text-white text-lg">✏️</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Account Section */}
                <View className="bg-white/10 rounded-3xl p-5 mb-4">
                    <Text className="font-poppins-bold text-white text-lg mb-4">
                        Account
                    </Text>

                    {/* User Email */}
                    <View className="mb-4">
                        <Text className="font-poppins text-white/70 text-sm mb-1">
                            Email
                        </Text>
                        <Text className="font-poppins text-white text-base">
                            {user?.email || 'No email'}
                        </Text>
                    </View>

                    {/* User ID (for reference) */}
                    <View>
                        <Text className="font-poppins text-white/70 text-sm mb-1">
                            User ID
                        </Text>
                        <Text className="font-poppins text-white/60 text-xs font-mono">
                            {user?.uid || 'No user ID'}
                        </Text>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="bg-red-500/20 border border-red-500/30 rounded-full p-4 flex-row items-center justify-center"
                    activeOpacity={0.7}
                >
                    <Text className="font-poppins-bold text-red-300 text-base">
                        Logout
                    </Text>
                </TouchableOpacity>

                {/* Version Info */}
                <View className="mt-6 items-center">
                    <Text className="font-poppins text-white/50 text-xs">
                        App Version 1.0.0
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Settings