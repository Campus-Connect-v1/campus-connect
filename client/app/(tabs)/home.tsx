import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = () => {
  return (
    <SafeAreaView className='flex-1 bg-[#FBFCFE]'>
      <View className='flex-1 items-center justify-center px-4'>
        <Ionicons name="settings-outline" size={28} color="#fff" />
        <Text className='text-2xl font-ComfortaaBold text-primaryText mt-4'>
          Home
        </Text>
        <Text className='text-subText font-PoppinsRegular text-center mt-2'>
          Welcome to Vendyi - Your marketplace hub
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
