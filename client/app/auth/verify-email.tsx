
import Colors from "@/src/constants/Colors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { verifyEmailSchema, VerifyEmailSchema } from "@/src/schemas/authSchemas";
import { resendOtp } from "@/src/services/authServices";
import { useState } from "react";



export default function VerifyEmailScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailSchema>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: VerifyEmailSchema) => {
    setIsLoading(true);
    try {
      const result = await resendOtp(data);
      if (result.success) {
        Alert.alert("Success", "Verification code sent! Please check your email.");
        router.push({
          pathname: "/auth/verify-otp",
          params: { email: data.email }
        });
      } else {
        Alert.alert("Failed", result.error || "Please try again");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      Alert.alert("Error", error.message || "An unexpected error occurred");
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
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we’ll send you a verification code.
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
              autoCapitalize="none"
              keyboardType="email-address"
            />
          )}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email.message}</Text>
        )}

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
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
  },
  subtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    marginBottom: 12,
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
  buttonDisabled: { opacity: 0.7 },
});
