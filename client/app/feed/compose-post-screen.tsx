import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ComposePostScreenProps {
  navigation?: any;
}

const ComposePostScreen: React.FC<ComposePostScreenProps> = ({ navigation }) => {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);

  const handleShare = () => {
    router.push('/feed/post-settings-screen');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">New Post</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-blue-600 text-base font-semibold">Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* User Info & Media Preview */}
        <View className="flex-row p-4 border-b border-gray-100">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-sm font-semibold mb-2">Joshua User</Text>
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Write a caption..."
              multiline
              style={{fontFamily: 'Gilroy-Regular'}}
              className="text-base text-black min-h-20"
              textAlignVertical="top"
            />
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop' }}
            className="w-16 h-16 rounded-lg ml-3"
          />
        </View>

        {/* Options */}
        <View className="px-4">
          {/* Tag People */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="person-add-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Tag People</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Add Location */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Add Location</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Music */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="musical-notes-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Add Music</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Accessibility */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="accessibility-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Accessibility</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Advanced Settings */}
          <TouchableOpacity className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Advanced Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ComposePostScreen;
