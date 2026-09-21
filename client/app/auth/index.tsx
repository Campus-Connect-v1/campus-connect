import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, PhotoCollage, PressableScale, Text } from "@/src/components/ui";
import GoogleLoginButton from "@/src/components/ui/GoogleLoginButton";
import { COLLAGE_IMAGES } from "@/src/features/auth/collage";
import { useSession } from "@/src/services/SessionContext";
import { palette, spacing } from "@/src/styles/theme";

/**
 * The front door. A drifting wall of campus photography behind a heavy scrim,
 * the wordmark, one claim, and the choices stacked as pills.
 *
 * Pinned to the dark palette regardless of system scheme: the collage only
 * holds up on a dark ground, and a sign-in wall that flips to white would lose
 * the photography entirely.
 */
export default function AuthLanding() {
  const router = useRouter();
  const { refresh } = useSession();
  const insets = useSafeAreaInsets();
  const colors = palette.dark;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />

      <PhotoCollage images={COLLAGE_IMAGES} />

      {/* Heavy scrim. Without it the headline is at the mercy of whichever
          photo happens to drift behind it. */}
      <LinearGradient
        colors={["rgba(7,18,25,0.55)", "rgba(7,18,25,0.88)", "rgba(7,18,25,0.99)"]}
        locations={[0, 0.42, 0.68]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.sm,
        }}
      >
        <Animated.View entering={FadeInDown.delay(180).springify().damping(20)}>
          <Text variant="wordmark" onMedia style={{ textAlign: "center" }}>
            Your whole campus.{"\n"}One app.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).springify().damping(20)}
          style={{ gap: spacing.sm, marginTop: spacing.lg }}
        >
          <Button label="Create account" onPress={() => router.push("/auth/register")} />

          <GoogleLoginButton
            onSuccess={async () => {
              await refresh();
              router.replace("/(tabs)/home");
            }}
          />

          <PressableScale
            accessibilityRole="button"
            onPress={() => router.push("/auth/login")}
            style={{
              alignSelf: "center",
              minHeight: 48,
              justifyContent: "center",
              paddingHorizontal: spacing.xl,
            }}
          >
            <Text variant="label" onMedia>
              Log in
            </Text>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}
