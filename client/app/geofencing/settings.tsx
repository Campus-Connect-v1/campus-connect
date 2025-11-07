import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/services/authServices';
import { useDropdownAlert } from '@/src/hooks/useDropdownAlert';
import DropdownAlert from '@/src/components/ui/DropdownAlert';

interface PrivacySettings {
  profile_visibility: 'public' | 'geofenced' | 'private' | 'friends_only';
  visibility_radius: number;
  custom_radius: number;
  show_exact_location: boolean;
  visible_fields: {
    name: boolean;
    photo: boolean;
    bio: boolean;
    program: boolean;
    courses: boolean;
    contact: boolean;
  };
}

interface GeofencingSettingsScreenProps {
  navigation?: any;
}

const GeofencingSettingsScreen: React.FC<GeofencingSettingsScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(true);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const { alert, hideAlert, success, error } = useDropdownAlert()
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'geofenced',
    visibility_radius: 100,
    custom_radius: 100,
    show_exact_location: false,
    visible_fields: {
      name: true,
      photo: true,
      bio: true,
      program: true,
      courses: false,
      contact: false,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/geofencing/privacy');
      
      if (response.data.settings) {
        const loadedSettings = response.data.settings;
        
        // Parse visible_fields if it's a string
        let visibleFields = loadedSettings.visible_fields;
        if (typeof visibleFields === 'string') {
          try {
            visibleFields = JSON.parse(visibleFields);
          } catch (parseError) {
            console.error('Error parsing visible_fields:', parseError);
            // Use default values if parsing fails
            visibleFields = {
              name: true,
              photo: true,
              bio: true,
              program: true,
              courses: false,
              contact: false,
            };
          }
        }
        
        setSettings({
          profile_visibility: loadedSettings.profile_visibility || 'geofenced',
          visibility_radius: loadedSettings.visibility_radius || 100,
          custom_radius: loadedSettings.custom_radius || 100,
          show_exact_location: loadedSettings.show_exact_location || false,
          visible_fields: visibleFields || {
            name: true,
            photo: true,
            bio: true,
            program: true,
            courses: false,
            contact: false,
          },
        });
      }
    } catch (error: any) {
      error('Error', 'Failed to load privacy settings', 3000);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await api.put('/geofencing/privacy', settings);
      success('Success', 'Privacy settings updated successfully', 3000);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      error('Error', 'Failed to save privacy settings', 3000);
    } finally {
      setSaving(false);
    }
  };

  const toggleLocationSharing = async (enabled: boolean) => {
    try {
      const response = await api.post('/geofencing/location/toggle', { enabled });
      setLocationSharingEnabled(enabled);
      
      if (response.data.message) {
        success('Success', response.data.message, 3000);
      }
    } catch (error: any) {
      console.error('Error toggling location sharing:', error);
      error('Error', 'Failed to update location sharing', 3000);
      // Revert the toggle
      setLocationSharingEnabled(!enabled);
    }
  };

  const toggleIncognito = async (enabled: boolean) => {
    try {
      const response = await api.post('/geofencing/incognito', { enabled });
      setIncognitoMode(enabled);
      
      // Incognito mode disables location sharing
      if (enabled) {
        setLocationSharingEnabled(false);
      }
      
      if (response.data.message) {
        error('Success', response.data.message, 3000);
      }
    } catch (error: any) {
      console.error('Error toggling incognito mode:', error);
      error('Error', 'Failed to update incognito mode');
      // Revert the toggle
      setIncognitoMode(!enabled);
    }
  };

  const updateVisibleField = (field: keyof PrivacySettings['visible_fields'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      visible_fields: {
        ...prev.visible_fields,
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 mt-4">
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black">
          Geofencing Settings
        </Text>
        <TouchableOpacity onPress={saveSettings} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#007aff" />
          ) : (
            <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-blue-600 text-base font-semibold">
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
         <DropdownAlert
              visible={alert.visible}
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onDismiss={hideAlert}
            />
        {/* Location Sharing Toggle */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">
            Location Sharing
          </Text>
          
          <View className="flex-row items-center justify-between py-3 bg-gray-50 rounded-lg px-4">
            <View className="flex-1 pr-3">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                Enable location sharing
              </Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Allow others to see your location on the map
              </Text>
            </View>
            <Switch
              value={locationSharingEnabled}
              onValueChange={toggleLocationSharing}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Incognito Mode */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">
            Privacy Mode
          </Text>
          
          <View className="flex-row items-center justify-between py-3 bg-gray-50 rounded-lg px-4">
            <View className="flex-1 pr-3">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                Incognito Mode
              </Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                One-touch privacy - disables location sharing and hides your profile
              </Text>
            </View>
            <Switch
              value={incognitoMode}
              onValueChange={toggleIncognito}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Profile Visibility */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">
            Profile Visibility
          </Text>
          
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                Visibility Mode
              </Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Current: {settings.profile_visibility}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1">
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                Show exact location
              </Text>
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                Display your precise building location
              </Text>
            </View>
            <Switch
              value={settings.show_exact_location}
              onValueChange={(value) => setSettings(prev => ({ ...prev, show_exact_location: value }))}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Visible Fields */}
        <View className="mb-8">
          <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black mb-4">
            Visible Profile Fields
          </Text>
          
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-base text-black">Name</Text>
            <Switch
              value={settings.visible_fields.name}
              onValueChange={(value) => updateVisibleField('name', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-base text-black">Photo</Text>
            <Switch
              value={settings.visible_fields.photo}
              onValueChange={(value) => updateVisibleField('photo', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-base text-black">Bio</Text>
            <Switch
              value={settings.visible_fields.bio}
              onValueChange={(value) => updateVisibleField('bio', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-base text-black">Program</Text>
            <Switch
              value={settings.visible_fields.program}
              onValueChange={(value) => updateVisibleField('program', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-base text-black">Courses</Text>
            <Switch
              value={settings.visible_fields.courses}
              onValueChange={(value) => updateVisibleField('courses', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="flex-row items-center justify-between py-3">
            <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-base text-black">Contact</Text>
            <Switch
              value={settings.visible_fields.contact}
              onValueChange={(value) => updateVisibleField('contact', value)}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GeofencingSettingsScreen;
