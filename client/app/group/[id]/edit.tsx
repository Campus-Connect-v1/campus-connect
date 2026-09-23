import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { FormChoice, FormField } from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, EmptyState, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  deleteStudyGroup,
  fetchStudyGroup,
  updateStudyGroup,
  type ApiStudyGroup,
} from "@/src/services/studyGroupServices";
import { spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const GROUP_TYPES = [
  { value: "public", label: "Anyone can join" },
  { value: "private", label: "Approve requests" },
  { value: "invite_only", label: "Invite only" },
] as const;

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "No fixed schedule" },
] as const;

const LOCATIONS = [
  { value: "campus", label: "On campus" },
  { value: "virtual", label: "Online" },
  { value: "hybrid", label: "Both" },
] as const;

type GroupType = (typeof GROUP_TYPES)[number]["value"];
type Frequency = (typeof FREQUENCIES)[number]["value"];
type LocationType = (typeof LOCATIONS)[number]["value"];

export default function EditGroupScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const remote = useAsync(
    useCallback(() => fetchStudyGroup(id), [id]),
    [id]
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [type, setType] = useState<GroupType>("public");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [location, setLocation] = useState<LocationType>("campus");
  const [maxMembers, setMaxMembers] = useState("20");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Seeded once the real row arrives. Editing before that would have the user
  // typing into fields that are about to be overwritten.
  useEffect(() => {
    const group = remote.data as ApiStudyGroup | null;
    if (!group) return;
    setName(group.group_name ?? "");
    setDescription(group.description ?? "");
    setCourseCode(group.course_code ?? "");
    setCourseName(group.course_name ?? "");
    setType((group.group_type as GroupType) ?? "public");
    setFrequency((group.meeting_frequency as Frequency) ?? "weekly");
    setLocation(
      ((group as { preferred_location_type?: LocationType }).preferred_location_type ??
        "campus") as LocationType
    );
    setMaxMembers(String(group.max_members ?? 20));
  }, [remote.data]);

  if (remote.loading) {
    return (
      <SettingsShell title="Edit group">
        <EmptyState.Loading />
      </SettingsShell>
    );
  }

  if (!remote.data) {
    return (
      <SettingsShell title="Edit group">
        <EmptyState
          tone="error"
          title="Could not load this group"
          body={remote.error ?? "It may have been deleted."}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SettingsShell>
    );
  }

  const submit = async () => {
    if (!name.trim()) return setError("Give the group a name.");

    const parsedMax = maxMembers.trim() ? Number(maxMembers) : 20;
    if (!Number.isFinite(parsedMax) || parsedMax < 2) {
      return setError("A group needs room for at least two people.");
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    const result = await updateStudyGroup(id, {
      group_name: name.trim(),
      description: description.trim() || undefined,
      course_code: courseCode.trim() || undefined,
      course_name: courseName.trim() || undefined,
      group_type: type,
      max_members: parsedMax,
      meeting_frequency: frequency,
      preferred_location_type: location,
    });

    setSaving(false);

    if (!result.success) {
      // 403 is the common one here: only the creator or an admin may edit.
      setError(
        result.status === 403
          ? "Only the group's creator or an admin can change these details."
          : result.error
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotice("Group updated.");
    await remote.reload();
  };

  const confirmDelete = () =>
    Alert.alert("Delete this group?", "Every member loses access and it cannot be recovered.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete group",
        style: "destructive",
        onPress: async () => {
          const result = await deleteStudyGroup(id);
          if (!result.success) {
            setError(
              result.status === 403 ? "Only the group's creator can delete it." : result.error
            );
            return;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(tabs)/events?section=groups");
        },
      },
    ]);

  return (
    <SettingsShell title="Edit group">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          {notice ? <InlineNotice tone="success" message={notice} /> : null}

          <FormField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />

          <FormField
            label="Description"
            placeholder="What is this group for, and who should join?"
            value={description}
            onChangeText={setDescription}
            multiline
            autoCapitalize="sentences"
          />

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <FormField
                label="Course code"
                placeholder="CSC 305"
                value={courseCode}
                onChangeText={setCourseCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <View style={{ flex: 2 }}>
              <FormField
                label="Course name"
                placeholder="Compiler Design"
                value={courseName}
                onChangeText={setCourseName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <FormChoice label="Joining" value={type} options={[...GROUP_TYPES]} onChange={setType} />
          <FormChoice
            label="Meets"
            value={frequency}
            options={[...FREQUENCIES]}
            onChange={setFrequency}
          />
          <FormChoice
            label="Where"
            value={location}
            options={[...LOCATIONS]}
            onChange={setLocation}
          />

          <FormField
            label="Size limit"
            value={maxMembers}
            onChangeText={setMaxMembers}
            keyboardType="number-pad"
          />

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Save changes" loading={saving} onPress={submit} />

          {/* Last, and visually separated: an irreversible action does not sit
              next to Save where a mis-tap is cheap. */}
          <View style={{ paddingTop: spacing.md, gap: spacing.sm }}>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Delete this group"
              onPress={confirmDelete}
              style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}
            >
              <Text variant="label" color="destructive">
                Delete group
              </Text>
            </PressableScale>
            <Text variant="caption" color="textMuted" style={{ textAlign: "center" }}>
              Everyone loses access and the group cannot be recovered.
            </Text>
          </View>

          <Text variant="caption" color="textMuted">
            Study groups have no cover image, so the card colour is assigned automatically.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
