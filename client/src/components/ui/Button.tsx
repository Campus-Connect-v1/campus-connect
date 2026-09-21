import * as Haptics from "expo-haptics";
import { ActivityIndicator, View, type ViewStyle } from "react-native";

import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { PressableScale } from "./PressableScale";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  /** Renders to the left of the label. Keep it to a single icon. */
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

/**
 * Buttons are always pills (radius.full) — that is the shape lock, not a
 * per-screen choice. `primary` is the one loud element a screen is allowed.
 *
 * A light impact fires on press, which is a meaningful confirmation. It does
 * NOT fire for plain navigation; those use a bare PressableScale instead.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const surface: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    secondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.borderStrong },
    ghost: { backgroundColor: "transparent" },
  };

  const labelColor = variant === "primary" ? "accentFg" : "textPrimary";

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[
        {
          height: 56,
          borderRadius: radius.full,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.xl,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: inactive ? 0.5 : 1,
        },
        surface[variant],
        style ?? {},
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.accentFg : colors.textPrimary} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text variant="label" color={labelColor}>
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}
