import { StatusBar } from "expo-status-bar";
import { View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/styles/useTheme";

export interface ScreenProps {
  children: React.ReactNode;
  /**
   * `top: false` skips the top inset when the screen opens with full-bleed
   * media. `bottom: true` pads above the home indicator — correct for screens
   * whose content ends at the bottom edge (settings, forms), and wrong for the
   * tab screens, whose lists deliberately scroll UNDER the floating tab bar
   * and handle the clearance in their own `contentContainerStyle`.
   */
  edges?: { top?: boolean; bottom?: boolean };
  style?: ViewStyle;
}

export function Screen({ children, edges, style }: ScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: edges?.top === false ? 0 : insets.top,
          paddingBottom: edges?.bottom === true ? insets.bottom : 0,
        },
        style,
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </View>
  );
}
