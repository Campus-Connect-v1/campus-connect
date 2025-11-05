import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import { StudyGroup } from '@/src/services/studyGroupServices';

interface StudyGroupsScreenProps {
  navigation?: any;
}

type TabType = 'all' | 'my-groups';

const StudyGroupsScreen: React.FC<StudyGroupsScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all study groups
  const { data: allGroupsData, error: allGroupsError, isLoading: allGroupsLoading, mutate: mutateAllGroups } = useSWR<{ data: StudyGroup[], count: number }>(
    activeTab === 'all' ? '/study-group?limit=100' : null,
    fetcher
  );

  // Fetch user's study groups
  const { data: myGroupsData, error: myGroupsError, isLoading: myGroupsLoading, mutate: mutateMyGroups } = useSWR<{ data: StudyGroup[], count: number }>(
    activeTab === 'my-groups' ? '/study-group/user' : null,
    fetcher
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'all') {
      await mutateAllGroups();
    } else {
      await mutateMyGroups();
    }
    setRefreshing(false);
  };

  const allGroups: StudyGroup[] = allGroupsData?.data || [];
  const myGroups: StudyGroup[] = myGroupsData?.data || [];
  const isLoading = activeTab === 'all' ? allGroupsLoading : myGroupsLoading;
  const error = activeTab === 'all' ? allGroupsError : myGroupsError;
  const groups = activeTab === 'all' ? allGroups : myGroups;

  const renderGroupCard = ({ item }: { item: StudyGroup }) => (
    <TouchableOpacity
      onPress={() => router.push(`/study-groups/group-detail?groupId=${item.group_id}`)}
      className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm border border-gray-50"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900 mb-1">
            {item.group_name}
          </Text>
          {item.course_code && (
            <View className="flex-row items-center mb-1">
              <View className="bg-blue-100 px-2 py-1 rounded-md">
                <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-blue-700">
                  {item.course_code}
                </Text>
              </View>
            </View>
          )}
        </View>
        <View className={`px-2 py-1 rounded-full ${
          item.group_type === 'public' ? 'bg-green-100' :
          item.group_type === 'private' ? 'bg-orange-100' :
          'bg-purple-100'
        }`}>
          <Text style={{ fontFamily: 'Gilroy-Medium' }} className={`text-xs ${
            item.group_type === 'public' ? 'text-green-700' :
            item.group_type === 'private' ? 'text-orange-700' :
            'text-purple-700'
          }`}>
            {item.group_type}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-600 text-sm mb-2" numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-600 text-sm ml-1">
            {item.member_count || 0}/{item.max_members} members
          </Text>
        </View>
        {item.university_name && (
          <View className="flex-row items-center">
            <Ionicons name="school-outline" size={16} color="#6b7280" />
            <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-600 text-sm ml-1" numberOfLines={1}>
              {item.university_name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-4" style={{ minHeight: 400 }}>
      <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-4">
        <Ionicons name="people" size={32} color="#3b82f6" />
      </View>
      <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 text-lg mb-2">
        {activeTab === 'all' ? 'No Study Groups' : 'No Groups Joined'}
      </Text>
      <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 text-base text-center">
        {activeTab === 'all' 
          ? 'No study groups available yet' 
          : "You haven't joined any study groups yet"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className=" px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg font-semibold ml-4">
            Study Groups
          </Text>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-full p-1">
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-full ${
              activeTab === 'all' ? 'bg-white' : ''
            }`}
          >
            <Text
              style={{ fontFamily: activeTab === 'all' ? 'Gilroy-SemiBold' : 'Gilroy-Regular' }}
              className={`text-center ${
                activeTab === 'all' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              All Groups
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('my-groups')}
            className={`flex-1 py-2 rounded-full ${
              activeTab === 'my-groups' ? 'bg-white' : ''
            }`}
          >
            <Text
              style={{ fontFamily: activeTab === 'my-groups' ? 'Gilroy-SemiBold' : 'Gilroy-Regular' }}
              className={`text-center ${
                activeTab === 'my-groups' ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              My Groups
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="mt-4 text-gray-500">
            Loading study groups...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-red-500">
            Error loading study groups
          </Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item.group_id}
          contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create Study Group Button */}
      <View className="px-4 pb-6 bg-white border-t border-gray-100">
        <TouchableOpacity
          className="bg-[#002D69] h-14 rounded-full items-center justify-center"
          onPress={() => router.push('/study-groups/create-group')}
        >
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-white text-base font-semibold">
            Create Study Group
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default StudyGroupsScreen;
