import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { Building, Facility, universityServices } from '@/src/services/universityServices';

const SearchScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const type = params.type as 'buildings' | 'facilities';
  const q = params.q as string;
  const universityId = params.universityId as string;

  const [searchQuery, setSearchQuery] = useState(q || '');
  const [buildingResults, setBuildingResults] = useState<Building[]>([]);
  const [facilityResults, setFacilityResults] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = React.useCallback(async (query: string) => {
    if (!query.trim() || !universityId) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      if (type === 'buildings') {
        const response = await universityServices.searchBuildings(universityId, query);
        if (response.success && response.data?.data) {
          setBuildingResults(response.data.data as Building[]);
          setFacilityResults([]);
        } else {
          setBuildingResults([]);
        }
      } else {
        const response = await universityServices.searchFacilities(universityId, query);
        if (response.success && response.data?.data) {
          setFacilityResults(response.data.data as Facility[]);
          setBuildingResults([]);
        } else {
          setFacilityResults([]);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setBuildingResults([]);
      setFacilityResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, universityId]);

  useEffect(() => {
    if (q) {
      performSearch(q);
    }
  }, [q, performSearch]);

  const handleSearch = () => {
    performSearch(searchQuery);
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
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View className="flex-1 items-center justify-center px-4 py-20">
          <View className="w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="search" size={32} color="#002D69" />
          </View>
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 text-base text-center">
            Search for {type === 'buildings' ? 'buildings' : 'facilities'}
          </Text>
        </View>
      );
    }

    return (
        <View className="flex-1 items-center justify-center px-4 py-20">
          <View className="w-20 h-20 bg-gray-100 rounded-2xl items-center justify-center mb-4">
            <Ionicons name="search-outline" size={32} color="#9CA3AF" />
          </View>
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 text-base text-center">
            No results found for &quot;{searchQuery}&quot;
          </Text>
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-400 text-sm text-center mt-2">
            Try searching with different keywords
          </Text>
        </View>
    );
  };

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
            Search {type === 'buildings' ? 'Buildings' : 'Facilities'}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            style={{ fontFamily: 'Gilroy-Regular' }}
            placeholder={`Search ${type}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#002D69" />
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 mt-4">
            Searching...
          </Text>
        </View>
      ) : type === 'buildings' ? (
        <FlatList<Building>
          data={buildingResults}
          keyExtractor={(item) => item.building_id}
          renderItem={renderBuildingItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        <FlatList<Facility>
          data={facilityResults}
          keyExtractor={(item) => item.facility_id}
          renderItem={renderFacilityItem}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
