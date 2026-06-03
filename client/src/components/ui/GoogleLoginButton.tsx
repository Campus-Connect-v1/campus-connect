import { env } from "@/src/config/env";
import { useAuthStore } from "@/src/store/authStore";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button } from "react-native";

export default function GoogleLoginButton() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [submitting, setSubmitting] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: env.googleWebClientId,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    // The server verifies a Google **ID token**, not the access token.
    const idToken = response.authentication?.idToken;
    if (!idToken) {
      Alert.alert("Google Sign-In", "No ID token returned. Check your client config.");
      return;
    }
    setSubmitting(true);
    loginWithGoogle(idToken)
      .then((res) => {
        if (res.success) {
          router.replace("/(tabs)/home");
        } else {
          Alert.alert("Google Sign-In Failed", res.error.message || "Please try again");
        }
      })
      .finally(() => setSubmitting(false));
  }, [response, loginWithGoogle, router]);

  return (
    <Button
      title="Sign in with Google"
      onPress={() => promptAsync()}
      disabled={!request || submitting}
    />
  );
}
