import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { FormChoice, FormField } from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, InlineNotice, Sticker, Text } from "@/src/components/ui";
import { useSession } from "@/src/services/SessionContext";
import { createStudyGroup } from "@/src/services/studyGroupServices";
import { culture, spacing } from "@/src/styles/theme";

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

export default function CreateGroupScreen() {
  const { user, profile } = useSession();
  const universityId = profile?.university_id ?? user?.university_id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [type, setType] = useState<(typeof GROUP_TYPES)[number]["value"]>("public");
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]["value"]>("weekly");
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]["value"]>("campus");
  const [maxMembers, setMaxMembers] = useState("20");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError("Give the group a name.");
    if (!universityId) return setError("Your campus is still loading. Try again in a moment.");

    const parsedMax = maxMembers.trim() ? Number(maxMembers) : 20;
    if (!Number.isFinite(parsedMax) || parsedMax < 2) {
      return setError("A group needs room for at least two people.");
    }

    setSaving(true);
    setError(null);

    const result = await createStudyGroup({
      university_id: universityId,
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

    if (!result.success) return setError(result.error);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/events?section=groups");
  };

  return (
    <SettingsShell title="New group">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          <Sticker label="FIND YOUR PEOPLE" backgroundColor={culture.lime} />

          <FormField
            label="Name"
            placeholder="Build After Class"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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
            hint="How many people can be in the group at once."
          />

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Create group" loading={saving} onPress={submit} />

          <Text variant="caption" color="textMuted">
            You will be added as the first member.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
