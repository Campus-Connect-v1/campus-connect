import { useEffect, useState } from "react"
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native"
import { sendConnectionRequest, cancelConnectionRequest } from "@/src/services/authServices"
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"

interface ConnectionButtonProps {
  userId: string
  initialStatus?: "none" | "pending" | "connected"
  onStatusChange?: (status: "none" | "pending" | "connected") => void
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({ 
  userId, 
  initialStatus = "none",
  onStatusChange 
}) => {
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">(initialStatus)
  const [isRequesting, setIsRequesting] = useState(false)
  const { success, error: toast } = useDropdownAlert()

  // Sync state with server value when component mounts or userId changes
  useEffect(() => {
    setConnectionStatus(initialStatus)
  }, [initialStatus, userId])

  const updateStatus = (newStatus: "none" | "pending" | "connected") => {
    setConnectionStatus(newStatus)
    if (onStatusChange) {
      onStatusChange(newStatus)
    }
  }

  const handleConnectionRequest = async () => {
    if (isRequesting) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsRequesting(true)
    try {
      const result = await sendConnectionRequest(userId)
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        updateStatus("pending")
        success("uniCLIQ", "Connection request sent", 3000)
      } else {
        toast("uniCLIQ", result.error?.message || "Failed to send request", 3000)
      }
    } catch (err) {
      toast("uniCLIQ", "An error occurred. Please try again.", 3000)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleCancelRequest = async () => {
    if (isRequesting) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setIsRequesting(true)
    try {
      const result = await cancelConnectionRequest(userId)
      if (result.success) {
        updateStatus("none")
        success("uniCLIQ", "Connection request cancelled", 3000)
      } else {
        toast("uniCLIQ", result.error?.message || "Failed to cancel request", 3000)
      }
    } catch (err) {
      toast("uniCLIQ", "An error occurred. Please try again.", 3000)
    } finally {
      setIsRequesting(false)
    }
  }

  const getButtonConfig = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          text: "Connected",
          icon: "checkmark-circle" as const,
          bgColor: "#10b981",
          onPress: () => {}, // Could add unfollow functionality
        }
      case "pending":
        return {
          text: "Pending",
          icon: "time" as const,
          bgColor: "#6b7280",
          onPress: handleCancelRequest,
        }
      default:
        return {
          text: "Connect",
          icon: "person-add" as const,
          bgColor: "#3b82f6",
          onPress: handleConnectionRequest,
        }
    }
  }

  const config = getButtonConfig()

  return (
    <View>
      <TouchableOpacity
        onPress={config.onPress}
        disabled={isRequesting || connectionStatus === "connected"}
        activeOpacity={0.7}
        style={{
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 24,
          backgroundColor: config.bgColor,
          opacity: isRequesting ? 0.6 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 120,
        }}
      >
        {isRequesting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name={config.icon} size={16} color="#ffffff" />
            <Text
              style={{
                color: "#ffffff",
                textAlign: "center",
                fontSize: 14,
                fontFamily: "Gilroy-SemiBold",
                marginLeft: 6,
              }}
            >
              {config.text}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default ConnectionButton
