// import { fetcher } from '@/services/fetcher';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ProfileScreenProps {
  navigation?: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  // const { data, error, isLoading } = useSWR('/api/v1/status/profile', fetcher);

  // if (isLoading) {
  //   return (
  //     <SafeAreaView className="flex-1 items-center justify-center bg-white">
  //       <ActivityIndicator size="large" color="#000" />
  //       <Text className="mt-4 text-gray-500">Loading profile...</Text>
  //     </SafeAreaView>
  //   );
  // }

  // if (error) {
  //   return (
  //     <SafeAreaView className="flex-1 items-center justify-center bg-white">
  //       <Text>Error loading profile.</Text>
  //     </SafeAreaView>
  //   );
  // }



  const posts = [
    {
      id: '1',
      user: {
        name: 'Joshua User',
        username: '@joshuser',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
      date: 'Feb 8, 2025',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.',
      stats: {
        comments: 57,
        retweets: 144,
        likes: 184,
      },
    },
  ];
  const user = posts[0].user;

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <StatusBar barStyle="dark-content" />
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View className="flex-row items-center ml-4">
            <Image
              source={{ uri: posts[0].user.avatar }}
              className="w-8 h-8 rounded-full mr-3"
            />
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold">{user.username}</Text>
          </View>
        </View>

        {/* Hero Section with Trophy */}
        <View className="relative h-48 bg-black">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=300&fit=crop' }}
            className="w-full h-full opacity-70"
            resizeMode="cover"
          />
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-yellow-400 text-lg font-light italic">I am a winner</Text>
          </View>
        </View>

        {/* Profile Picture with Edit Button - LEFT ALIGNED */}
        <View className="px-4 -mt-16 mb-4">
          <View className="relative w-32 h-32">
            <Image
              source={{ uri: posts[0].user.avatar }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
            <TouchableOpacity className="absolute -bottom-0 -right-0 w-8 h-8 bg-yellow-500 rounded-full items-center justify-center">
              <Ionicons name="add" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row px-4 mb-4">
          <View className="mr-8">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-md">Followers</Text>
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold">{user.name || '100'}</Text>
          </View>
          <View>
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-md">Following</Text>
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-base font-semibold">{user.name || '50'}</Text>
          </View>
        </View>

        {/* User Info */}
        <View className="px-4 mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">{user.username}</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-md">{user.name || '@joshuser'}</Text>
            </View>
            <View className="flex-row items-center bg-yellow-100 px-3 py-2 rounded-full">
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-yellow-700 text-md font-medium mr-1">Bleoo {user.name}</Text>
              <Ionicons name="trophy" size={14} color="#b45309" />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View className="px-4 mb-6">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-2">About</Text>
          <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 leading-5 text-md">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit ut diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.
          </Text>
        </View>

        {/* Posts Section */}
        <View className="px-4">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black mb-4">Posts</Text>
          
          {posts.map((post) => (
            <View key={post.id} className="mb-6">
              <View className="flex-row">
                <Image
                  source={{ uri: post.user.avatar }}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-black text-md mr-2">{post.user.name}</Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-md mr-2">{post.user.username}</Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-sm">· {post.date}</Text>
                  </View>
                  <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-800 leading-5 mb-3 text-md">{post.content}</Text>
                  
                  {/* Post Stats */}
                  <View className="flex-row items-center">
                    <TouchableOpacity className="flex-row items-center mr-6">
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm ml-1">{post.stats.comments}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity className="flex-row items-center mr-6">
                      <Ionicons name="repeat-outline" size={16} color="#666" />
                      <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm ml-1">{post.stats.retweets}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity className="flex-row items-center mr-6">
                      <Ionicons name="heart-outline" size={16} color="#666" />
                      <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-sm ml-1">{post.stats.likes}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity>
                      <Ionicons name="share-outline" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
