
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
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import MessageBubble from "@/src/components/messaging/message-bubble"
import { dataService } from "@/src/services/data-service"
import { socketService } from "@/src/services/socket-service"

const ChatScreen: React.FC = () => {
  const { id } = useLocalSearchParams()
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsername, setTypingUsername] = useState("")
  const scrollViewRef = useRef<FlatList>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

    // Set up socket connection and listeners
    const setupSocket = async () => {
      try {
        await socketService.connect()

        // Listen for typing events
        socketService.onTyping((data) => {
          if (data.conversationId === id) {
            setIsTyping(true)
            setTypingUsername(data.username)
          }
        })

        socketService.onStopTyping((data) => {
          if (data.conversationId === id) {
            setIsTyping(false)
            setTypingUsername("")
          }
        })

        // Listen for new messages
        socketService.onMessageReceived((message) => {
          if (message.senderId._id === conversation?.participant_id) {
            setMessages((prev) => [...prev, message])
          }
        })
      } catch (error) {
        console.error("Failed to setup socket:", error)
      }
    }

    setupSocket()

    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Remove socket listeners when leaving chat
      socketService.removeAllListeners()
    }
  }, [id])

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
      const newMessage = dataService.addMessage(id as string, messageText)
      setMessages([...messages, newMessage])
      setMessageText("")

      // Send via socket if connected
      if (conversation?.participant_id) {
        socketService.sendMessage(conversation.participant_id, messageText)
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const handleTextChange = (text: string) => {
    setMessageText(text)

    // Emit typing event
    if (text.trim() && conversation?.participant_id) {
      socketService.emitTyping(id as string, conversation.participant_id)

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitStopTyping(id as string, conversation.participant_id)
      }, 2000)
    } else if (!text.trim() && conversation?.participant_id) {
      socketService.emitStopTyping(id as string, conversation.participant_id)
    }
  }

  const handleCall = () => {
    if (!conversation?.participant_id) {
      Alert.alert("Error", "Cannot initiate call. Receiver information not available.")
      return
    }
    
    Alert.alert(
      "Voice Call",
      `Calling ${conversation.participant_name}...`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            // TODO: Implement actual call functionality
            console.log("Initiating call to:", conversation.participant_id)
          },
        },
      ]
    )
  }

  const handleVideoCall = () => {
    if (!conversation?.participant_id) {
      Alert.alert("Error", "Cannot initiate video call. Receiver information not available.")
      return
    }
    
    Alert.alert(
      "Video Call",
      `Video calling ${conversation.participant_name}...`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            // TODO: Implement actual video call functionality
            console.log("Initiating video call to:", conversation.participant_id)
          },
        },
      ]
    )
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
                {isTyping ? `${typingUsername} is typing...` : conversation?.is_online ? "Active now" : "Offline"}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="p-2" onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2" onPress={handleVideoCall}>
              <Ionicons name="videocam-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
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
                onChangeText={handleTextChange}
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
