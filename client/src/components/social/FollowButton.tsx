import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";

import { PressableScale, Text } from "@/src/components/ui";
import { useSession } from "@/src/services/SessionContext";
import {
  fetchFollowStats,
  followUser,
  unfollowUser,
  type FollowStats,
} from "@/src/services/userServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * Follow / Following, with the state fetched per person.
 *
 * `initialStats` lets a list that already knows the answer skip the request —
 * the followers and following endpoints return `is_following` on every row, so
 * those screens should pass it rather than firing one call per visible row.
 */
export function FollowButton({
  userId,
  compact = false,
  initialFollowing,
  onChange,
}: {
  userId: string;
  compact?: boolean;
  initialFollowing?: boolean;
  onChange?: (stats: FollowStats) => void;
}) {
  const { colors } = useTheme();
  const { user, profile } = useSession();

  const [following, setFollowing] = useState(initialFollowing ?? false);
  const [known, setKnown] = useState(initialFollowing !== undefined);
  const [busy, setBusy] = useState(false);

  const ownId = profile?.id ?? user?.id;
  const isSelf = ownId === userId;

  useEffect(() => {
    if (isSelf || initialFollowing !== undefined) return;

    let active = true;
    fetchFollowStats(userId).then((result) => {
      if (!active || !result.success) return;
      setFollowing(result.data.is_following);
      setKnown(true);
    });
    return () => {
      active = false;
    };
  }, [userId, isSelf, initialFollowing]);

  // You cannot follow yourself, and a disabled button explaining that is worse
  // than no button.
  if (isSelf) return null;

  const toggle = async () => {
    if (busy) return;
    const next = !following;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFollowing(next);
    setBusy(true);

    const result = await (next ? followUser(userId) : unfollowUser(userId));
    setBusy(false);

    if (!result.success) {
      setFollowing(!next);
      return;
    }
    setKnown(true);
    onChange?.(result.data);
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: following, busy }}
      accessibilityLabel={following ? "Following. Tap to unfollow" : "Follow"}
      onPress={toggle}
      style={{
        minHeight: compact ? 36 : 44,
        paddingHorizontal: compact ? spacing.md : spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.full,
        // Muted until the real state is known, so it does not flash "Follow"
        // at someone the viewer already follows.
        opacity: known ? (busy ? 0.6 : 1) : 0.45,
        backgroundColor: following ? "transparent" : culture.lime,
        borderWidth: following ? 1 : 0,
        borderColor: colors.borderStrong,
      }}
    >
      <Text
        variant={compact ? "caption" : "label"}
        style={following ? undefined : { color: culture.ink }}
        color={following ? "textSecondary" : undefined}
      >
        {following ? "Following" : "Follow"}
      </Text>
    </PressableScale>
  );
}
