
import { icons } from '@/src/constants/icons';
import { router, Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, TouchableOpacity, View, Text } from 'react-native';
import Colors from '@/src/constants/Colors';
import { dataService } from '@/src/services/data-service';

const TabIcon = ({ focused, icon, title, badgeCount }: any) => {
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(indicatorAnim, {
      toValue: focused ? 1 : 0,
      duration: 300,
      useNativeDriver: false, 
    }).start();
  }, [focused, indicatorAnim]);

  const indicatorStyle = {
    opacity: indicatorAnim,
    transform: [
      {
        scaleX: indicatorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
      {
        translateY: indicatorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0], 
        }),
      },
    ],
  };

  return (
    <View className="size-full justify-center items-center mt-4 bg-white" >
      <View style={{ position: 'relative' }}>
        <Image
          source={icon}
          tintColor={focused ? Colors.light.primary : '#000'}
          className="size-6 mb-1"
        />
        {badgeCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -8,
              backgroundColor: '#ef4444',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 10,
                fontFamily: 'Gilroy-SemiBold',
              }}
            >
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
      <Animated.View
        style={[
          {
            width: 24,
            height: 4,
            borderRadius: 9999,
            backgroundColor: Colors.light.primary,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );
};

const TabsLayout = () => {
  const handleProfilePress = () => {
    router.push('/(tabs)/profile');
  };
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load unread count
    const loadUnreadCount = () => {
      const count = dataService.getUnreadCount();
      setUnreadCount(count);
    };

    loadUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);
  return (
    <>

    <Tabs
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        
        tabBarStyle: {
          borderRadius: 50,
          marginHorizontal: 10,
          marginBottom: 36,
          height: 52,
          width: '90%',
          alignSelf: 'center',
          overflow: 'hidden',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          // borderTopLeftRadius: 24,
          // borderTopRightRadius: 24,
          // position: 'absolute',
          // elevation: 5,
        },
       sceneStyle: {
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          headerStyle: { backgroundColor: '#003554' },
          title: 'HOME',
          headerTitleStyle: {
            fontFamily: 'Gilroy-SemiBold',
            color: '#fff',
          },
    headerRight: () => (
      <TouchableOpacity onPress={handleProfilePress} className="mr-4">
        <Image
          source={{ uri: "https://plus.unsplash.com/premium_photo-1747504296823-71ded9ee2b15?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }} // replace with your avatar URL
          className="w-10 h-10 rounded-full"
        />
      </TouchableOpacity>
    ),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title='HOME' />
          ),
        }}
      />
   
      <Tabs.Screen
        name='feed'
        options={{
          headerStyle: { backgroundColor: '#002D69' },
          headerShown: false,
           headerTitleStyle: {
            fontFamily: 'Gilroy-SemiBold',
            color: '#fff',
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.more} title='FEED' />
          ),
           headerLeft: () => (
      <Text className='font-[Gilroy-Regular] text-2xl text-white'>uniCLIQ</Text>
    ),
        }}
      />
         <Tabs.Screen
      name='chat'
        options={{
          headerStyle: { backgroundColor: '#002D69' },
          title: 'CHAT ',
          headerTitleStyle: {
            fontFamily: 'Gilroy-SemiBold',
            color: '#fff',
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.chat} title='CHAT' badgeCount={unreadCount} />
          ),
           headerLeft: () => (
      <TouchableOpacity onPress={handleProfilePress} className="ml-4">
        <Image
          source={{ uri: "https://plus.unsplash.com/premium_photo-1747504296823-71ded9ee2b15?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }} // replace with your avatar URL
          className="w-10 h-10 rounded-full"
        />
      </TouchableOpacity>
    ),
        }}
      />
      <Tabs.Screen
        name='connections'
        options={{
          headerStyle: { backgroundColor: '#002D69' },
          title: 'CONNECTIONS',
          headerTitleStyle: {
            fontFamily: 'Gilroy-SemiBold',
            color: '#fff',
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title='CONNECTIONS' />
          ),
           headerLeft: () => (
      <TouchableOpacity onPress={handleProfilePress} className="ml-4">
        <Image
          source={{ uri: "https://plus.unsplash.com/premium_photo-1747504296823-71ded9ee2b15?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }} // replace with your avatar URL
          className="w-10 h-10 rounded-full"
        />
      </TouchableOpacity>
    ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          headerStyle: { backgroundColor: '#002D69' },
          title: 'PROFILE',
          headerTitleStyle: {
            fontFamily: 'Gilroy-SemiBold',
            color: '#fff',
          },
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.user} title='SEARCH' />
          ),
           headerLeft: () => (
      <TouchableOpacity onPress={handleProfilePress} className="ml-4">
        <Image
          source={{ uri: "https://plus.unsplash.com/premium_photo-1747504296823-71ded9ee2b15?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }} // replace with your avatar URL
          className="w-10 h-10 rounded-full"
        />
      </TouchableOpacity>
    ),
        }}
      />
            <Tabs.Screen
      options={{
        headerShown: false,
        href: null, 
      }}
    name="notifications"
  />
    </Tabs>
        </>
  );
};

export default TabsLayout