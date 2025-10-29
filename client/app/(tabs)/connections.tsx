"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState, useEffect, useRef } from "react"
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  FlatList,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { getUserConnections, respondToConnectionRequest } from "@/src/services/authServices"
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"
import DropdownAlert from "@/src/components/ui/DropdownAlert"
import { BlurView } from "expo-blur"
import { Image } from "expo-image"
import Colors from "@/src/constants/Colors"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { locationServices, NearbyUser } from "@/src/services/locationServices"
import { universityServices, Building } from "@/src/services/universityServices"
import { storage } from "@/src/utils/storage"
import * as Location from "expo-location"

type ConnectionStatus = "accepted" | "pending" | "declined"
type ViewMode = "list" | "map"

interface Connection {
  connection_id: string
  user_id: string
  first_name: string
  last_name: string
  profile_picture_url?: string
  program?: string
  year_of_study?: string
  status: ConnectionStatus
}

const ConnectionScreen = () => {
  const [activeTab, setActiveTab] = useState<ConnectionStatus>("accepted")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [connections, setConnections] = useState<Connection[]>([])
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  const { alert, hideAlert, success, error: toast } = useDropdownAlert()

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    const fetchConnections = async () => {
      setIsLoading(true)
      try {
        const result = await getUserConnections()
        console.log("Fetched connections:", result)

        if (result?.success && result?.data) {
          const tabConnections = Array.isArray(result.data[activeTab])
            ? result.data[activeTab]
            : []
          setConnections(tabConnections.filter(Boolean)) // remove null/undefined
        } else {
          setConnections([])
          toast("uniCLIQ", "Failed to load connections", 3000)
        }
      } catch (err) {
        console.error("Error fetching connections:", err)
        setConnections([])
        toast("uniCLIQ", "Something went wrong", 3000)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConnections()
  }, [activeTab, toast])

  useEffect(() => {
    const fetchMapData = async () => {
      if (viewMode !== "map") return

      try {
        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          toast("uniCLIQ", "Location permission denied", 3000)
          return
        }

        // Get current location
        const location = await Location.getCurrentPositionAsync({})
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })

        // Update location on server
        await locationServices.updateLocation(
          location.coords.latitude,
          location.coords.longitude,
          location.coords.accuracy || undefined
        )

        // Fetch nearby users
        const nearbyResult = await locationServices.getNearbyUsers(5000)
        if (nearbyResult.success && nearbyResult.data) {
          setNearbyUsers(nearbyResult.data.profiles || [])
        }

        // Fetch buildings
        const userData = await storage.getUserData()
        const universityId = userData?.university_id || "uni_1"
        const buildingsResult = await universityServices.getBuildings(universityId)
        if (buildingsResult.success && buildingsResult.data) {
          const buildingsData = Array.isArray(buildingsResult.data.data)
            ? buildingsResult.data.data
            : buildingsResult.data
          setBuildings(buildingsData || [])
        }
      } catch (err) {
        console.error("Error fetching map data:", err)
      }
    }

    fetchMapData()
  }, [viewMode, toast])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [fadeAnim, slideAnim])

  const handleRespondToRequest = async (connectionId: string, action: "accept" | "decline") => {
    setRespondingTo(connectionId)
    const result = await respondToConnectionRequest(connectionId, action)
    if (result.success) {
      success("uniCLIQ", `Connection ${action}ed successfully`, 3000)
      setConnections(prev => prev.filter(c => c.connection_id !== connectionId))
    } else {
      toast("uniCLIQ", `Failed to ${action} connection`, 3000)
    }
    setRespondingTo(null)
  }

  const handleViewProfile = (userId: string) => {
    router.push(`/user/${userId}`)
  }

  const tabs = [
    { label: "Connected", value: "accepted" },
    { label: "Pending", value: "pending" },
    { label: "Declined", value: "declined" },
  ] as const

  const renderConnectionCard = ({ item }: { item: Connection }) => {
    if (!item) return null // guard against undefined items

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="mb-4"
      >
        <BlurView intensity={85} style={{ borderRadius: 20 }} className="overflow-hidden">
          <View className="px-6 py-6 bg-white/40 border border-white/60">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={() => handleViewProfile(item.user_id)} className="flex-row items-center flex-1">
                <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center mr-4 overflow-hidden">
                  {item.profile_picture_url ? (
                    <Image source={{ uri: item.profile_picture_url }} className="w-full h-full" contentFit="cover" />
                  ) : (
                    <Text className="text-white text-lg font-semibold">
                      {item.first_name?.[0] ?? "?"}
                      {item.last_name?.[0] ?? ""}
                    </Text>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-black text-lg font-bold">{item.first_name} {item.last_name}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{item.program || "Program not specified"}</Text>
                  {item.year_of_study && (
                    <Text className="text-gray-500 text-xs mt-1">Year {item.year_of_study}</Text>
                  )}
                </View>
              </TouchableOpacity>

              <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
            </View>

            {activeTab === "pending" && (
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  onPress={() => handleRespondToRequest(item.connection_id, "accept")}
                  disabled={respondingTo === item.connection_id}
                  className="flex-1 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#3b82f6",
                    opacity: respondingTo === item.connection_id ? 0.6 : 1,
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    {respondingTo === item.connection_id ? "..." : "Accept"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRespondToRequest(item.connection_id, "decline")}
                  disabled={respondingTo === item.connection_id}
                  className="flex-1 py-3 rounded-xl"
                  style={{
                    backgroundColor: "#ef4444",
                    opacity: respondingTo === item.connection_id ? 0.6 : 1,
                  }}
                >
                  <Text className="text-white text-center font-semibold">
                    {respondingTo === item.connection_id ? "..." : "Decline"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>
      </Animated.View>
    )
  }

  const renderMapView = () => {
    if (!userLocation) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-500">Loading map...</Text>
        </View>
      )
    }

    return (
      <View className="flex-1">
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Render nearby users */}
          {nearbyUsers.map((user) => {
            if (user.latitude && user.longitude) {
              return (
                <Marker
                  key={user.user_id}
                  coordinate={{
                    latitude: user.latitude,
                    longitude: user.longitude,
                  }}
                  title={`${user.first_name} ${user.last_name}`}
                  description={user.program || "Student"}
                  pinColor="#3b82f6"
                  onCalloutPress={() => handleViewProfile(user.user_id)}
                />
              )
            }
            return null
          })}

          {/* Render buildings */}
          {buildings.map((building) => {
            if (building.latitude && building.longitude) {
              return (
                <Marker
                  key={building.building_id}
                  coordinate={{
                    latitude: Number(building.latitude),
                    longitude: Number(building.longitude),
                  }}
                  title={building.name}
                  description={building.code}
                  pinColor="#f59e0b"
                  onCalloutPress={() => router.push(`/university/building-details?buildingId=${building.building_id}`)}
                />
              )
            }
            return null
          })}
        </MapView>

        {/* Legend */}
        <View className="absolute bottom-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg">
          <View className="flex-row items-center justify-around">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              <Text className="text-sm text-gray-700">Nearby Users ({nearbyUsers.length})</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <Text className="text-sm text-gray-700">Buildings ({buildings.length})</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 via-white to-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <DropdownAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onDismiss={hideAlert} />
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1 ml-4">Connections</Text>
        <TouchableOpacity onPress={() => setViewMode(viewMode === "list" ? "map" : "list")} className="ml-2">
          <Ionicons name={viewMode === "list" ? "map" : "list"} size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {viewMode === "list" && (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="px-4 py-4 border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setActiveTab(tab.value)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  backgroundColor: activeTab === tab.value ? Colors.light.primary : "#f3f4f6",
                }}
              >
                <Text style={{ color: activeTab === tab.value ? "#fff" : "#6b7280", fontWeight: "600" }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {viewMode === "list" ? (
        isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-500">Loading connections...</Text>
          </View>
        ) : connections.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text className="text-lg text-gray-600 mt-4 text-center">No {activeTab} connections yet</Text>
          </View>
        ) : (
          <FlatList
            data={connections}
            renderItem={renderConnectionCard}
            keyExtractor={(item, index) => item?.connection_id ?? `conn-${index}`}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          />
        )
      ) : (
        renderMapView()
      )}
    </SafeAreaView>
  )
}

export default ConnectionScreen
