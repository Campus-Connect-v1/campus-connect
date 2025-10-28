import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import { Building, Facility } from '@/src/services/universityServices';

const BuildingDetailsScreen: React.FC = () => {
  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();

  const { data: buildingData, error: buildingError, isLoading: buildingLoading } = useSWR(
    buildingId ? `/university/buildings/${buildingId}` : null,
    fetcher
  );

  const { data: facilitiesData, error: facilitiesError, isLoading: facilitiesLoading } = useSWR(
    buildingId ? `/university/buildings/${buildingId}/facilities` : null,
    fetcher
  );

  const building: Building = buildingData?.data;
  const facilities: Facility[] = facilitiesData?.data || [];

  if (buildingLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#002D69" />
      </SafeAreaView>
    );
  }

  if (buildingError || !building) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900 mt-4">
            Building Not Found
          </Text>
          <TouchableOpacity
            className="mt-6 bg-[#002D69] px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-white">
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderFacilityItem = ({ item }: { item: Facility }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
      onPress={() => router.push(`/university/facility-details?facilityId=${item.facility_id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900">
            {item.name}
          </Text>
          {item.room_number && (
            <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-500 mt-1">
              Room {item.room_number} {item.floor && `• Floor ${item.floor}`}
            </Text>
          )}
          <View className="flex-row items-center mt-2 flex-wrap">
            <View className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-1">
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-xs text-green-700">
                {item.facility_type}
              </Text>
            </View>
            {item.is_reservable && (
              <View className="bg-purple-100 px-3 py-1 rounded-full mb-1">
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-xl font-semibold ml-4 flex-1">
            Building Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Building Info Card */}
        <View className="bg-white m-4 rounded-xl p-5 shadow-sm border border-gray-100">
          <Text style={{ fontFamily: 'Gilroy-Bold' }} className="text-2xl text-gray-900">
            {building.name}
          </Text>
          <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-base text-gray-500 mt-1">
            {building.code}
          </Text>

          {building.building_type && (
            <View className="flex-row items-center mt-3">
              <View className="bg-blue-100 px-4 py-2 rounded-full">
                <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-blue-700">
                  {building.building_type}
                </Text>
              </View>
            </View>
          )}

          {building.description && (
            <View className="mt-4">
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900 mb-2">
                Description
              </Text>
              <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 leading-5">
                {building.description}
              </Text>
            </View>
          )}

          {building.address && (
            <View className="mt-4 flex-row items-start">
              <Ionicons name="location-outline" size={20} color="#6B7280" className="mt-0.5" />
              <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 ml-2 flex-1">
                {building.address}
              </Text>
            </View>
          )}

          {building.floors && (
            <View className="mt-3 flex-row items-center">
              <Ionicons name="layers-outline" size={20} color="#6B7280" />
              <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 ml-2">
                {building.floors} Floors
              </Text>
            </View>
          )}

          {building.operating_hours && (
            <View className="mt-4">
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900 mb-2">
                Operating Hours
              </Text>
              {building.operating_hours.weekday && (
                <View className="flex-row items-center mb-1">
                  <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-gray-700 w-24">
                    Weekdays:
                  </Text>
                  <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600">
                    {building.operating_hours.weekday}
                  </Text>
                </View>
              )}
              {building.operating_hours.weekend && (
                <View className="flex-row items-center">
                  <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-gray-700 w-24">
                    Weekends:
                  </Text>
                  <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600">
                    {building.operating_hours.weekend}
                  </Text>
                </View>
              )}
            </View>
          )}

          {building.accessibility_features && building.accessibility_features.length > 0 && (
            <View className="mt-4">
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900 mb-2">
                Accessibility Features
              </Text>
              <View className="flex-row flex-wrap">
                {building.accessibility_features.map((feature, index) => (
                  <View key={index} className="bg-gray-100 px-3 py-1.5 rounded-full mr-2 mb-2">
                    <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-xs text-gray-700">
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Facilities Section */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900">
              Facilities ({facilities.length})
            </Text>
          </View>

          {facilitiesLoading ? (
            <View className="py-8">
              <ActivityIndicator size="small" color="#002D69" />
            </View>
          ) : facilities.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center border border-gray-100">
              <Ionicons name="information-circle-outline" size={48} color="#9CA3AF" />
              <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-gray-500 mt-3">
                No facilities available
              </Text>
            </View>
          ) : (
            <View>
              {facilities.map((facility) => (
                <View key={facility.facility_id}>
                  {renderFacilityItem({ item: facility })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BuildingDetailsScreen;
