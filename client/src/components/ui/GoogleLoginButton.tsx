import * as Google from "expo-auth-session/providers/google";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import { GOOGLE_CLIENT_IDS } from "@/src/constants/env";
import { signInWithGoogle } from "@/src/services/authServices";
import { useTheme } from "@/src/styles/useTheme";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";

interface Props {
  onSuccess?: () => void;
}

/**
 * `Google.useAuthRequest` THROWS if the client id for the current platform is
 * missing, so it cannot be called before the config is known to be present.
 * Being a hook, it also cannot be called conditionally — hence the split: this
 * component decides whether the config exists, and only then mounts the child
 * that owns the hook.
 *
 * Fill the EXPO_PUBLIC_GOOGLE_* values in .env to enable it.
 */
function requiredClientId() {
  if (Platform.OS === "ios") return GOOGLE_CLIENT_IDS.ios;
  if (Platform.OS === "android") return GOOGLE_CLIENT_IDS.android;
  return GOOGLE_CLIENT_IDS.web;
}

/**
 * Exported so callers can drop surrounding chrome — an "or" divider above a
 * button that renders nothing looks broken.
 */
export function isGoogleAuthConfigured() {
  return Boolean(requiredClientId());
}

function GoogleAuthButton({ onSuccess }: Props) {
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_IDS.expo,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    webClientId: GOOGLE_CLIENT_IDS.web,
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const accessToken = response.authentication?.accessToken;
    if (!accessToken) return;

    setBusy(true);
    signInWithGoogle(accessToken).then((result) => {
      setBusy(false);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error);
    });
  }, [response, onSuccess]);

  return (
    <>
      <Button
        label="Continue with Google"
        variant="secondary"
        loading={busy}
        disabled={!request}
        icon={<Icon name="google" size={18} color={colors.textPrimary} />}
        onPress={() => {
          setError(null);
          promptAsync();
        }}
      />
      {error ? (
        <Text variant="caption" color="destructive" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </>
  );
}

export default function GoogleLoginButton({ onSuccess }: Props) {
  // Rendering nothing beats rendering a button that cannot work. A disabled
  // control with no explanation reads as a bug to the user.
  if (!requiredClientId()) return null;
  return <GoogleAuthButton onSuccess={onSuccess} />;
}
