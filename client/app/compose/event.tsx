import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import {
  FormChoice,
  FormDateTime,
  FormField,
  FormSwitchRow,
} from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, InlineNotice, Sticker, Text } from "@/src/components/ui";
import { createEvent } from "@/src/services/eventServices";
import { useSession } from "@/src/services/SessionContext";
import { culture, spacing } from "@/src/styles/theme";

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

export default function CreateEventScreen() {
  const { user, profile } = useSession();
  const universityId = profile?.university_id ?? user?.university_id;

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

  const submit = async () => {
    if (!title.trim()) return setError("Give the event a name.");
    if (!universityId) return setError("Your campus is still loading. Try again in a moment.");
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

    const result = await createEvent({
      university_id: universityId,
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

    if (!result.success) return setError(result.error);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/events");
  };

  return (
    <SettingsShell title="New event">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          <Sticker label="MAKE PLANS" backgroundColor={culture.yellow} />

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

          <Button label="Create event" loading={saving} onPress={submit} />

          <Text variant="caption" color="textMuted">
            Events are visible to students at your university.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
