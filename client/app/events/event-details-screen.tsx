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

interface EventDetailsScreenProps {
  navigation?: any;
}

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({ navigation }) => {
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

      <ScrollView className="flex-1">
        {/* Event Image */}
        <View className="relative">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop' }}
            className="w-full h-56"
            resizeMode="cover"
          />
          <View className="absolute top-4 right-4 bg-green-500 px-3 py-1 rounded">
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-sm font-semibold">Virtual</Text>
          </View>
        </View>

        {/* Event Content */}
        <View className="px-4 py-6">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-2xl font-semibold text-black mb-4">Advent Tech Networking</Text>
          
          <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-base leading-6 mb-6">
            Join us for an exciting networking event where tech enthusiasts, entrepreneurs, and industry professionals come together to share ideas, collaborate, and build meaningful connections. This event will feature keynote speakers, interactive workshops, and plenty of opportunities to network with like-minded individuals in the tech community.
            {'\n\n'}
            Whether you're a seasoned professional or just starting your career in tech, this event offers valuable insights, learning opportunities, and the chance to expand your professional network. Don't miss out on this incredible opportunity to connect with the tech community!
          </Text>

          {/* Event Details */}
          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-700 text-base ml-3">December 15, 2024</Text>
            </View>

            <View className="flex-row items-center mb-3">
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-700 text-base ml-3">6:00 PM - 9:00 PM</Text>
            </View>

            <View className="flex-row items-center mb-6">
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-700 text-base ml-3">Tech Hub Conference Center</Text>
            </View>
          </View>

          {/* Attendees Section */}
          <View className="mb-6">
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-3">Attendees</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="flex-row">
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }} className="w-8 h-8 rounded-full border-2 border-white" />
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' }} className="w-8 h-8 rounded-full border-2 border-white -ml-3" />
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' }} className="w-8 h-8 rounded-full border-2 border-white -ml-3" />
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face' }} className="w-8 h-8 rounded-full border-2 border-white -ml-3" />
                </View>
                <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-base ml-3">+25 others attending</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity className="mr-4">
              <Ionicons name="heart-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity className="mr-4">
              <Ionicons name="bookmark-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="share-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Join Event Button */}
      <View className="px-4 pb-6">
        <TouchableOpacity className="bg-[#002D69] rounded-full py-4 items-center">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-lg font-semibold">Join Event</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default EventDetailsScreen;
