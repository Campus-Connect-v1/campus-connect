"use client"

import { Ionicons } from "@expo/vector-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import Colors from "@/src/constants/Colors"
import { signupSchema, type SignupSchema } from "@/src/schemas/authSchemas"
import { signUpWithEmail } from "@/src/services/authServices"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"
import { Image } from "expo-image";
import DropdownAlert from "@/src/components/ui/DropdownAlert"

interface RegisterScreenProps {
  onRegisterSuccess?: (message: string) => void
  onNavigateToHome?: () => void
}

export default function RegisterScreen(props: RegisterScreenProps = {}) {
  const { onRegisterSuccess, onNavigateToHome } = props;
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isGoogleLoading] = useState(false)
  const router = useRouter()
  const { alert, hideAlert, success, error } = useDropdownAlert()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      university_id: "",
    },
  })

  const onSubmit = async (data: SignupSchema) => {
    const payload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password,
      university_id: data.university_id || "uni_1",
    };
  
    setIsLoading(true);
  
    try {
      const result = await signUpWithEmail(payload);
  
      if (!result) {
        throw new Error("No response from server");
      }
  
      if (result.success) {
        // Call success callback if provided
        if (onRegisterSuccess) {
          onRegisterSuccess(result.data?.message || "Registration successful! Please check your email to verify your account.");
        }
        setTimeout(() => {
            success("uniCLIQ","Registration Successful! Please verify your email.", 4000);
          router.push({
            pathname: "/auth/verify-otp",
            params: { email: data.email }
          });
        }, 4000);
      } else {
        error("uniCLIQ","Registration Failed", 4000)
      }
    } catch (error: any) {
      error("Error", error.message || "An unexpected error occurred", 4000)
    } finally {
      setIsLoading(false);
    }
  };
  

  // const handleGoogleSignIn = async () => {
  //   setIsGoogleLoading(true)
  //   try {
  //     const result = await signInWithGoogle("jkd")
  //     if (result.success) {
  //       onLoginSuccess()
  //     } else {
  //       Alert.alert("Google Sign-In Failed", result.error || "Please try again")
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Google Sign-In failed")
  //   } finally {
  //     setIsGoogleLoading(false)
  //   }
  // }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
<DropdownAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onDismiss={hideAlert}
      />


        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 240, height: 180, resizeMode: "contain", marginBottom: 0 }}
        />
          <Text style={styles.welcomeSubtitle}>Sign up to uniCLIQ</Text>
        </View>

        {/* Register Form */}
        <View style={styles.formContainer}>
          {/* First Name Input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="first_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.first_name && styles.inputError]}
                  placeholder="First Name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.first_name && <Text style={styles.errorText}>{errors.first_name.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="last_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.last_name && styles.inputError]}
                  placeholder="Last Name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.last_name && <Text style={styles.errorText}>{errors.last_name.message}</Text>}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Email"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Password"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                    placeholder="Confirm Password"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>Sign Up</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
            // onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={Colors.light.primary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={24} color={Colors.light.primary} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => onNavigateToHome ? onNavigateToHome() : router.push("/auth/login")}>
              <Text style={styles.signupLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
    fontFamily: "Chillis",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontFamily: "Gilroy-Medium",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    fontFamily: "Gilroy-Medium",
  },
  inputError: {
    borderColor: Colors.light.error,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: Colors.light.inputBackground,
    fontFamily: "Gilroy-Medium",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    marginTop: 4,
    fontFamily: "Gilroy-Medium",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontFamily: "Gilroy-Medium",
  },
  loginButton: {
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 12,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Gilroy-SemiBold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontFamily: "Gilroy-Medium",
  },
  googleButton: {
    height: 56,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    marginBottom: 32,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    fontFamily: "Gilroy-SemiBold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontFamily: "Gilroy-Medium",
  },
  signupLink: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "Gilroy-SemiBold",
  },
})
