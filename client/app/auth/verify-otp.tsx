"use client";

import Colors from "@/src/constants/Colors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import DropdownAlert from "@/src/components/ui/DropdownAlert";
import { verifyOtpSchema, VerifyOtpSchema } from "@/src/schemas/authSchemas";
import { verifyOtp } from "@/src/services/authServices";
import { useState } from "react";
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert";

export default function VerifyOtpScreen() {
  const router = useRouter();
    const { alert, hideAlert, success, error } = useDropdownAlert()
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const email = params.email as string || "";
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: VerifyOtpSchema) => {
    console.log("Form submitted with data:", data);
    setIsLoading(true);
    
    try {
      // Validate email and OTP format first
      if (!email) {
        error("Error", "Email address is required for verification.", 4000);
        router.push("/auth/verify-email");
        return;
      }
      
      if (!data.otp || data.otp.length !== 6) {
        error("Invalid OTP", "Please enter a 6-digit verification code.", 4000);
        return;
      }
      
      console.log("Attempting to verify OTP:", { otp: data.otp, email });
      const result = await verifyOtp({ ...data, email });
      console.log("Verify OTP result:", result);
      
      if (result.success) {
        success("Success", "Email verified successfully! You can now log in.", 4000);
        router.push("/auth/login");
      } else {
        console.log("OTP verification failed:", result.error);
        error("Failed", result.error || "Invalid OTP. Please try again.", 4000);
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      error("Error", error.message || "An unexpected error occurred", 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <DropdownAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onDismiss={hideAlert}
              />
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          Please enter the 6-digit code sent to {email || "your email address"}.
        </Text>

        <Controller
          control={control}
          name="otp"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.otp && styles.inputError]}
              placeholder="000000"
              placeholderTextColor={Colors.light.textSecondary}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              autoCapitalize="none"
            />
          )}
        />
        {errors.otp && (
          <Text style={styles.errorText}>{errors.otp.message}</Text>
        )}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => router.push("/auth/verify-email")}
        >
          <Text style={styles.linkText}>Didn&apos;t receive code? Resend</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24 },
  inner: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Gilroy-SemiBold",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 32,
    textAlign: "center",
    fontFamily: "Gilroy-Regular",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 24,
    backgroundColor: Colors.light.inputBackground,
    marginBottom: 12,
    fontFamily: "Gilroy-Medium",

  },
  inputError: { borderColor: Colors.light.error },
  errorText: { color: Colors.light.error, marginBottom: 12, textAlign: "center", fontFamily: "Gilroy-Regular", },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold", fontFamily: "Gilroy-SemiBold", },
  buttonDisabled: { opacity: 0.7 },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontFamily: "Gilroy-Medium",
  },
});