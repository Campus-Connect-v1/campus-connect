import LottieView from "lottie-react-native";
import { ActivityIndicator, View, useWindowDimensions } from "react-native";

import { spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { Button } from "./Button";
import { Text } from "./Text";

export interface EmptyStateProps {
  title: string;
  /** One line explaining what to do about it, not a restatement of the title. */
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Swaps the animation for an alert glyph and shows the action as a retry. */
  tone?: "empty" | "error";
  compact?: boolean;
}

/**
 * The one empty/error state in the app.
 *
 * Every list screen owes the user four states and they kept being written
 * inline, slightly differently, per screen. `EmptyState` is the empty and error
 * ones; `EmptyState.Loading` is the third. The loaded state is the screen's job.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  tone = "empty",
  compact = false,
}: EmptyStateProps) {
  const { width } = useWindowDimensions();
  const size = compact ? Math.min(160, width * 0.4) : Math.min(230, width * 0.58);

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: spacing["2xl"],
        paddingVertical: compact ? spacing.lg : spacing["2xl"],
        gap: spacing.sm,
      }}
    >
      {/* The animation carries both tones. An error here is almost always
          "nothing came back", and a hazard glyph overstates that. The copy
          below is what distinguishes the two. */}
      <LottieView
        source={require("@/assets/animations/empty.json")}
        autoPlay
        loop
        // The composition is square (1000x1000) and mostly padding, so it is
        // sized generously and allowed to bleed rather than boxed tight.
        style={{ width: size, height: size }}
      />

      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>

      {body ? (
        <Text variant="body" color="textSecondary" style={{ textAlign: "center" }}>
          {body}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <View style={{ paddingTop: spacing.xs }}>
          <Button label={actionLabel} fullWidth={false} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

EmptyState.Loading = function EmptyStateLoading({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: compact ? spacing.xl : spacing["3xl"], alignItems: "center" }}>
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
};
