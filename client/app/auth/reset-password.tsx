
import Colors from "@/src/constants/Colors";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { resetPassword } from "@/src/services/authServices";
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert";
import DropdownAlert from "@/src/components/ui/DropdownAlert";

const resetSchema = z
  .object({
    token: z.string().min(1, "Token/OTP is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetSchema = z.infer<typeof resetSchema>;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { alert, hideAlert, success, error } = useDropdownAlert();

  const { control, handleSubmit, formState: { errors } } = useForm<ResetSchema>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: (params.token as string) || "",
    },
  });

  const onSubmit = async (data: ResetSchema) => {
    setIsLoading(true);
    try {
      // confirmPassword is only for client-side validation, not sent to API
      const result = await resetPassword({ 
        password: data.password,
        token: data.token,
        confirmPassword: data.confirmPassword,
      });
      if (result.success) {
        success("Success", "Password reset successful", 3000);
        setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      } else {
        const errMsg =
          typeof result.error === "string"
            ? result.error
            : result.error?.message || "Failed to reset password";
        error("Failed", errMsg, 3000);
      }
    } catch (err) {
      error("Error", "An unexpected error occurred", 3000);
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the OTP/token sent to your email and create a new password.
          </Text>

          <Controller
            control={control}
            name="token"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.token && styles.inputError]}
                placeholder="OTP/Token"
                placeholderTextColor={Colors.light.textSecondary}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                autoCapitalize="none"
              />
            )}
          />
          {errors.token && (
            <Text style={styles.errorText}>{errors.token.message}</Text>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="New Password"
                  placeholderTextColor={Colors.light.textSecondary}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.light.textSecondary}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry={!showPassword}
              />
            )}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
          )}

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 24 },
  inner: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", color: Colors.light.text, marginBottom: 8, fontFamily: "Gilroy-SemiBold" },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginBottom: 32, fontFamily: "Gilroy-Regular" },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    marginBottom: 12,
    fontFamily: "Gilroy-Medium",
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 17,
  },
  inputError: { borderColor: Colors.light.error },
  errorText: { color: Colors.light.error, marginBottom: 12, fontFamily: "Gilroy-Regular" },
  button: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold", fontFamily: "Gilroy-SemiBold" },
});
