import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import {
  FormChoice,
  FormDateTime,
  FormField,
  FormSwitchRow,
} from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, EmptyState, InlineNotice, Text } from "@/src/components/ui";
import { fetchEvent, updateEvent } from "@/src/services/eventServices";
import { spacing } from "@/src/styles/theme";
import { useAsync } from "@/src/hooks/useAsync";

const EVENT_TYPES = [
  { value: "social", label: "Social" },
  { value: "academic", label: "Academic" },
  { value: "sports", label: "Sports" },
  { value: "career", label: "Career" },
  { value: "club", label: "Club" },
  { value: "workshop", label: "Workshop" },
] as const;

const LOCATION_TYPES = [
  { value: "physical", label: "In person" },
  { value: "virtual", label: "Online" },
  { value: "hybrid", label: "Both" },
] as const;

/** Next full hour, which is a more useful default than "right now". */
function nextHour(offsetHours = 24) {
  const date = new Date(Date.now() + offsetHours * 3600_000);
  date.setMinutes(0, 0, 0);
  return date;
}

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const remote = useAsync(
    useCallback(() => fetchEvent(id), [id]),
    [id]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof EVENT_TYPES)[number]["value"]>("social");
  const [start, setStart] = useState(nextHour(24));
  const [end, setEnd] = useState(nextHour(26));
  const [locationType, setLocationType] =
    useState<(typeof LOCATION_TYPES)[number]["value"]>("physical");
  const [place, setPlace] = useState("");
  const [link, setLink] = useState("");
  const [capacity, setCapacity] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requiresRsvp, setRequiresRsvp] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Seeded once the event arrives; editing before that would be typing into
  // fields about to be overwritten.
  useEffect(() => {
    const event = remote.data;
    if (!event) return;
    setTitle(event.event_title ?? "");
    setDescription(event.event_description ?? "");
    setType((event.event_type as typeof type) ?? "social");
    setStart(new Date(event.start_time));
    setEnd(new Date(event.end_time));
    setLocationType((event.location_type as typeof locationType) ?? "physical");
    setPlace(event.physical_location ?? "");
    setLink(event.virtual_link ?? "");
    setCapacity(event.max_attendees ? String(event.max_attendees) : "");
    setIsPublic(Boolean(event.is_public));
    setRequiresRsvp(Boolean(event.requires_rsvp));
  }, [remote.data]);

  const submit = async () => {
    if (!title.trim()) return setError("Give the event a name.");
    if (end <= start) return setError("The end time has to be after the start time.");
    if (locationType !== "virtual" && !place.trim()) {
      return setError("Say where it is happening.");
    }
    if (locationType !== "physical" && !link.trim()) {
      return setError("Add the link people should join on.");
    }

    const parsedCapacity = capacity.trim() ? Number(capacity) : null;
    if (parsedCapacity !== null && (!Number.isFinite(parsedCapacity) || parsedCapacity < 1)) {
      return setError("Capacity has to be a number above zero, or left empty.");
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const result = await updateEvent(id, {
      event_title: title.trim(),
      event_description: description.trim() || undefined,
      event_type: type,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location_type: locationType,
      physical_location: locationType !== "virtual" ? place.trim() : undefined,
      virtual_link: locationType !== "physical" ? link.trim() : undefined,
      max_attendees: parsedCapacity,
      is_public: isPublic,
      requires_rsvp: requiresRsvp,
    });

    setSaving(false);

    if (!result.success) {
      return setError(
        result.status === 403
          ? "Only the person who created this event can change it."
          : result.error
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotice("Event updated.");
    await remote.reload();
  };

  if (remote.loading) {
    return (
      <SettingsShell title="Edit event">
        <EmptyState.Loading />
      </SettingsShell>
    );
  }

  if (!remote.data) {
    return (
      <SettingsShell title="Edit event">
        <EmptyState
          tone="error"
          title="Could not load this event"
          body={remote.error ?? "It may have been cancelled."}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SettingsShell>
    );
  }

  return (
    <SettingsShell title="Edit event">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          {notice ? <InlineNotice tone="success" message={notice} /> : null}

          <FormField
            label="Name"
            placeholder="Inter-hall football final"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <FormField
            label="Description"
            placeholder="What should people know before they come?"
            value={description}
            onChangeText={setDescription}
            multiline
            autoCapitalize="sentences"
          />

          <FormChoice label="Type" value={type} options={[...EVENT_TYPES]} onChange={setType} />

          <FormDateTime label="Starts" value={start} minimumDate={new Date()} onChange={setStart} />
          <FormDateTime label="Ends" value={end} minimumDate={start} onChange={setEnd} />

          <FormChoice
            label="Where"
            value={locationType}
            options={[...LOCATION_TYPES]}
            onChange={setLocationType}
          />

          {locationType !== "virtual" ? (
            <FormField
              label="Location"
              placeholder="Sports Complex"
              value={place}
              onChangeText={setPlace}
              autoCapitalize="words"
            />
          ) : null}

          {locationType !== "physical" ? (
            <FormField
              label="Link"
              placeholder="https://meet.example.com/abc"
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              textContentType="URL"
            />
          ) : null}

          <FormField
            label="Capacity"
            placeholder="Leave empty for no limit"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
            hint="The most people who can attend."
          />

          <View style={{ gap: spacing.sm }}>
            <FormSwitchRow
              label="Open to everyone"
              detail="Off means only people you invite can see it"
              value={isPublic}
              onChange={setIsPublic}
            />
            <FormSwitchRow
              label="Ask people to RSVP"
              detail="Lets you see who is coming"
              value={requiresRsvp}
              onChange={setRequiresRsvp}
            />
          </View>

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Save changes" loading={saving} onPress={submit} />

          <Text variant="caption" color="textMuted">
            People who already said they are going keep their RSVP.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
