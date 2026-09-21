import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoCollage } from "@/src/components/ui";
import { COLLAGE_IMAGES } from "@/src/features/auth/collage";
import { palette } from "@/src/styles/theme";

/**
 * Shared ground for every auth screen: the drifting collage behind a scrim
 * heavy enough to keep form labels and inputs readable.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = palette.dark;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <PhotoCollage images={COLLAGE_IMAGES} />
      <LinearGradient
        colors={["rgba(7,18,25,0.82)", "rgba(7,18,25,0.96)", "rgba(7,18,25,0.99)"]}
        locations={[0, 0.3, 0.6]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={{ flex: 1, paddingTop: insets.top }}>{children}</View>
    </View>
  );
}
