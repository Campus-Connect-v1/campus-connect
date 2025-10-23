"use client"

import React, { useEffect, useState } from "react"
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ColorValue,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"

const { width } = Dimensions.get("window")

export type AlertType = "success" | "error" | "warning" | "info"

interface DropdownAlertProps {
  visible: boolean
  type: AlertType
  title: string
  message: string
  duration?: number
  onDismiss?: () => void
}

const getAlertColors = (type: AlertType) => {
  switch (type) {
    case "success":
      return {
        gradient: ["rgb(52, 211, 153)", "rgb(16, 185, 129)"],
        icon: "✓",
      }
    case "error":
      return {
        gradient: ["rgb(185, 28, 28)", "rgb(120, 18, 18)"],
        icon: "✕",
      }
    case "warning":
      return {
        gradient: ["rgba(245, 158, 11, 0.8)", "rgba(217, 119, 6, 0.8)"],
        icon: "!",
      }
    case "info":
      return {
        gradient: ["rgba(59, 130, 246, 0.8)", "rgba(37, 99, 235, 0.8)"],
        icon: "ℹ",
      }
  }
}

export default function DropdownAlert({
  visible,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
}: DropdownAlertProps) {
  const slideAnim = React.useRef(new Animated.Value(-120)).current
  const [isVisible, setIsVisible] = useState(visible)

  const colors = getAlertColors(type)

  useEffect(() => {
    if (visible) {
      setIsVisible(true)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 20,
      }).start()

      const timer = setTimeout(() => {
        dismissAlert()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible])

  const dismissAlert = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false)
      onDismiss?.()
    })
  }

  if (!isVisible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[...colors.gradient] as [ColorValue, ColorValue, ...ColorValue[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <BlurView intensity={60} tint="light" style={styles.blur}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{colors.icon}</Text>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            <TouchableOpacity
              onPress={dismissAlert}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="white" />
              
            </TouchableOpacity>
          </View>
        </BlurView>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  gradient: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  blur: {
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)", // subtle frosted layer
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    fontFamily: "Gilroy-Medium",
  },
  message: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 16,
    fontFamily: "Gilroy-Medium",
  },
  closeButton: {
    padding: 4,
  },
})
