"use client"

import type React from "react"
import { TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useSocket } from "@/src/contexts/socket-context"

interface CallButtonProps {
  conversationId: string
  receiverId?: string
  isVideoCall?: boolean
}

const CallButton: React.FC<CallButtonProps> = ({ conversationId, receiverId, isVideoCall = true }) => {
  const { initiateCall, socket } = useSocket()

  const handleCall = () => {
    if (!receiverId) {
      Alert.alert("Error", "Cannot initiate call: Receiver ID not available")
      return
    }

    if (!socket || !socket.connected) {
      Alert.alert("Connection Error", "Please wait for connection to be established")
      return
    }

    // Initiate call via socket
    initiateCall(receiverId, isVideoCall)

    // Navigate to call screen
    router.push(`/messaging/video-call/${conversationId}?isVideoCall=${isVideoCall}`)
  }

  return (
    <TouchableOpacity onPress={handleCall} className="p-2">
      <Ionicons name={isVideoCall ? "videocam" : "call"} size={20} color="#ef4444" />
    </TouchableOpacity>
  )
}

export default CallButton
