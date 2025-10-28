import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';
import { Facility } from '@/src/services/universityServices';

const FacilityDetailsScreen: React.FC = () => {
  const { facilityId } = useLocalSearchParams<{ facilityId: string }>();

  const { data: facilityData, error: facilityError, isLoading: facilityLoading } = useSWR(
    facilityId ? `/university/facilities/${facilityId}` : null,
    fetcher
  );

  const facility: Facility = facilityData?.data;

  if (facilityLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#002D69" />
      </SafeAreaView>
    );
  }

  if (facilityError || !facility) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-lg text-gray-900 mt-4">
            Facility Not Found
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
            Facility Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Facility Info Card */}
        <View className="bg-white m-4 rounded-xl p-5 shadow-sm border border-gray-100">
          <Text style={{ fontFamily: 'Gilroy-Bold' }} className="text-2xl text-gray-900">
            {facility.name}
          </Text>

          <View className="flex-row items-center mt-3 flex-wrap">
            <View className="bg-green-100 px-4 py-2 rounded-full mr-2 mb-2">
              <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-green-700">
                {facility.facility_type}
              </Text>
            </View>
            {facility.is_reservable && (
              <View className="bg-purple-100 px-4 py-2 rounded-full mb-2">
                <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-purple-700">
                  Reservable
                </Text>
              </View>
            )}
          </View>

          {/* Room Information */}
          <View className="mt-4 space-y-3">
            {facility.room_number && (
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 ml-2">
                  Room {facility.room_number}
                </Text>
              </View>
            )}

            {facility.floor && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="layers-outline" size={20} color="#6B7280" />
                <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 ml-2">
                  Floor {facility.floor}
                </Text>
              </View>
            )}

            {facility.capacity && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600 ml-2">
                  Capacity: {facility.capacity} people
                </Text>
              </View>
            )}
          </View>

          {/* Operating Hours */}
          {facility.operating_hours && (
            <View className="mt-4">
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900 mb-2">
                Operating Hours
              </Text>
              {facility.operating_hours.weekday && (
                <View className="flex-row items-center mb-1">
                  <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-gray-700 w-24">
                    Weekdays:
                  </Text>
                  <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600">
                    {facility.operating_hours.weekday}
                  </Text>
                </View>
              )}
              {facility.operating_hours.weekend && (
                <View className="flex-row items-center">
                  <Text style={{ fontFamily: 'Gilroy-Medium' }} className="text-sm text-gray-700 w-24">
                    Weekends:
                  </Text>
                  <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-600">
                    {facility.operating_hours.weekend}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Equipment */}
          {facility.equipment && facility.equipment.length > 0 && (
            <View className="mt-4">
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900 mb-2">
                Available Equipment
              </Text>
              <View className="flex-row flex-wrap">
                {facility.equipment.map((item, index) => (
                  <View key={index} className="bg-blue-50 px-3 py-1.5 rounded-full mr-2 mb-2 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                    <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-xs text-blue-700 ml-1">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Accessibility Features */}
          {facility.accessibility_features && facility.accessibility_features.length > 0 && (
            <View className="mt-4">
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900 mb-2">
                Accessibility Features
              </Text>
              <View className="flex-row flex-wrap">
                {facility.accessibility_features.map((feature, index) => (
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

        {/* Action Button */}
        {facility.is_reservable && (
          <View className="px-4 pb-6">
            <TouchableOpacity
              className="bg-[#002D69] h-14 rounded-full items-center justify-center"
              onPress={() => {
                // TODO: Implement reservation functionality
                console.log('Reserve facility:', facility.facility_id);
              }}
            >
              <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-white text-base">
                Reserve Facility
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default FacilityDetailsScreen;
