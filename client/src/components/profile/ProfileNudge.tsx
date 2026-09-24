import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { nudgeBackoffMs, profileCompleteness, profileGaps } from "@/src/features/profile/setup";
import { useSession } from "@/src/services/SessionContext";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const STORAGE_KEY = "cc.profileNudge";

interface NudgeState {
  /** When the nudge may next be shown. */
  snoozedUntil: number;
  /** Dismissals so far, which lengthens each subsequent backoff. */
  dismissCount: number;
}

/**
 * A quiet prompt to finish a profile.
 *
 * Setup is skippable, and skipping it was silent and permanent: nothing ever
 * mentioned it again, so an account could sit forever with no interests and
 * therefore no useful recommendations, with nothing explaining why the app
 * felt empty.
 *
 * It says what is missing and what finishing it buys, rather than nagging
 * about a percentage. Dismissing backs off for progressively longer, and the
 * whole thing disappears for good once the profile is complete.
 */
export function ProfileNudge() {
  const { colors } = useTheme();
  const { profile } = useSession();
  const [state, setState] = useState<NudgeState | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        setState(stored ? (JSON.parse(stored) as NudgeState) : { snoozedUntil: 0, dismissCount: 0 });
      })
      // A failed read must not hide the prompt forever; showing it once too
      // often is the cheaper mistake.
      .catch(() => setState({ snoozedUntil: 0, dismissCount: 0 }));
  }, []);

  const dismiss = useCallback(() => {
    setState((current) => {
      const next: NudgeState = {
        dismissCount: (current?.dismissCount ?? 0) + 1,
        snoozedUntil: Date.now() + nudgeBackoffMs(current?.dismissCount ?? 0),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const gaps = profileGaps(profile);
  const completeness = profileCompleteness(profile);

  // Not loaded yet, nothing missing, or still snoozed.
  if (!state || gaps.length === 0) return null;
  if (Date.now() < state.snoozedUntil) return null;

  const next = gaps[0];

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: spacing.lg,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="label">Finish your profile</Text>
            <Text variant="caption" color="textMuted">
              {completeness}% done · {next.label.toLowerCase()} to get better matches
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Not now"
            onPress={dismiss}
            hitSlop={10}
            style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={16} color={colors.textMuted} />
          </PressableScale>
        </View>

        {/* The bar is the only place a number appears; the copy above says
            what to DO, which is the part that moves it. */}
        <View
          style={{
            height: 6,
            borderRadius: radius.full,
            backgroundColor: colors.surfaceSunken,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${completeness}%`,
              height: "100%",
              borderRadius: radius.full,
              backgroundColor: culture.lime,
            }}
          />
        </View>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={next.label}
          onPress={() => router.push(next.route as never)}
          style={{
            marginTop: spacing["2xs"],
            minHeight: 40,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accent,
          }}
        >
          <Text variant="label" style={{ color: colors.accentFg }}>
            {next.label}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}
