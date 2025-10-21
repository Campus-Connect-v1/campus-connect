import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EventsScreenProps {
  navigation?: any;
}

const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold ml-4">Events</Text>
        <View className="flex-1" />
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Empty State */}
      <View className="flex-1 items-center justify-center px-4">
        <View className="w-20 h-20 bg-yellow-100 rounded-2xl items-center justify-center mb-4">
          <Ionicons name="calendar" size={32} color="#f59e0b" />
        </View>
        <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-base">No Event</Text>
      </View>

      {/* Create Event Button */}
      <View className="px-4 pb-6">
        <TouchableOpacity 
          className="bg-[#002D69] h-14 rounded-full items-center justify-center mb-4"
          onPress={() => router.push('/events/create-event-screen')}
        >
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-base font-semibold">Create Event</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EventsScreen;
