import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CreateEventScreenProps {
  navigation?: any;
}

const CreateEventScreen: React.FC<CreateEventScreenProps> = ({ navigation }) => {
  const [eventName, setEventName] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [description, setDescription] = useState('');
  // const [date, setDate] = useState('');
  // const [time, setTime] = useState('');
  // const [meetingPlatform, setMeetingPlatform] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold ml-4">Create Event</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Upload Image */}
        <TouchableOpacity className="border-2 border-dashed border-gray-300 rounded-lg h-32 items-center justify-center mb-6">
          <Ionicons name="camera" size={32} color="#9ca3af" />
          <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-sm mt-2">Upload Image</Text>
        </TouchableOpacity>

        {/* Event Name */}
        <View className="mb-4">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold mb-2">Event Name</Text>
          <TextInput
            value={eventName}
            onChangeText={setEventName}
            placeholder="Enter event name"
            style={{fontFamily: 'Gilroy-Regular'}}
            className="border border-gray-300 rounded-full px-3 py-3 text-base"
          />
        </View>

        {/* Event Title */}
        <View className="mb-4">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold mb-2">Event Title</Text>
          <TextInput
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder="Enter event title"
            style={{fontFamily: 'Gilroy-Regular'}}
            className="border border-gray-300 rounded-full px-3 py-3 text-base"
          />
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold mb-2">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter event description"
            multiline
            numberOfLines={4}
            style={{fontFamily: 'Gilroy-Regular'}}
            className="border border-gray-300 rounded-lg px-3 py-3 text-base h-24"
            textAlignVertical="top"
          />
        </View>

        {/* Date and Time */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold mb-2">Date</Text>
            <TouchableOpacity className="border border-gray-300 rounded-full px-3 py-3 flex-row items-center justify-between">
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-base">Select date</Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 ml-2">
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold mb-2">Time</Text>
            <TouchableOpacity className="border border-gray-300 rounded-full px-3 py-3 flex-row items-center justify-between">
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-base">Select time</Text>
              <Ionicons name="time-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Meeting Platform */}
        <View className="mb-6">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold mb-2">Meeting Platform</Text>
          <TouchableOpacity className="border border-gray-300 rounded-full px-3 py-3 flex-row items-center justify-between">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-base">Select platform</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Preview Button */}
       <View className="px-4 pb-6">
              <TouchableOpacity 
                className="bg-[#002D69] h-14 rounded-full items-center justify-center mb-4"
                onPress={() => router.push('/events/preview-event-screen')}
              >
                <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-base font-semibold">Create Event</Text>
              </TouchableOpacity>
            </View>
    </SafeAreaView>
  );
};

export default CreateEventScreen;
