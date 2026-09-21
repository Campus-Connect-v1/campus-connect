import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  EmptyState,
  Icon,
  InlineNotice,
  Media,
  PressableScale,
  Tag,
  Text,
} from "@/src/components/ui";
import { adaptEvent } from "@/src/features/events/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { deleteEvent, fetchAttendees, fetchEvent, rsvpToEvent } from "@/src/services/eventServices";
import { useSession } from "@/src/services/SessionContext";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

function Detail({
  icon,
  label,
  value,
  onPress,
}: {
  icon: "events" | "location" | "connect" | "course";
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const body = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 56 }}>
      <Icon name={icon} size={19} color={colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
        <Text variant="body">{value}</Text>
      </View>
      {onPress ? <Icon name="forward" size={16} color={colors.textMuted} /> : null}
    </View>
  );

  return onPress ? (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
    >
      {body}
    </PressableScale>
  ) : (
    body
  );
}

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();

  const [going, setGoing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remote = useAsync(
    useCallback(() => fetchEvent(id), [id]),
    [id]
  );

  const attendees = useAsync(
    useCallback(() => fetchAttendees(id), [id]),
    [id]
  );

  if (remote.loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState.Loading />
      </View>
    );
  }

  const event = remote.data;

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          tone="error"
          title="Could not load this event"
          body={remote.error ?? "It may have been cancelled."}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const display = adaptEvent(event);
  const isHost = event.created_by === user?.id;
  const attending = going ?? display.going;
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const attendeeCount = (attendees.data as unknown[] | null)?.length ?? 0;

  const toggleRsvp = async () => {
    setBusy(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const next = !attending;
    setGoing(next);

    const result = await rsvpToEvent(id, next ? "going" : "not_going");
    setBusy(false);

    if (!result.success) {
      setGoing(!next);
      setError(result.error);
      return;
    }
    attendees.refresh();
  };

  const confirmDelete = () =>
    Alert.alert("Cancel this event?", "Everyone who RSVP'd will lose it. This cannot be undone.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Cancel event",
        style: "destructive",
        onPress: async () => {
          const result = await deleteEvent(id);
          if (result.success) router.replace("/(tabs)/events");
          else setError(result.error);
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <Media
          source={display.image}
          scrim="full"
          rounded="none"
          style={{ height: 300 }}
          accessibilityIgnoresInvertColors
        >
          <View
            style={{ flex: 1, justifyContent: "flex-end", padding: spacing.lg, gap: spacing.xs }}
          >
            <View style={{ flexDirection: "row" }}>
              <Tag label={event.event_type} onMedia />
            </View>
            <Text variant="title" onMedia>
              {event.event_title}
            </Text>
          </View>
        </Media>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          {error ? <InlineNotice message={error} /> : null}

          {event.event_description ? (
            <Text variant="body" color="textSecondary">
              {event.event_description}
            </Text>
          ) : null}

          <View style={{ gap: spacing["2xs"] }}>
            <Detail
              icon="events"
              label="When"
              value={`${start.toLocaleDateString([], {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}, ${start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} to ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            />

            {event.physical_location ? (
              <Detail icon="location" label="Where" value={event.physical_location} />
            ) : null}

            {event.virtual_link ? (
              <Detail
                icon="course"
                label="Join online"
                value={event.virtual_link}
                onPress={() => Linking.openURL(event.virtual_link!)}
              />
            ) : null}

            <Detail
              icon="connect"
              label="Going"
              value={
                `${attendeeCount} ${attendeeCount === 1 ? "person" : "people"}` +
                (event.max_attendees ? ` of ${event.max_attendees}` : "")
              }
            />
          </View>

          {isHost ? (
            <View style={{ gap: spacing.sm, paddingTop: spacing.sm }}>
              <Button
                label="Edit event"
                variant="secondary"
                icon={<Icon name="edit" size={17} color={colors.textPrimary} />}
                onPress={() => router.push({ pathname: "/event/[id]/edit", params: { id } })}
              />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Cancel this event"
                onPress={confirmDelete}
                style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}
              >
                <Text variant="label" color="destructive">
                  Cancel event
                </Text>
              </PressableScale>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {!isHost ? (
        <View
          style={{
            position: "absolute",
            left: spacing.lg,
            right: spacing.lg,
            bottom: insets.bottom + spacing.md,
          }}
        >
          <Button
            label={attending ? "Going" : "I'll be there"}
            loading={busy}
            icon={
              <Icon
                name={attending ? "check" : "add"}
                size={17}
                color={attending ? culture.ink : colors.accentFg}
              />
            }
            onPress={toggleRsvp}
            style={attending ? { backgroundColor: culture.lime } : undefined}
          />
        </View>
      ) : null}

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + spacing.xs,
          left: spacing.lg,
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(7,18,25,0.45)",
        }}
      >
        <Icon name="back" size={20} color={colors.onMedia} />
      </PressableScale>
    </View>
  );
}
