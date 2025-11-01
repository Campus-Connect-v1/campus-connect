"use client"

import { Ionicons } from "@expo/vector-icons"
import { TouchableOpacity } from "react-native"
import * as Haptics from "expo-haptics"

interface FloatingAddButtonProps {
  onPress: () => void
}

export default function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="absolute bottom-8 right-6 w-14 h-14 bg-[#002D69] rounded-full items-center justify-center shadow-lg z-50"
      style={{
        shadowColor: "#002D69",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Ionicons name="add" size={28} color="white" />
    </TouchableOpacity>
  )
}
