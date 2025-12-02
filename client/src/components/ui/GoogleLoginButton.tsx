/**
 * GoogleLoginButton Component
 * 
 * A button for signing in with Google OAuth.
 * Uses Expo's auth-session for Google authentication.
 */

import { signInWithGoogle } from "@/src/services/authServices";
import { useToast } from "@/src/components/ui/Toast";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { Button } from "react-native";

export default function GoogleLoginButton() {
  const { showToast } = useToast();
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        signInWithGoogle(authentication.accessToken).then((res) => {
          if (res.success) {
            showToast("success", "Google login verified 🎉", "Success");
          } else {
            showToast("error", res.error || "Google login failed", "Error");
          }
        });
      }
    }
  }, [response, showToast]);

  return (
    <Button
      title="Sign in with Google"
      onPress={() => promptAsync()}
      disabled={!request}
    />
  );
}
