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
import DropdownAlert from "@/src/components/ui/DropdownAlert";
import { forgotPassword } from "@/src/services/authServices";
import { useState } from "react";
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";


export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { alert, hideAlert, success, error } = useDropdownAlert();
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
      const result = await forgotPassword({ email: data.email })
      if (result.success) {
  const msg =
    typeof result.data === "string"
      ? result.data
      : result.data?.message || "Reset link sent to your email";

  success("Success", msg, 3000);
  router.push("/auth/reset-password");
} else {
  const errMsg =
    typeof result.error === "string"
      ? result.error
      : result.error?.message || "Please try again";

  error("Failed", errMsg, 3000);
} 
} catch {
  error("Error", "An unexpected error occurred", 3000);
} finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1">

  <TouchableOpacity className="flex-row items-center" onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color="#000" />
          <Text className="font-[Gilroy-Medium] text-lg">Back</Text>
        </TouchableOpacity>
<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.inner}>
      <DropdownAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onDismiss={hideAlert}
              />
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


    </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24 },
  inner: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", color: Colors.light.text, marginBottom: 8, fontFamily: "Gilroy-SemiBold", },
  subtitle: { fontSize: 16, color: Colors.light.textSecondary, marginBottom: 32, fontFamily: "Gilroy-Regular", },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    fontFamily: "Gilroy-Medium",
  },
  inputError: { borderColor: Colors.light.error },
  errorText: { color: Colors.light.error, marginBottom: 12, fontFamily: "Gilroy-Regular", },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold", fontFamily: "Gilroy-SemiBold", },
});
