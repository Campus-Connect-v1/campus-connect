import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  fetchPoll,
  retractVote,
  votePoll,
  type ApiPoll,
  type ApiPollOption,
} from "@/src/services/pollServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

function closesIn(iso: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const hours = Math.round(ms / 3600_000);
  if (hours < 1) return `${Math.round(ms / 60000)}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.round(hours / 24)}d left`;
}

/** A bar whose width animates to the option's share of the vote. */
function OptionRow({
  option,
  total,
  selected,
  revealed,
  disabled,
  onPress,
}: {
  option: ApiPollOption;
  total: number;
  selected: boolean;
  revealed: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const share = total > 0 ? option.vote_count / total : 0;
  const width = useSharedValue(0);

  // In an effect, never during render: writing a shared value while rendering
  // is a Reanimated hard fail and tears the UI-thread copy.
  useEffect(() => {
    width.value = revealed ? withTiming(share, { duration: 420 }) : 0;
  }, [revealed, share, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <PressableScale
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={
        revealed
          ? `${option.option_text}, ${Math.round(share * 100)} percent, ${option.vote_count} votes`
          : option.option_text
      }
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 48,
        borderRadius: radius.sm,
        overflow: "hidden",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: selected ? culture.violet : colors.border,
        backgroundColor: colors.surfaceSunken,
      }}
    >
      {revealed ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              backgroundColor: selected ? culture.violet : colors.border,
              opacity: selected ? 0.32 : 0.55,
            },
            fill,
          ]}
        />
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
        }}
      >
        {selected ? <Icon name="check" size={15} color={culture.violet} /> : null}
        <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>
          {option.option_text}
        </Text>
        {revealed ? (
          <Text variant="label" color="textSecondary">
            {Math.round(share * 100)}%
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

/**
 * A poll, fetched by the id the feed carries on a poll post.
 *
 * Results stay hidden until you have voted or the poll has closed, so early
 * votes do not anchor later ones.
 */
export function PollCard({ pollId }: { pollId: string }) {
  const { colors } = useTheme();
  const [local, setLocal] = useState<ApiPoll | null>(null);
  const [busy, setBusy] = useState(false);

  const remote = useAsync(
    useCallback(() => fetchPoll(pollId), [pollId]),
    [pollId]
  );

  const poll = local ?? remote.data;

  if (remote.loading && !poll) {
    return (
      <View
        style={{
          height: 140,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSunken,
        }}
      />
    );
  }

  if (!poll) return null;

  const closed =
    Boolean(poll.is_closed) || (poll.closes_at ? new Date(poll.closes_at) <= new Date() : false);
  const voted = poll.user_actions.has_voted;
  const revealed = voted || closed;
  const multi = poll.max_selections > 1;

  const choose = async (optionId: string) => {
    if (closed || busy) return;
    if (voted && !poll.allow_change) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);

    const selected = poll.user_actions.selected_option_ids;
    let next: string[];

    if (multi) {
      next = selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId].slice(0, poll.max_selections);
    } else {
      next = [optionId];
    }

    // Clearing every selection is a retraction, not a vote for nothing.
    const result =
      next.length === 0 ? await retractVote(poll.poll_id) : await votePoll(poll.poll_id, next);

    if (result.success) {
      const refreshed = await fetchPoll(poll.poll_id);
      if (refreshed.success) setLocal(refreshed.data);
    }
    setBusy(false);
  };

  const remaining = closesIn(poll.closes_at);

  return (
    <View style={{ gap: spacing.xs }}>
      {poll.options.map((option) => (
        <OptionRow
          key={option.option_id}
          option={option}
          total={poll.total_voters}
          selected={poll.user_actions.selected_option_ids.includes(option.option_id)}
          revealed={revealed}
          disabled={closed || busy || (voted && !poll.allow_change)}
          onPress={() => choose(option.option_id)}
        />
      ))}

      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Text variant="caption" color="textMuted">
          {poll.total_voters} {poll.total_voters === 1 ? "vote" : "votes"}
        </Text>
        {multi && !revealed ? (
          <Text variant="caption" color="textMuted">
            · pick up to {poll.max_selections}
          </Text>
        ) : null}
        {remaining ? (
          <Text variant="caption" color="textMuted">
            · {remaining}
          </Text>
        ) : null}
        {voted && poll.allow_change && !closed ? (
          <Text variant="caption" color="textMuted">
            · tap to change
          </Text>
        ) : null}
      </View>
    </View>
  );
}
