"use client"

import Colors from "@/src/constants/Colors"
import { verifyOtpSchema, type VerifyOtpSchema } from "@/src/schemas/authSchemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import React, { useState, useRef } from "react"

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"

export default function VerifyOtpScreen({ onVerify }: { onVerify: (otp: string) => void }) {
  const [resendTimer, setResendTimer] = useState(60)
  const inputs = useRef<(TextInput | null)[]>([])

  const { control, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<VerifyOtpSchema>({
      resolver: zodResolver(verifyOtpSchema),
      defaultValues: { otp: "" },
    })

  const otp = watch("otp")

  const handleOtpChange = (text: string, index: number) => {
    if (/^\d*$/.test(text)) {
      const newOtp = otp.split("")
      newOtp[index] = text
      const updated = newOtp.join("")
      setValue("otp", updated)

      // Auto focus next input
      if (text && index < 5) inputs.current[index + 1]?.focus()
      // If user deletes, go back
      if (!text && index > 0) inputs.current[index - 1]?.focus()
    }
  }

  const onSubmit = (data: VerifyOtpSchema) => {
    Alert.alert("OTP Submitted", data.otp)
    onVerify(data.otp)
  }

  const handleResend = () => {
    if (resendTimer > 0) return
    setResendTimer(60)
    Alert.alert("OTP Resent", "A new OTP has been sent to your email.")
  }

  // countdown effect
  React.useEffect(() => {
    if (resendTimer === 0) return
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendTimer])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We’ve sent a 6-digit code to your email. Please enter it below.
      </Text>

      <Controller
        control={control}
        name="otp"
        render={() => (
          <View style={styles.otpContainer}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref }}
                style={[styles.otpInput, errors.otp && styles.inputError]}
                keyboardType="numeric"
                maxLength={1}
                value={otp[i] || ""}
                onChangeText={(text) => handleOtpChange(text, i)}
              />
            ))}
          </View>
        )}
      />

      {errors.otp && <Text style={styles.errorText}>{errors.otp.message}</Text>}

      <TouchableOpacity style={styles.verifyButton} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.verifyButtonText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
        <Text style={styles.resendText}>
          {resendTimer > 0
            ? `Resend OTP in ${resendTimer}s`
            : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
    fontFamily: "Gilroy-SemiBold",
  },
  subtitle: {
    textAlign: "center",
    color: Colors.light.textSecondary,
    marginBottom: 32,
    fontFamily: "Gilroy-Medium",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Gilroy-SemiBold",
    backgroundColor: Colors.light.inputBackground,
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  verifyButton: {
    height: 56,
    width: "100%",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Gilroy-SemiBold",
  },
  resendText: {
    color: Colors.light.primary,
    fontFamily: "Gilroy-Medium",
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    marginBottom: 8,
  },
})
