import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface PreviewEventScreenProps {
  navigation?: any;
}

const PreviewEventScreen: React.FC<PreviewEventScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold ml-4">Preview</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Event Card */}
        <View className="mx-4 mt-4 bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Event Image */}
          <View className="relative">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop' }}
              className="w-full h-48 rounded-t-xl"
              resizeMode="cover"
            />
            <View className="absolute top-3 right-3 bg-green-500 px-2 py-1 rounded">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-xs font-semibold">Virtual</Text>
            </View>
          </View>

          {/* Event Details */}
          <View className="p-4">
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-2">Alumni Tech Networking</Text>
            
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm leading-5 mb-4">
              Join us for an exciting networking event where tech enthusiasts, entrepreneurs, and industry professionals come together to share ideas, collaborate, and build meaningful connections. This event will feature keynote speakers, interactive workshops, and plenty of opportunities to network with like-minded individuals in the tech community.
            </Text>

            {/* Event Info */}
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm ml-2">Dec 15, 2024</Text>
            </View>

            <View className="flex-row items-center mb-4">
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm ml-2">6:00 PM - 9:00 PM</Text>
            </View>

            {/* Attendees */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="flex-row">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' }} className="w-6 h-6 rounded-full border border-white" />
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face' }} className="w-6 h-6 rounded-full border border-white -ml-2" />
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }} className="w-6 h-6 rounded-full border border-white -ml-2" />
                </View>
                <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm ml-2">+25 others</Text>
              </View>
              
              <View className="flex-row items-center">
                <TouchableOpacity className="mr-4">
                  <Ionicons name="heart-outline" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity className="mr-4">
                  <Ionicons name="bookmark-outline" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="share-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Event Button */}
      <View className="px-4 pb-6">
                    <TouchableOpacity 
                      className="bg-[#002D69] h-14 rounded-full items-center justify-center mb-4"
                      onPress={() => router.push('/events/events-created-screen')}
                    >
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-base font-semibold">Create Event</Text>
                    </TouchableOpacity>
                  </View>
    </SafeAreaView>
  );
};

export default PreviewEventScreen;
