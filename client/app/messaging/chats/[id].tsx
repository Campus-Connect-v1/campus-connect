
"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import MessageBubble from "@/src/components/messaging/message-bubble"
import { dataService } from "@/src/services/data-service"
import CallButton from "@/src/components/messaging/call-button"
import { useSocket } from "@/src/contexts/socket-context"

const ChatScreen: React.FC = () => {
  const { id } = useLocalSearchParams()
  const { socket, isConnected, sendMessage } = useSocket()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const scrollViewRef = useRef<FlatList>(null)

  // entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loadChat = () => {
      try {
        const data = dataService.getChat(id as string)
        setConversation(data.conversation)
        setMessages(data.messages)
      } catch (error) {
        console.error("Failed to load chat:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChat()
  }, [id])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!socket) return
    const onReceive = (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg._id || `msg-${Date.now()}`,
          sender_id: msg.senderId?._id || "unknown",
          sender_name: msg.senderId?.username || msg.senderId?.email || "Unknown",
          sender_avatar: undefined,
          content: msg.content,
          timestamp: new Date(msg.createdAt || Date.now()),
          is_current_user: false,
        },
      ])
    }
    const onSent = (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg._id || `msg-${Date.now()}`,
          sender_id: msg.senderId?._id || "current-user",
          sender_name: "You",
          sender_avatar: undefined,
          content: msg.content,
          timestamp: new Date(msg.createdAt || Date.now()),
          is_current_user: true,
        },
      ])
    }
    socket.on("receive_message", onReceive)
    socket.on("message_sent", onSent)
    return () => {
      socket.off("receive_message", onReceive)
      socket.off("message_sent", onSent)
    }
  }, [socket])

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [])

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const handleSendMessage = () => {
    if (!messageText.trim()) return

    setIsSending(true)
    try {
      // Best-effort receiver identification: replace with actual user email/id from API
      const receiverId = conversation?.participant_email || conversation?.participant_name
      if (receiverId) {
        sendMessage(receiverId, messageText)
      }
      const optimistic = dataService.addMessage(id as string, messageText)
      setMessages([...messages, optimistic])
      setMessageText("")
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ef4444" />
      </SafeAreaView>
    )
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="chevron-back" size={24} color="#0f172a" />
            </TouchableOpacity>
            <View>
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 16, color: "#0f172a" }}>
                {conversation?.participant_name}
              </Text>
              <Text style={{ fontFamily: "Gilroy-Regular", fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {conversation?.is_online ? "Active now" : "Offline"}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="call-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
          <CallButton conversationId={conversation.id} isVideoCall={true}/>
        </View>

        {/* Messages */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            ref={scrollViewRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
            scrollEnabled={true}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          />
        </Animated.View>

        {/* Message Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View className="px-4 py-3 border-t border-gray-100 bg-white">
            <View className="flex-row items-center gap-2">
              {/** connection indicator */}
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isConnected ? "#22c55e" : "#ef4444" }} />
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: "Gilroy-Regular",
                  fontSize: 14,
                  color: "#0f172a",
                  backgroundColor: "#f1f5f9",
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
                placeholder="Type a message..."
                placeholderTextColor="#cbd5e1"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity onPress={handleSendMessage} disabled={isSending || !messageText.trim()} className="p-2">
                <Ionicons name="send" size={20} color={isSending || !messageText.trim() ? "#cbd5e1" : "#ef4444"} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}

export default ChatScreen
