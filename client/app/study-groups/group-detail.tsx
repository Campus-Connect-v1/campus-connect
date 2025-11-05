import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import { studyGroupApi, GroupMember, StudyGroup } from '@/src/services/studyGroupServices';

const GroupDetailScreen: React.FC = () => {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { data: groupData, error: groupError, isLoading: groupLoading, mutate: mutateGroup } = useSWR<{ data: StudyGroup }>(
    groupId ? `/study-group/${groupId}` : null,
    fetcher
  );

  const { data: membersData, isLoading: membersLoading, mutate: mutateMembers } = useSWR<{ data: GroupMember[], count: number }>(
    groupId ? `/study-group/${groupId}/members` : null,
    fetcher
  );

  const { data: myGroupsData } = useSWR<{ data: StudyGroup[] }>('/study-group/user', fetcher);

  const group: StudyGroup | undefined = groupData?.data;
  const members: GroupMember[] = membersData?.data || [];
  
  // Check if user is already a member
  const myGroups = myGroupsData?.data || [];
  const isMember = myGroups.some((g: StudyGroup) => g.group_id === groupId);

  const handleJoinGroup = async () => {
    if (!groupId) return;

    Alert.alert(
      'Join Study Group',
      `Do you want to join "${group?.group_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            setIsJoining(true);
            const result = await studyGroupApi.joinStudyGroup(groupId);
            setIsJoining(false);

            if (result.success) {
              Alert.alert('Success', 'You have joined the study group!');
              mutateGroup();
              mutateMembers();
            } else {
              Alert.alert('Error', result.error?.message || 'Failed to join study group');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    Alert.alert(
      'Leave Study Group',
      `Are you sure you want to leave "${group?.group_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            const result = await studyGroupApi.leaveStudyGroup(groupId);
            setIsLeaving(false);

            if (result.success) {
              Alert.alert('Success', 'You have left the study group');
              router.back();
            } else {
              Alert.alert('Error', result.error?.message || 'Failed to leave study group');
            }
          },
        },
      ]
    );
  };

  if (groupLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ fontFamily: 'Gilroy-Regular' }} className="mt-4 text-gray-500">
          Loading group details...
        </Text>
      </SafeAreaView>
    );
  }

  if (groupError || !group) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-red-500">
          Error loading group details
        </Text>
      </SafeAreaView>
    );
  }

  const renderMemberItem = (member: GroupMember) => (
    <View key={member.group_member_id} className="flex-row items-center py-3 px-4">
      <View className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-3">
        {member.profile_picture_url ? (
          <Image
            source={{ uri: member.profile_picture_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="person" size={24} color="#9ca3af" />
          </View>
        )}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900">
            {member.first_name} {member.last_name}
          </Text>
          {member.role === 'creator' && (
            <View className="bg-yellow-100 px-2 py-0.5 rounded-md ml-2">
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-yellow-700">
                Creator
              </Text>
            </View>
          )}
          {member.role === 'admin' && (
            <View className="bg-blue-100 px-2 py-0.5 rounded-md ml-2">
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-blue-700">
                Admin
              </Text>
            </View>
          )}
        </View>
        {member.program && (
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 text-sm">
            {member.program}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg font-semibold ml-4">
          Group Details
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Group Info Card */}
        <View className="bg-white m-4 rounded-2xl shadow-sm border border-gray-100 p-4">
          <View className="flex-row items-start justify-between mb-3">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-2xl text-gray-900 flex-1">
              {group.group_name}
            </Text>
            <View className={`px-3 py-1 rounded-full ${
              group.group_type === 'public' ? 'bg-green-100' :
              group.group_type === 'private' ? 'bg-orange-100' :
              'bg-purple-100'
            }`}>
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className={`text-sm ${
                group.group_type === 'public' ? 'text-green-700' :
                group.group_type === 'private' ? 'text-orange-700' :
                'text-purple-700'
              }`}>
                {group.group_type}
              </Text>
            </View>
          </View>

          {group.course_code && (
            <View className="flex-row items-center mb-3">
              <View className="bg-blue-100 px-3 py-1.5 rounded-lg">
                <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-blue-700">
                  {group.course_code}
                </Text>
              </View>
              {group.course_name && (
                <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-600 ml-2">
                  {group.course_name}
                </Text>
              )}
            </View>
          )}

          {group.description && (
            <View className="mb-3">
              <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-700 leading-5">
                {group.description}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={20} color="#6b7280" />
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-gray-700 ml-2">
                {group.member_count || 0}/{group.max_members} members
              </Text>
            </View>
            {group.university_name && (
              <View className="flex-row items-center">
                <Ionicons name="school-outline" size={20} color="#6b7280" />
                <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-600 ml-2">
                  {group.university_name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Members Section */}
        <View className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900">
              Members ({members.length})
            </Text>
          </View>

          {membersLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color="#3b82f6" />
            </View>
          ) : members.length > 0 ? (
            <View>
              {members.map(renderMemberItem)}
            </View>
          ) : (
            <View className="py-8 items-center">
              <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500">
                No members yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Join/Leave Button */}
      <View className="px-4 pb-6 bg-white border-t border-gray-100">
        {isMember ? (
          <TouchableOpacity
            className="bg-red-500 h-14 rounded-full items-center justify-center"
            onPress={handleLeaveGroup}
            disabled={isLeaving}
          >
            {isLeaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-white text-base">
                Leave Group
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-[#002D69] h-14 rounded-full items-center justify-center"
            onPress={handleJoinGroup}
            disabled={isJoining || (group.member_count >= group.max_members)}
          >
            {isJoining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-white text-base">
                {group.member_count >= group.max_members ? 'Group Full' : 'Join Group'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default GroupDetailScreen;
