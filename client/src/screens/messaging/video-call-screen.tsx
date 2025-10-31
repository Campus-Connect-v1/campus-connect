"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Animated, View, Text, StatusBar, TouchableOpacity, Dimensions, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router, useLocalSearchParams } from "expo-router"
import { useLanguage } from "@/src/contexts/language-context"
import { i18nService } from "@/src/services/i18n-service"
import { mockActiveCall } from "@/src/services/mock-data/calls-mock"

const VideoCallScreen: React.FC = () => {
  const { id } = useLocalSearchParams()
  const { language } = useLanguage()
  const t = (key: keyof ReturnType<typeof i18nService.getTranslations>) => i18nService.t(language, key)

  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const screenWidth = Dimensions.get("window").width
  const screenHeight = Dimensions.get("window").height

  // entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [])

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-hide controls
  useEffect(() => {
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
  }, [showControls])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleEndCall = () => {
    router.back()
  }

  const handleScreenTap = () => {
    setShowControls(!showControls)
  }

  const participant = mockActiveCall

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
                {participant.participantHeadline}
              </Text>
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 24, color: "#ef4444" }}>
                {formatDuration(callDuration)}
              </Text>
            </View>

            {/* Local Video (PiP) */}
            <View className="absolute bottom-20 right-4 w-24 h-32 bg-gray-800 rounded-lg border-2 border-gray-700 items-center justify-center overflow-hidden">
              <View className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-800 items-center justify-center">
                <Ionicons name="person" size={32} color="#cbd5e1" />
              </View>
            </View>
          </View>

          {/* Controls */}
          {showControls && (
            <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-4 py-6">
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

                {/* Video Button */}
                <TouchableOpacity
                  onPress={() => setIsVideoOn(!isVideoOn)}
                  className={`w-14 h-14 rounded-full items-center justify-center ${
                    isVideoOn ? "bg-gray-700" : "bg-red-500"
                  }`}
                >
                  <Ionicons name={isVideoOn ? "videocam" : "videocam-off"} size={24} color="#fff" />
                </TouchableOpacity>

                {/* End Call Button */}
                <TouchableOpacity
                  onPress={handleEndCall}
                  className="w-14 h-14 rounded-full bg-red-500 items-center justify-center"
                >
                  <Ionicons name="call" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </>
  )
}

export default VideoCallScreen
