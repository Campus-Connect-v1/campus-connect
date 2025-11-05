import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import { studyGroupApi } from '@/src/services/studyGroupServices';

interface FormData {
  group_name: string;
  description: string;
  course_code: string;
  course_name: string;
  group_type: 'public' | 'private' | 'invite_only';
  max_members: string;
}

const CreateGroupScreen: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    group_name: '',
    description: '',
    course_code: '',
    course_name: '',
    group_type: 'public',
    max_members: '20',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profileData } = useSWR<{ user: { university_id: string } }>('/user/profile', fetcher);
  const userProfile = profileData?.user;

  const handleSubmit = async () => {
    if (!formData.group_name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!userProfile?.university_id) {
      Alert.alert('Error', 'University information not found');
      return;
    }

    const maxMembers = parseInt(formData.max_members);
    if (isNaN(maxMembers) || maxMembers < 2) {
      Alert.alert('Error', 'Max members must be at least 2');
      return;
    }

    setIsSubmitting(true);

    const result = await studyGroupApi.createStudyGroup({
      university_id: userProfile.university_id,
      group_name: formData.group_name.trim(),
      description: formData.description.trim() || undefined,
      course_code: formData.course_code.trim() || undefined,
      course_name: formData.course_name.trim() || undefined,
      group_type: formData.group_type,
      max_members: maxMembers,
    });

    setIsSubmitting(false);

    if (result.success) {
      Alert.alert(
        'Success',
        'Study group created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      Alert.alert('Error', result.error?.message || 'Failed to create study group');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg font-semibold ml-4">
          Create Study Group
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4 py-6">
          {/* Group Name */}
          <View className="mb-4">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 mb-2">
              Group Name *
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              style={{ fontFamily: 'Gilroy-Regular' }}
              placeholder="Enter group name"
              placeholderTextColor="#9ca3af"
              value={formData.group_name}
              onChangeText={(text) => setFormData({ ...formData, group_name: text })}
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 mb-2">
              Description
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              style={{ fontFamily: 'Gilroy-Regular', minHeight: 100, textAlignVertical: 'top' }}
              placeholder="Describe your study group"
              placeholderTextColor="#9ca3af"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Course Code */}
          <View className="mb-4">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 mb-2">
              Course Code
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              style={{ fontFamily: 'Gilroy-Regular' }}
              placeholder="e.g., CS101"
              placeholderTextColor="#9ca3af"
              value={formData.course_code}
              onChangeText={(text) => setFormData({ ...formData, course_code: text })}
              autoCapitalize="characters"
            />
          </View>

          {/* Course Name */}
          <View className="mb-4">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 mb-2">
              Course Name
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              style={{ fontFamily: 'Gilroy-Regular' }}
              placeholder="e.g., Introduction to Computer Science"
              placeholderTextColor="#9ca3af"
              value={formData.course_name}
              onChangeText={(text) => setFormData({ ...formData, course_name: text })}
            />
          </View>

          {/* Group Type */}
          <View className="mb-4">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 mb-2">
              Group Type *
            </Text>
            <View className="flex-row">
              {(['public', 'private', 'invite_only'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFormData({ ...formData, group_type: type })}
                  className={`flex-1 py-3 rounded-xl mr-2 border ${
                    formData.group_type === type
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Text
                    style={{ fontFamily: 'Gilroy-Medium' }}
                    className={`text-center ${
                      formData.group_type === type ? 'text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    {type === 'invite_only' ? 'Invite Only' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Members */}
          <View className="mb-6">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-gray-900 mb-2">
              Max Members *
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              style={{ fontFamily: 'Gilroy-Regular' }}
              placeholder="20"
              placeholderTextColor="#9ca3af"
              value={formData.max_members}
              onChangeText={(text) => setFormData({ ...formData, max_members: text })}
              keyboardType="number-pad"
            />
          </View>
        </ScrollView>

        {/* Create Button */}
        <View className="px-4 pb-6 bg-white border-t border-gray-100">
          <TouchableOpacity
            className="bg-[#002D69] h-14 rounded-full items-center justify-center"
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-white text-base">
                Create Study Group
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateGroupScreen;
