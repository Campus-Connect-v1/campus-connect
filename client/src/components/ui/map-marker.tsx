"use client"

import type React from "react"
import { useRef, useEffect } from "react"
import { View, Image, Text, TouchableOpacity, Animated } from "react-native"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"

interface NearbyUser {
  user_id: string
  first_name: string
  last_name: string
  display_name: string
  profile_picture_url?: string
  program?: string
  bio?: string
  university_id?: string
  distance?: number
}

interface MapMarkerProps {
  user: NearbyUser
  isCurrentUser?: boolean
  onConnect?: (userId: string) => void
}

// Custom Marker Component - Shows rounded image with border
export const CustomMapMarker: React.FC<MapMarkerProps> = ({ user, isCurrentUser = false }) => {
  const getUniversityColor = (universityId?: string) => {
    const colors: { [key: string]: string } = {
      uni_1: "#3b82f6", // Blue for current university
      uni_2: "#8b5cf6", // Purple
      uni_3: "#ec4899", // Pink
      uni_4: "#f59e0b", // Amber
      uni_5: "#10b981", // Green
    }
    return colors[universityId || "uni_1"] || "#3b82f6"
  }

  const borderColor = isCurrentUser ? "#3b82f6" : getUniversityColor(user.university_id)

  return (
    <View className="items-center justify-center">
      {/* Outer border ring */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: borderColor,
          padding: 3,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: borderColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        {/* Inner white padding */}
        <View
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 33,
            backgroundColor: "#ffffff",
            padding: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Profile image */}
          <View className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center">
            {user.profile_picture_url ? (
              <Image source={{ uri: user.profile_picture_url }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-white text-lg font-bold">
                {user.first_name[0]}
                {user.last_name[0]}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Online indicator dot */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#10b981",
          borderWidth: 2,
          borderColor: "#ffffff",
        }}
      />
    </View>
  )
}

// Beautiful Callout Component - Shows when marker is tapped
export const MapMarkerCallout: React.FC<MapMarkerProps & { onConnect?: (userId: string) => void }> = ({
  user,
  isCurrentUser = false,
  onConnect,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getUniversityColor = (universityId?: string) => {
    const colors: { [key: string]: string } = {
      uni_1: "#3b82f6",
      uni_2: "#8b5cf6",
      uni_3: "#ec4899",
      uni_4: "#f59e0b",
      uni_5: "#10b981",
    }
    return colors[universityId || "uni_1"] || "#3b82f6"
  }

  const borderColor = isCurrentUser ? "#3b82f6" : getUniversityColor(user.university_id)

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <BlurView intensity={90} style={{ borderRadius: 20 }} className="overflow-hidden">
        <View className="bg-white/40 border border-white/60 px-4 py-4 w-80">
          {/* Header with image and info */}
          <View className="flex-row items-start gap-3 mb-4">
            {/* Profile Picture */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: borderColor,
                padding: 2,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 items-center justify-center">
                {user.profile_picture_url ? (
                  <Image source={{ uri: user.profile_picture_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-white text-lg">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </Text>
                )}
              </View>
            </View>

            {/* Name and Program */}
            <View className="flex-1">
              <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-black font-bold text-base">
                {user.display_name}
              </Text>
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-xs mt-1">
                {user.program || "Program not specified"}
              </Text>
              {user.distance && (
                <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-500 text-xs mt-1">
                  {user.distance.toFixed(2)} km away
                </Text>
              )}
            </View>
          </View>

          {/* Bio Section */}
          {user.bio && (
            <View className="mb-4 pb-4 border-b border-white/40">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-700 text-sm leading-5">
                {user.bio.length > 100 ? `${user.bio.substring(0, 100)}...` : user.bio}
              </Text>
            </View>
          )}

          {/* Connect Button */}
          <TouchableOpacity
            onPress={() => onConnect?.(user.user_id)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: borderColor,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="person-add" size={18} color="#ffffff" />
            <Text
              style={{
                color: "#ffffff",
                textAlign: "center",
                fontSize: 14,
                fontFamily: "Gilroy-SemiBold",
              }}
            >
              Connect
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  )
}
