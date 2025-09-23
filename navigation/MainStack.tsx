// React Imports
import { View, Image } from 'react-native'
import React from 'react'
// Navigation Imports
import { NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PrepareStackParamList } from './PrepareStack';
import { LearnStackParamList } from './LearnStack';
// Component Imports
import HomeStack from './HomeStack';
import LearnStack from './LearnStack';
import PrepareStack from './PrepareStack';
import BadgeList from '../components/BadgeList';

// TabParamList type for tab navigation
export type TabParamList = {
    Home: undefined;
    Learn: NavigatorScreenParams<LearnStackParamList>;
    Prepare: NavigatorScreenParams<PrepareStackParamList>;
    Badge: undefined;
}

// Create a Bottom Tab Navigator
const Tab = createBottomTabNavigator<TabParamList>();

const LearnStackScreen = () => <LearnStack/>;

// Create a Tab Navigator
const MainStack = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                detachInactiveScreens: true,
                headerShown: false,
                lazy: false,
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    height: 100,
                    paddingTop: 30,
                    paddingHorizontal: 20,
                    backgroundColor: "#DEE0EF",
                    opacity: 0.95,
                },
                tabBarIcon: ({ size, focused }) => {
                    const iconContainerStyle = {
                        width: 50,
                        height: 50,
                        borderRadius: 20,
                        justifyContent: 'center' as const,
                        alignItems: 'center' as const,
                        backgroundColor: focused ? '#6980FB' : 'transparent',
                        marginBottom: 30
                    };
                    if (route.name === 'Home') {
                        return (
                            <View style={iconContainerStyle}>
                                <Image style={{ width: size, height: size, resizeMode: 'contain' }} source={require('../assets/images/HomeIcon.png')} />
                            </View>
                        );
                    }
                    else if (route.name === 'Learn') {
                        return (
                            <View style={iconContainerStyle}>
                                <Image style={{ width: size, height: size, resizeMode: 'contain' }} source={require('../assets/images/LearnIcon.png')} />
                            </View>
                        );
                    }
                    else if (route.name === 'Prepare') {
                        return (
                            <View style={iconContainerStyle}>
                                <Image style={{ width: size, height: size, resizeMode: 'contain' }} source={require('../assets/images/PrepareIcon.png')} />
                            </View>
                        );
                    }
                    else if (route.name === 'Badge') {
                        return (
                            <View style={iconContainerStyle}>
                                <Image style={{ width: size, height: size, resizeMode: 'contain' }} source={require('../assets/images/BadgesIcon.png')} />
                            </View>
                        );
                    }
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Learn" component={LearnStackScreen} />
            <Tab.Screen name="Prepare" component={PrepareStack} />
            <Tab.Screen name="Badge" component={BadgeList} />
        </Tab.Navigator>
    );
}

export default MainStack