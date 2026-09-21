import { View } from "react-native";

import { spacing } from "@/src/styles/theme";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";
import { Text } from "./Text";
import { useTheme } from "@/src/styles/useTheme";

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, eyebrow, actionLabel, onAction }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.md }}>
      <View style={{ flex: 1, gap: spacing["2xs"] }}>
        {eyebrow ? (
          <Text variant="micro" color="textMuted">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant="heading">{title}</Text>
      </View>
      {actionLabel ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}
        >
          <Text variant="label" color="textSecondary">
            {actionLabel}
          </Text>
          <Icon name="forward" size={15} color={colors.textSecondary} />
        </PressableScale>
      ) : null}
    </View>
  );
}
