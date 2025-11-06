"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Animated, View, Text, StatusBar, TouchableOpacity, Dimensions, Platform, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useSocket } from "@/src/contexts/socket-context"
import { dataService } from "@/src/services/data-service"

const VideoCallScreen: React.FC = () => {
  const { id, isVideoCall, callId: urlCallId } = useLocalSearchParams()
  const { socket, acceptCall, rejectCall, endCall } = useSocket()
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [callStatus, setCallStatus] = useState<"ringing" | "connecting" | "active" | "ended">("ringing")
  const [callId, setCallId] = useState<string | null>(urlCallId as string | null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callDurationRef = useRef<NodeJS.Timeout | null>(null)
  const screenWidth = Dimensions.get("window").width
  const screenHeight = Dimensions.get("window").height

  // entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [])

  // Load conversation data
  useEffect(() => {
    try {
      const data = dataService.getChat(id as string)
      // You can use this data to display participant info
    } catch (error) {
      console.error("Failed to load conversation:", error)
    }
  }, [id])

  const handleEndCall = useCallback(() => {
    if (callId) {
      endCall(callId)
    }
    if (callDurationRef.current) {
      clearInterval(callDurationRef.current)
    }
    router.back()
  }, [callId, endCall])

  // Listen for call events
  useEffect(() => {
    if (!socket) return

    const onCallRequest = (data: { callId: string; callerId: string; callerName: string; isVideoCall: boolean }) => {
      // We're receiving a call
      setCallId(data.callId)
      setCallStatus("ringing")
    }

    const onCallAccepted = (data: { callId: string }) => {
      setCallId(data.callId)
      setCallStatus("active")
      // Start call duration timer
      if (callDurationRef.current) {
        clearInterval(callDurationRef.current)
      }
      callDurationRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }

    const onCallRejected = () => {
      Alert.alert("Call Rejected", "The other party rejected your call")
      handleEndCall()
    }

    const onCallEnded = () => {
      Alert.alert("Call Ended", "The call has been ended")
      handleEndCall()
    }

    socket.on("call_request", onCallRequest)
    socket.on("call_accepted", onCallAccepted)
    socket.on("call_rejected", onCallRejected)
    socket.on("call_ended", onCallEnded)

    // If we have a callId from URL, we're receiving a call
    // Otherwise, we initiated the call and are waiting for acceptance
    if (urlCallId) {
      setCallId(urlCallId as string)
      setCallStatus("ringing")
    } else {
      setCallStatus("ringing")
    }

    return () => {
      socket.off("call_request", onCallRequest)
      socket.off("call_accepted", onCallAccepted)
      socket.off("call_rejected", onCallRejected)
      socket.off("call_ended", onCallEnded)
    }
  }, [socket, handleEndCall])

  // Auto-hide controls
  useEffect(() => {
    if (callStatus !== "active") return

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 5000)

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls, callStatus])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleAcceptCall = () => {
    if (callId) {
      acceptCall(callId)
      setCallStatus("active")
      callDurationRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
  }

  const handleRejectCall = () => {
    if (callId) {
      rejectCall(callId)
    }
    router.back()
  }

  const handleScreenTap = () => {
    if (callStatus === "active") {
      setShowControls(!showControls)
    }
  }

  // Mock participant data - replace with actual data from conversation
  const participant = {
    participantName: "Participant",
    participantHeadline: "Active now",
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SafeAreaView className="flex-1 bg-black">
        <Animated.View style={{ flex: 1, opacity: fadeAnim }} onTouchEnd={handleScreenTap}>
          {/* Remote Video (Main) */}
          <View
            className="flex-1 bg-gray-900 items-center justify-center"
            style={{
              width: screenWidth,
              height: screenHeight - (Platform.OS === "ios" ? 100 : 80),
            }}
          >
            <View className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 items-center justify-center">
              <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center mb-4">
                <Ionicons name="person" size={48} color="#cbd5e1" />
              </View>
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 20, color: "#fff", marginBottom: 8 }}>
                {participant.participantName}
              </Text>
              <Text style={{ fontFamily: "Gilroy-Regular", fontSize: 14, color: "#cbd5e1", marginBottom: 16 }}>
                {callStatus === "ringing" ? "Ringing..." : callStatus === "connecting" ? "Connecting..." : participant.participantHeadline}
              </Text>
              {callStatus === "active" && (
                <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 24, color: "#ef4444" }}>
                  {formatDuration(callDuration)}
                </Text>
              )}
            </View>

            {/* Local Video (PiP) */}
            {isVideoCall && callStatus === "active" && (
              <View className="absolute bottom-20 right-4 w-24 h-32 bg-gray-800 rounded-lg border-2 border-gray-700 items-center justify-center overflow-hidden">
                <View className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-800 items-center justify-center">
                  <Ionicons name="person" size={32} color="#cbd5e1" />
                </View>
              </View>
            )}
          </View>

          {/* Call Controls */}
          {showControls && (
            <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-4 py-6">
              {callStatus === "ringing" ? (
                <View className="flex-row items-center justify-center gap-6">
                  <TouchableOpacity
                    onPress={handleRejectCall}
                    className="w-16 h-16 rounded-full bg-red-500 items-center justify-center"
                  >
                    <Ionicons name="call" size={28} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAcceptCall}
                    className="w-16 h-16 rounded-full bg-green-500 items-center justify-center"
                  >
                    <Ionicons name="call" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : callStatus === "active" ? (
                <View className="flex-row items-center justify-center gap-6">
                  {/* Mute Button */}
                  <TouchableOpacity
                    onPress={() => setIsMuted(!isMuted)}
                    className={`w-14 h-14 rounded-full items-center justify-center ${
                      isMuted ? "bg-red-500" : "bg-gray-700"
                    }`}
                  >
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Speaker Button */}
                  <TouchableOpacity
                    onPress={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`w-14 h-14 rounded-full items-center justify-center ${
                      isSpeakerOn ? "bg-gray-700" : "bg-red-500"
                    }`}
                  >
                    <Ionicons name={isSpeakerOn ? "volume-high" : "volume-mute"} size={24} color="#fff" />
                  </TouchableOpacity>

                  {/* Video Button (only for video calls) */}
                  {isVideoCall === "true" && (
                    <TouchableOpacity
                      onPress={() => setIsVideoOn(!isVideoOn)}
                      className={`w-14 h-14 rounded-full items-center justify-center ${
                        isVideoOn ? "bg-gray-700" : "bg-red-500"
                      }`}
                    >
                      <Ionicons name={isVideoOn ? "videocam" : "videocam-off"} size={24} color="#fff" />
                    </TouchableOpacity>
                  )}

                  {/* End Call Button */}
                  <TouchableOpacity
                    onPress={handleEndCall}
                    className="w-14 h-14 rounded-full bg-red-500 items-center justify-center"
                  >
                    <Ionicons name="call" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </>
  )
}

export default VideoCallScreen

