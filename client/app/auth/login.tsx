"use client"

import Colors from "@/src/constants/Colors"
import { loginSchema, type LoginSchema } from "@/src/schemas/authSchemas"
import { signInWithEmail } from "@/src/services/authServices"
import { storage } from "@/src/utils/storage"
import { Ionicons } from "@expo/vector-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "expo-router"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import DropdownAlert from "@/src/components/ui/DropdownAlert"
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"

interface LoginScreenProps {
  onLoginSuccess?: (token: string, user: any) => void
  onNavigateToSignup?: () => void
}

export default function LoginScreen(props: LoginScreenProps = {}) {
  const { onLoginSuccess, onNavigateToSignup } = props;
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading] = useState(false)
  // const scrollX = React.useRef(new Animated.Value(0)).current
  const { alert, hideAlert, success, error } = useDropdownAlert()
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // const onSubmit = async (data: LoginSchema) => {
  //   router.push('/(tabs)/home');
  // }
  const onSubmit = async (data: LoginSchema) => {
    setIsLoading(true)
    try {
      console.log("Attempting login with:", { email: data.email })
      const result = await signInWithEmail(data)
      console.log("Login result:", result)
      
      if (result.success) {
        try {
          // Store token and user data
          console.log("Storing token and user data...")
          await storage.setToken(result.data.token)
          await storage.setUserData(result.data.user)
          console.log("Token and user data stored successfully")
          
          // Call success callback with token and user data (if provided)
          if (onLoginSuccess) {
            onLoginSuccess(result.data.token, result.data.user)
          }
          
          success("uniCLIQ", "Login successful!", 4000)
          setTimeout(() => {
            router.push("/(tabs)/home")
          }, 2000)
        } catch (storageError) {
          console.error("Storage error:", storageError)
          error("uniCLIQ", "Failed to save login", 4000)
        }
      } else {
        console.log("Login failed:", result.error)
        const errorMessage = result.error?.message || result.error || "Please try again"
        
        // Special handling for email verification
        if (result.error?.message === "Email not verified") {
          Alert.alert(
            "Email Not Verified", 
            "Please verify your email address before logging in.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Verify Email", 
                onPress: () => router.push("/auth/verify-email") 
              }
            ]
          )
        } else {
          error("uniCLIQ", "Login Failed", 4000)
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      error("uniCLIQ", "Login Failed", 4000)
    } finally {
      setIsLoading(false)
    }
  }

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
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to continue to uniCLIQ</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
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

          {/* Forgot Password */}
          <TouchableOpacity onPress={()=> {router.push("/auth/forgot-password")}} style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
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
            <Text style={styles.signupText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => onNavigateToSignup ? onNavigateToSignup() : router.push("/auth/register")}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingTop: 60,
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
    marginBottom: 8,
    fontFamily: "Gilroy-SemiBold",
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
