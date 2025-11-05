import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import PrivacySettingsModal from '../ui/privacy-settings-modal';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ComposePostSingleProps {
  navigation?: any;
}

const ComposePostSingle: React.FC<ComposePostSingleProps> = ({ navigation }) => {
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  
  // Privacy settings
  const [hideViewCount, setHideViewCount] = useState(false);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [turnOffComments, setTurnOffComments] = useState(false);

  const handleSelectFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedMedia(result.assets[0].uri);
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handleShare = () => {
    // TODO: Implement actual post creation
    console.log('Sharing post:', {
      caption,
      media: selectedMedia,
      privacy: {
        hideViewCount,
        hideLikeCount,
        turnOffComments,
      },
    });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">
          New Post
        </Text>
        <TouchableOpacity 
          onPress={handleShare}
          disabled={!caption && !selectedMedia}
        >
          <Text 
            style={{fontFamily: 'Gilroy-SemiBold'}} 
            className={`text-base font-semibold ${caption || selectedMedia ? 'text-blue-600' : 'text-gray-400'}`}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* User Info & Caption */}
        <View className="p-4 border-b border-gray-100">
          <View className="flex-row">
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-sm font-semibold mb-2">
                Joshua User
              </Text>
              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="What's on your mind?"
                multiline
                style={{fontFamily: 'Gilroy-Regular'}}
                className="text-base text-black min-h-20"
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Selected Media Preview */}
          {selectedMedia && (
            <View className="mt-4 relative">
              <Image
                source={{ uri: selectedMedia }}
                className="w-full h-64 rounded-lg"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={handleRemoveMedia}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-2"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Media Options */}
        <View className="px-4 py-3 border-b border-gray-100">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-gray-600 text-sm mb-3">
            Add to your post
          </Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleSelectFromLibrary}
              className="flex-row items-center bg-green-50 rounded-full px-4 py-2"
            >
              <Ionicons name="images" size={20} color="#10b981" />
              <Text style={{fontFamily: 'Gilroy-Medium'}} className="text-green-700 ml-2 text-sm">
                Photos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleTakePhoto}
              className="flex-row items-center bg-blue-50 rounded-full px-4 py-2"
            >
              <Ionicons name="camera" size={20} color="#3b82f6" />
              <Text style={{fontFamily: 'Gilroy-Medium'}} className="text-blue-700 ml-2 text-sm">
                Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Options */}
        <View className="px-4 mt-2">
          {/* Privacy Settings */}
          <TouchableOpacity 
            onPress={() => setPrivacyModalVisible(true)}
            className="flex-row items-center justify-between py-4 border-b border-gray-100"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="lock-closed" size={20} color="#8b5cf6" />
              </View>
              <View>
                <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base">
                  Privacy Settings
                </Text>
                <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-sm">
                  Control who can see and interact
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Tag People */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="person-add" size={20} color="#3b82f6" />
              </View>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base">
                Tag People
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Add Location */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="location" size={20} color="#ef4444" />
              </View>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base">
                Add Location
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Add Music */}
          <TouchableOpacity className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-pink-100 rounded-full items-center justify-center mr-3">
                <Ionicons name="musical-notes" size={20} color="#ec4899" />
              </View>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base">
                Add Music
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Privacy Settings Modal */}
      <PrivacySettingsModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        hideViewCount={hideViewCount}
        hideLikeCount={hideLikeCount}
        turnOffComments={turnOffComments}
        onToggleViewCount={setHideViewCount}
        onToggleLikeCount={setHideLikeCount}
        onToggleComments={setTurnOffComments}
      />
    </SafeAreaView>
  );
};

export default ComposePostSingle;
