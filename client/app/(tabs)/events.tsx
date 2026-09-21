import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, SectionList, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  EmptyState,
  EventSkeleton,
  GraphicOverlay,
  Media,
  OfflineBanner,
  PressableScale,
  Screen,
  SkeletonList,
  Tag,
  Text,
  Icon,
} from "@/src/components/ui";
import { BuildingSheet } from "@/src/components/campus/BuildingSheet";
import { CampusMap } from "@/src/components/campus/CampusMap";
import { adaptBuilding } from "@/src/features/campus/adapt";
import { type CampusPin } from "@/src/features/campus/types";
import { adaptEvent } from "@/src/features/events/adapt";
import { adaptStudyGroup } from "@/src/features/events/adaptGroup";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchBuildings } from "@/src/services/campusServices";
import { fetchEvents, rsvpToEvent } from "@/src/services/eventServices";
import { useSession } from "@/src/services/SessionContext";
import {
  fetchMyStudyGroups,
  fetchStudyGroups,
  joinStudyGroup,
  leaveStudyGroup,
} from "@/src/services/studyGroupServices";
import { type CampusEvent, type CampusGroup } from "@/src/features/events/types";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, foregroundOn, SECTION_HUE, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

function EventCard({ event, onToggle }: { event: CampusEvent; onToggle: (id: string) => void }) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${event.starts_at} at ${event.location}`}
      onPress={() => router.push({ pathname: "/event/[id]", params: { id: event.event_id } })}
      style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
    >
      <Media
        source={event.image}
        scrim
        rounded="md"
        style={{ height: 190 }}
        accessibilityIgnoresInvertColors
      >
        <View style={{ flex: 1, justifyContent: "space-between", padding: spacing.md }}>
          <View style={{ flexDirection: "row" }}>
            <Tag label={`${event.starts_at} · ${event.location}`} onMedia />
          </View>

          <View style={{ gap: spacing["2xs"] }}>
            <Text variant="heading" onMedia numberOfLines={2}>
              {event.title}
            </Text>
            <Text variant="caption" onMedia style={{ opacity: 0.85 }}>
              {event.host} · {event.attendees.toLocaleString()} going
            </Text>
          </View>
        </View>
      </Media>

      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ selected: event.going }}
        accessibilityLabel={
          event.going ? `Cancel RSVP to ${event.title}` : `RSVP to ${event.title}`
        }
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(event.event_id);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing["2xs"],
          marginTop: spacing.sm,
          minHeight: 44,
          borderRadius: radius.full,
          backgroundColor: event.going ? SECTION_HUE.events : "transparent",
          borderWidth: 1,
          borderColor: event.going ? SECTION_HUE.events : colors.borderStrong,
        }}
      >
        <Icon
          name={event.going ? "check" : "add"}
          size={16}
          color={event.going ? culture.ink : colors.textPrimary}
        />
        <Text variant="label" style={event.going ? { color: culture.ink } : undefined}>
          {event.going ? "Going" : "I'll be there"}
        </Text>
      </PressableScale>
    </PressableScale>
  );
}

/** The hues a group card cycles through when it has no cover image. */
const GROUP_HUES = [culture.violet, culture.pink, culture.lime, culture.yellow];

function GroupCard({
  group,
  index,
  canEdit,
  onToggle,
}: {
  group: CampusGroup;
  index: number;
  canEdit: boolean;
  onToggle: (id: string) => void;
}) {
  const { colors } = useTheme();

  // Study groups have no image column, so the card is a colour block with a
  // pattern rather than a stock photo standing in for one the creator never
  // chose. Text sits on ink or warm white depending on the hue.
  const hue = GROUP_HUES[index % GROUP_HUES.length];
  const onHue = foregroundOn(hue);

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
      <View
        style={{
          borderRadius: radius.lg,
          overflow: "hidden",
          backgroundColor: hue,
          padding: spacing.md,
          gap: spacing.lg,
          minHeight: 240,
          justifyContent: "space-between",
        }}
      >
        <GraphicOverlay color={onHue} pattern={index % 2 ? "dots" : "orbit"} opacity={0.12} />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: spacing.sm,
          }}
        >
          <View
            style={{
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing["2xs"],
              borderRadius: radius.full,
              backgroundColor: "rgba(20,16,12,0.16)",
            }}
          >
            <Text variant="caption" style={{ color: onHue }}>
              {group.category}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <Text variant="caption" style={{ color: onHue, opacity: 0.8 }}>
              {group.members.toLocaleString()} {group.members === 1 ? "member" : "members"}
            </Text>
            {canEdit ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Edit ${group.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/group/[id]/edit",
                    params: { id: group.group_id },
                  })
                }
                style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="edit" size={17} color={onHue} />
              </PressableScale>
            ) : null}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <View style={{ gap: spacing["2xs"] }}>
            <Text variant="title" style={{ color: onHue }} numberOfLines={2}>
              {group.name}
            </Text>
            {group.courseName ? (
              <Text variant="caption" style={{ color: onHue, opacity: 0.86 }}>
                {group.courseName}
              </Text>
            ) : null}
            {group.description ? (
              <Text variant="caption" style={{ color: onHue, opacity: 0.86 }} numberOfLines={3}>
                {group.description}
              </Text>
            ) : null}
            <Text variant="caption" style={{ color: onHue, opacity: 0.7 }}>
              {group.next_meetup}
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityState={{ selected: group.joined }}
            accessibilityLabel={group.joined ? `Leave ${group.name}` : `Join ${group.name}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(group.group_id);
            }}
            style={{
              minHeight: 48,
              borderRadius: radius.full,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.xs,
              backgroundColor: group.joined ? "transparent" : colors.background,
              borderWidth: 1,
              borderColor: group.joined ? onHue : colors.background,
            }}
          >
            <Icon
              name={group.joined ? "check" : "connectAdd"}
              size={17}
              color={group.joined ? onHue : colors.textPrimary}
            />
            <Text variant="label" style={{ color: group.joined ? onHue : colors.textPrimary }}>
              {group.joined ? "Joined" : "Join group"}
            </Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

