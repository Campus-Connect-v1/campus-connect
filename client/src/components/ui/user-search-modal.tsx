"use client"

import { Ionicons } from "@expo/vector-icons"
import type React from "react"
import { useState } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet, 
  Animated,
  TouchableWithoutFeedback 
} from "react-native"
import { Image } from "expo-image"
import { useRouter } from "expo-router"

interface UserSearchModalProps {
  visible: boolean
  onClose: () => void
  users: Array<{
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string
    program?: string
  }>
  isLoading?: boolean
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  visible,
  onClose,
  users,
  isLoading = false,
}) => {
  const router = useRouter()
  const slideAnim = React.useRef(new Animated.Value(300)).current

  React.useEffect(() => {
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

  const handleUserPress = (userId: string) => {
    onClose() // Close modal first
    setTimeout(() => {
      router.push({
        pathname: '/(users)/[id]',
        params: { id: userId },
      })
    }, 100)
  }

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.id)}
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
        <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base font-semibold text-black">
          {item.first_name} {item.last_name}
        </Text>
        {item.program && (
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-500">
            {item.program}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-end">
          <TouchableWithoutFeedback>
            <Animated.View 
              className="bg-white rounded-t-3xl"
              style={{ 
                maxHeight: '80%',
                transform: [{ translateY: slideAnim }] 
              }}
            >
              {/* Handle Bar */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="px-4 pb-3 border-b border-gray-100">
                <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black text-center">
                  Search Results
                </Text>
              </View>

              {/* User List */}
              {isLoading ? (
                <View className="py-12 items-center">
                  <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500">
                    Loading...
                  </Text>
                </View>
              ) : users.length > 0 ? (
                <FlatList
                  data={users}
                  keyExtractor={(item) => item.id}
                  renderItem={renderUserItem}
                  style={{ maxHeight: 400 }}
                />
              ) : (
                <View className="py-12 items-center">
                  <Ionicons name="search-outline" size={48} color="#9ca3af" />
                  <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 mt-3">
                    No users found
                  </Text>
                </View>
              )}

              {/* Close Button */}
              <View className="px-4 py-4 border-t border-gray-100">
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-gray-100 rounded-full py-3"
                >
                  <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-center text-base text-gray-700">
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

export default UserSearchModal
