import { useEffect, useState } from "react"
import { TouchableOpacity, Text, View } from "react-native"
import { sendConnectionRequest, cancelConnectionRequest } from "@/src/services/authServices"
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"

interface ConnectionButtonProps {
  userId: string
  initialStatus?: "none" | "pending" | "connected"
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({ userId, initialStatus = "none" }) => {
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">(initialStatus)
  const [isRequesting, setIsRequesting] = useState(false)
  const { success, error: toast } = useDropdownAlert()

  // Sync state with server value when component mounts or userId changes
  useEffect(() => {
    setConnectionStatus(initialStatus)
  }, [initialStatus, userId])

  const handleConnectionRequest = async () => {
    setIsRequesting(true)
    const result = await sendConnectionRequest(userId)
    if (result.success) {
      setConnectionStatus("pending")
      success("uniCLIQ", "Connection request sent", 3000)
    } else {
      toast("uniCLIQ", result.error?.message || "Failed to send request", 3000)
    }
    setIsRequesting(false)
  }

  const handleCancelRequest = async () => {
    setIsRequesting(true)
    const result = await cancelConnectionRequest(userId)
    if (result.success) {
      setConnectionStatus("none")
      success("uniCLIQ", "Connection request cancelled", 3000)
    } else {
      toast("uniCLIQ", result.error?.message || "Failed to cancel request", 3000)
    }
    setIsRequesting(false)
  }

  return (
    <View>
      <TouchableOpacity
        onPress={connectionStatus === "pending" ? handleCancelRequest : handleConnectionRequest}
        disabled={isRequesting}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 28,
          marginLeft: 16,
          backgroundColor: connectionStatus === "pending" ? "#000000" : "#ef4444", // black or red
          opacity: isRequesting ? 0.5 : 1,
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            textAlign: "center",
            fontSize: 14,
            fontFamily: "Gilroy-SemiBold",
          }}
        >
          {isRequesting ? "..." : connectionStatus === "pending" ? "Cancel" : "Follow"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

export default ConnectionButton
