"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TextInput,
} from "react-native"
import { Image } from "expo-image"

interface Connection {
  user_id: string
  first_name: string
  last_name: string
  profile_picture_url?: string
  profile_headline?: string
}

interface NewMessageModalProps {
  visible: boolean
  onClose: () => void
  onSelectUser: (userId: string) => void
  connections: Connection[]
  isLoading?: boolean
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({
  visible,
  onClose,
  onSelectUser,
  connections,
  isLoading = false,
}) => {
  const slideAnim = React.useRef(new Animated.Value(300)).current
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>(connections)

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start()
    }
  }, [visible])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConnections(connections)
      return
    }

    const filtered = connections.filter((conn) => {
      const fullName = `${conn.first_name} ${conn.last_name}`.toLowerCase()
      return fullName.includes(searchQuery.toLowerCase())
    })
    setFilteredConnections(filtered)
  }, [searchQuery, connections])

  const handleUserPress = (userId: string) => {
    onSelectUser(userId)
    onClose()
    setSearchQuery("")
  }

  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.user_id)}
      className="flex-row items-center py-3 px-4 border-b border-gray-100"
      activeOpacity={0.7}
    >
      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
        {item.profile_picture_url ? (
          <Image
            source={{ uri: item.profile_picture_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
          />
        ) : (
          <Ionicons name="person" size={24} color="#3b82f6" />
        )}
      </View>
      <View className="flex-1">
        <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-base font-semibold text-black">
          {item.first_name} {item.last_name}
        </Text>
        {item.profile_headline && (
          <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-sm text-gray-500">
            {item.profile_headline}
          </Text>
        )}
      </View>
      <Ionicons name="chatbubble-outline" size={20} color="#ef4444" />
    </TouchableOpacity>
  )

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-end">
          <TouchableWithoutFeedback>
            <Animated.View
              className="bg-white rounded-t-3xl"
              style={{
                maxHeight: "80%",
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Handle Bar */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="px-4 pb-3 border-b border-gray-100">
                <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-lg font-semibold text-black text-center">
                  New Message
                </Text>
              </View>

              {/* Search Bar */}
              <View className="px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
                  <Ionicons name="search" size={20} color="#94a3b8" />
                  <TextInput
                    style={{ fontFamily: "Gilroy-Regular" }}
                    className="flex-1 ml-2 text-sm"
                    placeholder="Search connections..."
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Connection List */}
              {isLoading ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#ef4444" />
                  <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-500 mt-3">
                    Loading connections...
                  </Text>
                </View>
              ) : filteredConnections.length > 0 ? (
                <FlatList
                  data={filteredConnections}
                  keyExtractor={(item) => item.user_id}
                  renderItem={renderConnectionItem}
                  style={{ maxHeight: 400 }}
                />
              ) : (
                <View className="py-12 items-center">
                  <Ionicons name="people-outline" size={48} color="#9ca3af" />
                  <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-500 mt-3">
                    {searchQuery ? "No connections found" : "No connections yet"}
                  </Text>
                  <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-400 text-xs mt-1">
                    Connect with users to start messaging
                  </Text>
                </View>
              )}

              {/* Close Button */}
              <View className="px-4 py-4 border-t border-gray-100">
                <TouchableOpacity onPress={onClose} className="bg-gray-100 rounded-full py-3">
                  <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-center text-base text-gray-700">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

export default NewMessageModal
