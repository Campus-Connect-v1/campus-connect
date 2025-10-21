import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PostSettingsScreenProps {
  navigation?: any;
}

const PostSettingsScreen: React.FC<PostSettingsScreenProps> = ({ navigation }) => {
  const [hideViewCount, setHideViewCount] = useState(false);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [turnOffComments, setTurnOffComments] = useState(false);
  const [shareToFacebook, setShareToFacebook] = useState(false);
  const [shareToTwitter, setShareToTwitter] = useState(false);

  const handlePost = () => {
    console.log('Posting with settings:', {
      hideViewCount,
      hideLikeCount,
      turnOffComments,
      shareToFacebook,
      shareToTwitter,
    });
    // Handle post creation
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">Post Settings</Text>
        <TouchableOpacity onPress={handlePost}>
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-blue-600 text-base font-semibold">Post</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Privacy Settings */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">Privacy</Text>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Hide view count</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Only you will see the total number of views on this post
              </Text>
            </View>
            <Switch
              value={hideViewCount}
              onValueChange={setHideViewCount}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={hideViewCount ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Hide like count</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Only you will see the total number of likes on this post
              </Text>
            </View>
            <Switch
              value={hideLikeCount}
              onValueChange={setHideLikeCount}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={hideLikeCount ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Turn off commenting</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                You can change this later by going to the ··· menu at the top of your post
              </Text>
            </View>
            <Switch
              value={turnOffComments}
              onValueChange={setTurnOffComments}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={turnOffComments ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        {/* Share Settings */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">Also share to</Text>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 bg-blue-600 rounded items-center justify-center mr-3">
                <Text className="text-white text-xs font-bold">f</Text>
              </View>
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Facebook</Text>
            </View>
            <Switch
              value={shareToFacebook}
              onValueChange={setShareToFacebook}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={shareToFacebook ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center flex-1">
              <View className="w-8 h-8 bg-blue-400 rounded items-center justify-center mr-3">
                <Ionicons name="logo-twitter" size={16} color="white" />
              </View>
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Twitter</Text>
            </View>
            <Switch
              value={shareToTwitter}
              onValueChange={setShareToTwitter}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={shareToTwitter ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        {/* Additional Options */}
        <View>
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Audience</Text>
            </View>
            <View className="flex-row items-center">
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-sm mr-2">Everyone</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Schedule Post</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostSettingsScreen;
