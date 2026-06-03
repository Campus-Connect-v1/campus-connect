import Colors from "@/src/constants/Colors";
import { Font, displayTracking } from "@/src/theme/typography";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  /** Optional element rendered on the right (e.g. an action icon). */
  right?: ReactNode;
  /** Hide the back button (e.g. for root-ish screens). */
  hideBack?: boolean;
  /** Variant for placing over a dark hero — light back chevron, no border. */
  transparentOnDark?: boolean;
}

/**
 * Custom navigation header for the Collegiate Editorial system — replaces
 * native stack headers everywhere. Cream field, hairline rule, Bebas title.
 */
export default function ScreenHeader({
  title,
  right,
  hideBack,
  transparentOnDark,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tint = transparentOnDark ? "#FBF5E9" : Colors.light.primary;

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 8 },
        transparentOnDark ? styles.transparent : styles.solid,
      ]}
    >
      <View style={styles.side}>
        {!hideBack && (
          <Pressable hitSlop={10} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={tint} />
          </Pressable>
        )}
      </View>
      <Text
        style={[styles.title, transparentOnDark && styles.titleOnDark]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    paddingHorizontal: 12,
  },
  solid: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  transparent: { backgroundColor: "transparent" },
  side: { width: 44, justifyContent: "center" },
  sideRight: { alignItems: "flex-end" },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: Font.display,
    fontSize: 22,
    letterSpacing: displayTracking,
    color: Colors.light.text,
  },
  titleOnDark: { color: "#FBF5E9" },
});
