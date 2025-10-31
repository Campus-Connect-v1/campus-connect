"use client"

import type React from "react"
import { TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"

interface CallButtonProps {
  conversationId: string
  isVideoCall?: boolean
}

const CallButton: React.FC<CallButtonProps> = ({ conversationId, isVideoCall = true }) => {
  const handleCall = () => {
    router.push(`/messaging/video-call/${conversationId}`)
  }

  return (
    <TouchableOpacity onPress={handleCall} className="p-2">
      <Ionicons name={isVideoCall ? "videocam" : "call"} size={20} color="#ef4444" />
    </TouchableOpacity>
  )
}

export default CallButton
