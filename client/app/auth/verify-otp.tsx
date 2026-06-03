import Colors from "@/src/constants/Colors"
import { Font } from "@/src/theme/typography"
import { resendOtp, verifyOtp } from "@/src/services/authServices"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

export default function VerifyOtpScreen() {
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email: string }>()
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code we emailed you.")
      return
    }
    setIsLoading(true)
    try {
      const result = await verifyOtp(email, otp)
      if (result.success) {
        Alert.alert("Verified", "Your email is verified. Please sign in.")
        router.replace("/auth/login")
      } else {
        Alert.alert("Verification failed", result.error.message || "Invalid or expired code")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    try {
      const result = await resendOtp(email)
      Alert.alert(
        result.success ? "Code sent" : "Could not resend",
        result.success ? "Check your inbox for a new code." : result.error.message,
      )
    } finally {
      setIsResending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{"\n"}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor={Colors.light.textSecondary}
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={isResending} style={styles.resend}>
          <Text style={styles.resendText}>
            {isResending ? "Sending…" : "Didn't get a code? Resend"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    color: Colors.light.text,
    marginBottom: 12,
    fontFamily: Font.displayBold,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 32,
    fontFamily: "Barlow_500Medium",
    lineHeight: 24,
  },
  email: {
    color: Colors.light.text,
    fontFamily: "Barlow_600SemiBold",
  },
  input: {
    height: 64,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    letterSpacing: 8,
    backgroundColor: Colors.light.inputBackground,
    fontFamily: "Barlow_600SemiBold",
    marginBottom: 24,
  },
  button: {
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Barlow_600SemiBold",
  },
  resend: {
    alignItems: "center",
  },
  resendText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontFamily: "Barlow_500Medium",
  },
})
