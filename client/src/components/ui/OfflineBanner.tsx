import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

import { useIsOnline } from "@/src/services/NetworkContext";
import { culture, spacing } from "@/src/styles/theme";

import { Icon } from "./Icon";
import { Text } from "./Text";

/**
 * A strip that appears under the header while the device is offline.
 *
 * It is not dismissible and carries no retry button: the condition resolves
 * itself, and a retry that cannot succeed is worse than no control at all.
 * Screens keep showing whatever they last loaded underneath it.
 */
export function OfflineBanner() {
  const online = useIsOnline();
  if (online) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(140)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.lg,
        backgroundColor: culture.yellow,
      }}
    >
      <Icon name="alert" size={15} color={culture.ink} />
      <Text variant="caption" style={{ color: culture.ink }}>
        No connection. Showing what was last loaded.
      </Text>
    </Animated.View>
  );
}
