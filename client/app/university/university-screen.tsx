import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import { storage } from '@/src/utils/storage';
import { Building, Facility } from '@/src/services/universityServices';
import { ApiResponse } from '@/src/types/api';

interface UniversityScreenProps {
  navigation?: any;
}

const UniversityScreen: React.FC<UniversityScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'buildings' | 'facilities'>('buildings');
  const [searchQuery, setSearchQuery] = useState('');
  const [universityId, setUniversityId] = useState<string | null>(null);

  useEffect(() => {
    const loadUniversityId = async () => {
      const userData = await storage.getUserData();
      setUniversityId(userData?.university_id || "uni_1");
    };
    loadUniversityId();
  }, []);

  // Fetch buildings
  const { data: buildingsData, isLoading: buildingsLoading } = useSWR<ApiResponse<Building[]>>(
    universityId && activeTab === 'buildings' ? `/university/${universityId}/buildings` : null,
    fetcher
  );

  // Fetch facilities
  const { data: facilitiesData, isLoading: facilitiesLoading } = useSWR<ApiResponse<Facility[]>>(
    universityId && activeTab === 'facilities' ? `/university/${universityId}/facilities/reservable` : null,
    fetcher
  );

  const buildings: Building[] = buildingsData?.data || [];
  const facilities: Facility[] = facilitiesData?.data || [];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      if (activeTab === 'buildings') {
        router.push(`/university/search-screen?type=buildings&q=${searchQuery}&universityId=${universityId}`);
      } else {
        router.push(`/university/search-screen?type=facilities&q=${searchQuery}&universityId=${universityId}`);
      }
    }
  };

  const renderBuildingItem = ({ item }: { item: Building }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
      onPress={() => router.push(`/university/building-details?buildingId=${item.building_id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900">
            {item.building_name}
          </Text>
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-500 mt-1">
            {item.building_code}
          </Text>
          {item.building_type && (
            <View className="flex-row items-center mt-2">
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-blue-700">
                  {item.building_type}
                </Text>
              </View>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
      {item.description && (
        <Text
          style={{ fontFamily: 'Gilroy-Regular' }}
          className="text-sm text-gray-600 mt-2"
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFacilityItem = ({ item }: { item: Facility }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
      onPress={() => router.push(`/university/facility-details?facilityId=${item.facility_id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900">
            {item.building_name}
          </Text>
          {item.room_number && (
            <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-500 mt-1">
              Room {item.room_number}
            </Text>
          )}
          <View className="flex-row items-center mt-2 flex-wrap">
            <View className="bg-green-100 px-3 py-1 rounded-full mr-2">
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-green-700">
                {item.facility_type}
              </Text>
            </View>
            {item.is_reservable && (
              <View className="bg-purple-100 px-3 py-1 rounded-full">
                <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-purple-700">
                  Reservable
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
      {item.capacity && (
        <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 mt-2">
          Capacity: {item.capacity} people
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-4 py-20">
      <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-4">
        <Ionicons name={activeTab === 'buildings' ? 'business' : 'location'} size={32} color="#002D69" />
      </View>
      <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 text-base">
        No {activeTab === 'buildings' ? 'Buildings' : 'Facilities'} Found
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-xl font-semibold ml-4">
            University
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2 mt-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            style={{ fontFamily: 'Gilroy-Regular' }}
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white px-4 py-2 border-b border-gray-100">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg mr-2 ${
            activeTab === 'buildings' ? 'bg-[#002D69]' : 'bg-gray-100'
          }`}
          onPress={() => setActiveTab('buildings')}
        >
          <Text
            style={{ fontFamily: 'Gilroy-Medium' }}
            className={`text-center text-sm ${
              activeTab === 'buildings' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Buildings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-lg ${
            activeTab === 'facilities' ? 'bg-[#002D69]' : 'bg-gray-100'
          }`}
          onPress={() => setActiveTab('facilities')}
        >
          <Text
            style={{ fontFamily: 'Gilroy-Medium' }}
            className={`text-center text-sm ${
              activeTab === 'facilities' ? 'text-white' : 'text-gray-600'
            }`}
          >
            Facilities
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {(buildingsLoading || facilitiesLoading) ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#002D69" />
        </View>
      ) : (
        <FlatList<Building | Facility>
          data={activeTab === 'buildings' ? buildings : facilities}
          keyExtractor={(item) => {
            if (activeTab === 'buildings') {
              return (item as Building).building_id;
            }
            return (item as Facility).facility_id;
          }}
          renderItem={({ item }) => {
            if (activeTab === 'buildings') {
              return renderBuildingItem({ item: item as Building });
            }
            return renderFacilityItem({ item: item as Facility });
          }}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

export default UniversityScreen;
