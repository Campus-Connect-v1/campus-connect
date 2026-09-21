import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

import {
  Icon,
  GraphicOverlay,
  Media,
  PressableScale,
  Screen,
  SectionHeader,
  Sticker,
  Text,
} from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchBuildings } from "@/src/services/campusServices";
import { fetchEvents } from "@/src/services/eventServices";
import { useSession } from "@/src/services/SessionContext";
import { fetchStudyGroups } from "@/src/services/studyGroupServices";
import { fetchUniversityById } from "@/src/services/universityServices";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function CampusScreen() {
  const { colors } = useTheme();
  const { user, profile } = useSession();
  const universityId = profile?.university_id ?? user?.university_id;

  const [campus, setCampus] = useState<{ name: string; location: string } | null>(null);
  useEffect(() => {
    if (!universityId) return;
    fetchUniversityById(universityId).then((uni) =>
      setCampus(uni ? { name: uni.label, location: uni.location } : null)
    );
  }, [universityId]);

  const events = useAsync(
    useCallback(
      () => fetchEvents(universityId ? { university_id: universityId } : undefined),
      [universityId]
    ),
    [universityId]
  );
  const groups = useAsync(
    useCallback(
      () => fetchStudyGroups(universityId ? { university_id: universityId } : undefined),
      [universityId]
    ),
    [universityId]
  );
  const buildings = useAsync(
    useCallback(
      () =>
        universityId
          ? fetchBuildings(universityId)
          : Promise.resolve({ success: true as const, data: [] }),
      [universityId]
    ),
    [universityId]
  );

  // Only counts the app can actually source. "Students active now" was here
  // before and is gone: no endpoint reports it, and a made-up number on a
  // dashboard is worse than one fewer row.
  const weekAhead = (events.data ?? []).filter((event) => {
    const start = new Date(event.start_time).getTime();
    return start > Date.now() && start < Date.now() + 7 * 86400_000;
  }).length;

  const pulse: [string, string][] = [
    [String(weekAhead), "events this week"],
    [String((groups.data ?? []).length), "study groups running"],
    [String((buildings.data ?? []).length), "buildings mapped"],
  ];

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
          <Text variant="title">Campus</Text>
        </View>

        <Media
          source="https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=1200&q=75&auto=format&fit=crop"
          scrim="full"
          rounded="lg"
          style={{ height: 360, marginHorizontal: spacing.lg }}
        >
          <View style={{ flex: 1, justifyContent: "space-between", padding: spacing.lg }}>
            {campus ? <Sticker label={campus.name} backgroundColor={culture.lime} /> : <View />}
            <View style={{ gap: spacing.xs }}>
              <Text variant="poster" onMedia>
                YOUR CAMPUS,{"\n"}IN YOUR POCKET.
              </Text>
              <Text variant="body" onMedia>
                {campus ? [campus.name, campus.location].filter(Boolean).join(" · ") : " "}
              </Text>
            </View>
          </View>
        </Media>

        <View style={{ padding: spacing.lg, gap: spacing.xl }}>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Open campus map"
              onPress={() => router.push("/(tabs)/connect")}
              style={{
                flex: 1,
                minHeight: 104,
                borderRadius: radius.md,
                overflow: "hidden",
                backgroundColor: culture.pink,
                padding: spacing.md,
                justifyContent: "space-between",
              }}
            >
              <GraphicOverlay color={culture.ink} pattern="rays" opacity={0.1} />
              <Icon name="map" size={23} color={culture.ink} />
              <Text variant="heading" style={{ color: culture.ink }}>
                Campus map
              </Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Open campus events"
              onPress={() => router.push("/(tabs)/events")}
              style={{
                flex: 1,
                minHeight: 104,
                borderRadius: radius.md,
                overflow: "hidden",
                backgroundColor: culture.yellow,
                padding: spacing.md,
                justifyContent: "space-between",
              }}
            >
              <GraphicOverlay color={culture.ink} pattern="dots" opacity={0.12} />
              <Icon name="events" size={23} color={culture.ink} />
              <Text variant="heading" style={{ color: culture.ink }}>
                What&apos;s on
              </Text>
            </PressableScale>
          </View>

          <SectionHeader eyebrow="TODAY ON CAMPUS" title="Campus pulse" />
          <View
            style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
          >
            {pulse.map(([value, label], index) => (
              <View
                key={label}
                style={{
                  minHeight: 72,
                  paddingHorizontal: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  borderTopWidth: index ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <Text variant="title" style={{ width: 92 }}>
                  {value}
                </Text>
                <Text variant="body" color="textSecondary">
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <SectionHeader eyebrow="QUICK LINKS" title="Student essentials" />
          <View style={{ gap: spacing.sm }}>
            {[
              { label: "Explore campus", route: "/(tabs)/explore" as const },
              { label: "Find a room or facility", route: "/facilities" as const },
              { label: "Academic calendar", route: undefined },
              { label: "Student opportunities", route: undefined },
              { label: "Campus services", route: undefined },
              { label: "Emergency contacts", route: undefined },
            ].map(({ label, route }) => (
              <PressableScale
                key={label}
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={route ? () => router.push(route) : undefined}
                style={{
                  minHeight: 54,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text variant="body" style={{ flex: 1 }}>
                  {label}
                </Text>
                <Icon name="forward" size={17} color={colors.textMuted} />
              </PressableScale>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
