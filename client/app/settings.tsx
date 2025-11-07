import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SettingsScreen: React.FC = () => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">Settings</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Account Settings */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">Account</Text>
          
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Change Password')} className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="key-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Email Settings')} className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Email Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Privacy Settings */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">Privacy</Text>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Private Profile</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Only your connections can see your posts and profile
              </Text>
            </View>
            <Switch
              value={privateProfile}
              onValueChange={setPrivateProfile}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={privateProfile ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Show Online Status</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Let others see when you&apos;re online
              </Text>
            </View>
            <Switch
              value={showOnlineStatus}
              onValueChange={setShowOnlineStatus}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={showOnlineStatus ? '#ffffff' : '#ffffff'}
            />
          </View>

          <TouchableOpacity onPress={() => console.log('Blocked Users')} className="flex-row items-center justify-between py-4 border-t border-gray-100 mt-3">
            <View className="flex-row items-center">
              <Ionicons name="shield-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Blocked Users</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">Notifications</Text>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Push Notifications</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Receive push notifications for new messages and updates
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={pushNotifications ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">Email Notifications</Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Get email updates about your activity
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={emailNotifications ? '#ffffff' : '#ffffff'}
            />
          </View>
        </View>

        {/* About */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">About</Text>
          
          <TouchableOpacity onPress={() => console.log('Help & Support')} className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Terms of Service')} className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Privacy Policy')} className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="lock-closed-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('About Campus Connect')} className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-black text-base ml-3">About Campus Connect</Text>
            </View>
            <View className="flex-row items-center">
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 text-sm mr-2">v1.0.0</Text>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <TouchableOpacity onPress={() => console.log('Log Out')} className="flex-row items-center justify-center py-4 border border-red-200 rounded-lg bg-red-50">
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-red-600 text-base ml-2">Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => console.log('Delete Account')} className="flex-row items-center justify-center py-4 border border-gray-200 rounded-lg mt-3">
            <Ionicons name="trash-outline" size={20} color="#666" />
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-600 text-base ml-2">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
