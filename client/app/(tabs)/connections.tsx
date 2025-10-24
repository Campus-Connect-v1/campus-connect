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

type ConnectionStatus = "accepted" | "pending" | "declined"

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
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

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
  }, [activeTab])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start()
  }, [])

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

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 via-white to-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <DropdownAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onDismiss={hideAlert} />
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold flex-1 ml-4">Connections</Text>
      </View>

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

      {isLoading ? (
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
      )}
    </SafeAreaView>
  )
}

export default ConnectionScreen
