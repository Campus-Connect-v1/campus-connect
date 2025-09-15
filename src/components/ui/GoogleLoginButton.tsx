import { signInWithGoogle } from "@/src/services/authServices";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";
import { Alert, Button } from "react-native";

export default function GoogleLoginButton() {
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
            Alert.alert("Success", "Google login verified 🎉");
          } else {
            Alert.alert("Error", res.error || "Google login failed");
          }
        });
      }
    }
  }, [response]);

  return (
    <Button
      title="Sign in with Google"
      onPress={() => promptAsync()}
      disabled={!request}
    />
  );
}