export default function EventsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ section?: string }>();
  const { user, profile } = useSession();
  const universityId = profile?.university_id ?? user?.university_id;

  const remote = useAsync(
    useCallback(
      () => fetchEvents(universityId ? { university_id: universityId } : undefined),
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

  const pins: CampusPin[] = useMemo(
    () => (buildings.data ?? []).map(adaptBuilding).filter(Boolean) as CampusPin[],
    [buildings.data]
  );

  const [events, setEvents] = useState<CampusEvent[]>([]);
  useEffect(() => {
    if (remote.data) setEvents(remote.data.map(adaptEvent));
  }, [remote.data]);

  // Two reads: every group, and the ones this user already belongs to. The
  // list endpoint carries no per-viewer membership flag, so "Joined" would
  // otherwise always render false.
  const remoteGroups = useAsync(
    useCallback(
      () => fetchStudyGroups(universityId ? { university_id: universityId } : undefined),
      [universityId]
    ),
    [universityId]
  );
  const myGroups = useAsync(
    useCallback(() => fetchMyStudyGroups(), []),
    []
  );

  const [groups, setGroups] = useState<CampusGroup[]>([]);
  useEffect(() => {
    if (!remoteGroups.data) return;
    const joined = new Set((myGroups.data ?? []).map((group) => group.group_id));
    setGroups(remoteGroups.data.map((group) => adaptStudyGroup(group, joined)));
  }, [remoteGroups.data, myGroups.data]);
  const [showMap, setShowMap] = useState(false);
  const [section, setSection] = useState<"events" | "groups">(
    params.section === "groups" ? "groups" : "events"
  );
  const [pin, setPin] = useState<CampusPin | null>(null);

  const sections = useMemo(() => {
    const order: CampusEvent["day"][] = ["Today", "Tomorrow", "This week"];
    return order
      .map((day) => ({ title: day, data: events.filter((e) => e.day === day) }))
      .filter((section) => section.data.length > 0);
  }, [events]);

  const toggle = useCallback((id: string) => {
    let wasGoing = false;
    setEvents((current) =>
      current.map((event) => {
        if (event.event_id !== id) return event;
        wasGoing = event.going;
        return {
          ...event,
          going: !event.going,
          attendees: event.attendees + (event.going ? -1 : 1),
        };
      })
    );
    rsvpToEvent(id, wasGoing ? "not_going" : "going");
  }, []);

  const toggleGroup = useCallback((id: string) => {
    let wasJoined = false;
    setGroups((current) =>
      current.map((group) => {
        if (group.group_id !== id) return group;
        wasJoined = group.joined;
        return {
          ...group,
          joined: !group.joined,
          members: group.members + (group.joined ? -1 : 1),
        };
      })
    );
    (wasJoined ? leaveStudyGroup : joinStudyGroup)(id);
  }, []);

  return (
    <Screen edges={showMap ? { top: false } : undefined}>
      {!showMap ? <OfflineBanner /> : null}
      {!showMap ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            gap: spacing.xs,
          }}
        >
          <Text variant="title" style={{ flex: 1 }}>
            Discover
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityState={{ selected: showMap }}
            accessibilityLabel={showMap ? "Show list" : "Show map"}
            onPress={() => {
              Haptics.selectionAsync();
              setSection("events");
              setShowMap((v) => !v);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing["2xs"],
              paddingHorizontal: spacing.sm,
              minHeight: 44,
              borderRadius: radius.full,
              backgroundColor: showMap ? SECTION_HUE.events : "transparent",
              borderWidth: 1,
              borderColor: showMap ? SECTION_HUE.events : colors.border,
            }}
          >
            <Icon
              name={showMap ? "events" : "map"}
              size={16}
              color={showMap ? culture.ink : colors.textPrimary}
            />
            <Text variant="caption" style={showMap ? { color: culture.ink } : undefined}>
              {showMap ? "List" : "Map"}
            </Text>
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={section === "groups" ? "Start a group" : "Create an event"}
            onPress={() => router.push(section === "groups" ? "/compose/group" : "/compose/event")}
            style={{ minHeight: 44, justifyContent: "center", paddingLeft: spacing.xs }}
          >
            <Icon name="add" size={22} color={colors.textPrimary} />
          </PressableScale>
        </View>
      ) : null}

      {!showMap ? (
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: spacing.lg,
            marginBottom: spacing.lg,
            padding: 4,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
          }}
        >
          {(["events", "groups"] as const).map((value) => {
            const active = section === value;
            return (
              <PressableScale
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSection(value);
                }}
                style={{
                  flex: 1,
                  minHeight: 42,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? SECTION_HUE.events : "transparent",
                }}
              >
                <Text
                  variant="label"
                  style={active ? { color: culture.ink } : undefined}
                  color={active ? undefined : "textSecondary"}
                >
                  {value === "events" ? "Events" : "Groups"}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      ) : null}

      {showMap ? (
        <View style={{ flex: 1 }}>
          <CampusMap
            pins={pins.filter((p) => p.kind === "event" || p.kind === "social")}
            selectedId={pin?.id}
            focusId={pin?.id}
            onSelect={setPin}
            hue={SECTION_HUE.events}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Return to events"
            onPress={() => setShowMap(false)}
            style={{
              position: "absolute",
              top: insets.top + spacing.xs,
              left: spacing.lg,
              minHeight: 44,
              paddingHorizontal: spacing.md,
              borderRadius: radius.full,
              backgroundColor: culture.lime,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <Icon name="back" size={17} color={culture.ink} />
            <Text variant="label" style={{ color: culture.ink }}>
              Events
            </Text>
          </PressableScale>
          {pin ? (
            <BuildingSheet
              pin={pin}
              bottom={TAB_BAR_CLEARANCE - spacing.xl}
              onClose={() => setPin(null)}
            />
          ) : null}
        </View>
      ) : section === "groups" ? (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.group_id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
          refreshControl={
            <RefreshControl
              refreshing={remoteGroups.refreshing}
              onRefresh={() => {
                remoteGroups.refresh();
                myGroups.refresh();
              }}
              tintColor={colors.textMuted}
              colors={[colors.accent]}
            />
          }
          ListHeaderComponent={
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.md,
                gap: spacing["2xs"],
              }}
            >
              <Text variant="heading">Find your circle</Text>
              <Text variant="body" color="textSecondary">
                Join recurring campus groups, then drop into their next meetup.
              </Text>
            </View>
          }
          ListEmptyComponent={
            remoteGroups.loading ? (
              <SkeletonList count={2} item={EventSkeleton} />
            ) : remoteGroups.error ? (
              <EmptyState
                tone="error"
                title="Could not load groups"
                body={remoteGroups.error}
                actionLabel="Try again"
                onAction={remoteGroups.reload}
              />
            ) : (
              <EmptyState
                title="No groups yet"
                body="Start the first study group on your campus and people can join it here."
                actionLabel="Start a group"
                onAction={() => router.push("/compose/group")}
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < 4 ? FadeIn.delay(index * 45).duration(200) : undefined}
            >
              <GroupCard
                group={item}
                index={index}
                canEdit={item.createdBy === user?.id}
                onToggle={toggleGroup}
              />
            </Animated.View>
          )}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.event_id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
          refreshControl={
            <RefreshControl
              refreshing={remote.refreshing}
              onRefresh={remote.refresh}
              tintColor={colors.textMuted}
              colors={[colors.accent]}
            />
          }
          renderSectionHeader={({ section }) => (
            <Text
              variant="micro"
              color="textMuted"
              style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}
            >
              {section.title}
            </Text>
          )}
          ListEmptyComponent={
            remote.loading ? (
              <SkeletonList count={3} item={EventSkeleton} />
            ) : remote.error ? (
              <EmptyState
                tone="error"
                title="Could not load events"
                body={remote.error}
                actionLabel="Try again"
                onAction={remote.reload}
              />
            ) : (
              <EmptyState
                title="Nothing scheduled"
                body="When someone on campus posts an event, it shows up here."
                actionLabel="Create an event"
                onAction={() => router.push("/compose/event")}
              />
            )
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < 4 ? FadeIn.delay(index * 45).duration(200) : undefined}
            >
              <EventCard event={item} onToggle={toggle} />
            </Animated.View>
          )}
        />
      )}
    </Screen>
  );
}
