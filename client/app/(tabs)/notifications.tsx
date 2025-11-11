import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import React, { useEffect, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Image } from "expo-image"

interface Notification {
  id: string
  type: "connection_request" | "message" | "post_like" | "comment"
  title: string
  message: string
  timestamp: Date
  read: boolean
  sender?: {
    id: string
    name: string
    avatar?: string
  }
  actionData?: {
    userId?: string
    postId?: string
    connectionId?: string
  }
}

// Mock notifications - replace with actual API call
const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    type: "connection_request",
    title: "New Connection Request",
    message: "Alex Chen wants to connect with you",
    timestamp: new Date(Date.now() - 5 * 60000),
    read: false,
    sender: {
      id: "user-2",
      name: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    },
    actionData: {
      userId: "user-2",
      connectionId: "conn-1",
    },
  },
  {
    id: "notif-2",
    type: "connection_request",
    title: "New Connection Request",
    message: "Jordan Williams wants to connect with you",
    timestamp: new Date(Date.now() - 2 * 3600000),
    read: false,
    sender: {
      id: "user-3",
      name: "Jordan Williams",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    },
    actionData: {
      userId: "user-3",
      connectionId: "conn-2",
    },
  },
  {
    id: "notif-3",
    type: "message",
    title: "New Message",
    message: "Sam Patel sent you a message",
    timestamp: new Date(Date.now() - 24 * 3600000),
    read: true,
    sender: {
      id: "user-4",
      name: "Sam Patel",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    },
    actionData: {
      userId: "user-4",
    },
  },
  {
    id: "notif-4",
    type: "post_like",
    title: "Post Liked",
    message: "Taylor Martinez liked your post",
    timestamp: new Date(Date.now() - 3 * 24 * 3600000),
    read: true,
    sender: {
      id: "user-5",
      name: "Taylor Martinez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    },
  },
]

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    try {
      // Replace with actual API call
      setNotifications(mockNotifications)
    } catch (error) {
      console.error("Failed to load notifications:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadNotifications()
  }

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )

    // Navigate based on notification type
    if (notification.type === "connection_request" && notification.sender) {
      router.push({
        pathname: "/(users)/[id]",
        params: { id: notification.sender.id },
      })
    } else if (notification.type === "message" && notification.sender) {
      router.push(`/messaging/chats/${notification.sender.id}`)
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "connection_request":
        return "person-add"
      case "message":
        return "chatbubble"
      case "post_like":
        return "heart"
      case "comment":
        return "chatbox"
      default:
        return "notifications"
    }
  }

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      className={`flex-row items-start px-4 py-3 border-b border-gray-100 ${!item.read ? "bg-blue-50" : "bg-white"}`}
      activeOpacity={0.7}
    >
      {/* Avatar or Icon */}
      <View className="mr-3">
        {item.sender?.avatar ? (
          <Image source={{ uri: item.sender.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
        ) : (
          <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center">
            <Ionicons name={getNotificationIcon(item.type) as any} size={24} color="#ef4444" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          style={{ fontFamily: item.read ? "Gilroy-Regular" : "Gilroy-SemiBold" }}
          className="text-sm text-gray-900 mb-1"
        >
          {item.title}
        </Text>
        <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-sm text-gray-600 mb-1">
          {item.message}
        </Text>
        <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-xs text-gray-400">
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>

      {/* Unread indicator */}
      {!item.read && <View className="w-2 h-2 bg-red-500 rounded-full mt-2" />}
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ fontFamily: "Gilroy-Regular" }} className="mt-3 text-gray-500">
          Loading notifications...
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100">
        <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 28, color: "#0f172a" }}>Notifications</Text>
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#ef4444" />}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="notifications-outline" size={64} color="#cbd5e1" />
          <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-lg text-gray-900 mt-4 text-center">
            No notifications yet
          </Text>
          <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-sm text-gray-500 mt-2 text-center">
            When you get notifications, they&apos;ll show up here
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

export default Notifications

