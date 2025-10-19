"use client";

import Colors from "@/src/constants/Colors";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
 Alert } from "react-native";
import { forgotSchema, ForgotSchema } from "@/src/schemas/authSchemas";

import { forgotPassword } from "@/src/services/authServices";
import { useState } from "react";


export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotSchema>({
    resolver: zodResolver(forgotSchema),
  });

  // const onSubmit = (data: ForgotSchema) => {
  //   console.log("Send reset link to:", data.email);
  //   router.push("/auth/reset-password");
  // };
  // const onSubmit = () => {
  //   router.push("/auth/verify-otp");
  // };

    const onSubmit = async (data: ForgotSchema) => {
    setIsLoading(true)
    try {
      const result = await forgotPassword(data)
      if (result.success) {
        Alert.alert("Success", result.data || "Reset link sent to your email")
        router.push("/auth/reset-password");
      } else {
        Alert.alert("Login Failed", result.error || "Please try again")
      }
    } catch {
      Alert.alert("Error", "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email to reset your password.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              placeholderTextColor={Colors.light.textSecondary}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24 },
  inner: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", color: Colors.light.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
  },
  inputError: { borderColor: Colors.light.error },
  errorText: { color: Colors.light.error, marginBottom: 12 },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
