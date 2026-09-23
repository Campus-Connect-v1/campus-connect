import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { FormChoice, FormField } from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, EmptyState, Icon, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  addCourse,
  addInterest,
  fetchCourses,
  fetchInterests,
  removeCourse,
  removeInterest,
  updateInterest,
  type ApiInterest,
} from "@/src/services/userServices";
import { culture, foregroundOn, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const INTEREST_TYPES = [
  { value: "academic", label: "Academic" },
  { value: "hobby", label: "Hobby" },
  { value: "career", label: "Career" },
  { value: "sports", label: "Sports" },
  { value: "arts", label: "Arts" },
] as const;

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
] as const;

/** Each interest type gets a stable hue, so the list reads as grouped. */
const TYPE_HUE: Record<string, string> = {
  academic: culture.violet,
  hobby: culture.pink,
  career: culture.yellow,
  sports: culture.lime,
  arts: culture.violet,
};

type InterestType = (typeof INTEREST_TYPES)[number]["value"];
type SkillLevel = (typeof SKILL_LEVELS)[number]["value"];

function Chip({
  label,
  hue,
  onPress,
  onRemove,
  removing,
}: {
  label: string;
  hue: string;
  onPress: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${label}. Tap to edit`}
      onPress={onPress}
      disabled={removing}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing["2xs"],
        paddingLeft: spacing.sm,
        paddingRight: spacing["2xs"],
        minHeight: 38,
        borderRadius: radius.full,
        backgroundColor: hue,
        opacity: removing ? 0.5 : 1,
      }}
    >
      <Text variant="caption" style={{ color: foregroundOn(hue) }}>
        {label}
      </Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Remove ${label}`}
        disabled={removing}
        onPress={onRemove}
        style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="close" size={13} color={foregroundOn(hue)} />
      </PressableScale>
    </PressableScale>
  );
}

export default function InterestsScreen() {
  const { colors } = useTheme();

  const interests = useAsync(
    useCallback(() => fetchInterests(), []),
    []
  );
  const courses = useAsync(
    useCallback(() => fetchCourses(), []),
    []
  );

  const [name, setName] = useState("");
  const [type, setType] = useState<InterestType>("hobby");
  const [level, setLevel] = useState<SkillLevel>("beginner");
  // Set while an existing interest is being changed, so the one form below
  // serves both jobs rather than the screen growing a second one.
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [courseName, setCourseName] = useState("");

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEditing = (interest: ApiInterest) => {
    Haptics.selectionAsync();
    setEditingId(interest.interest_id);
    setName(interest.interest_name || interest.name || "");
    setType(interest.interest_type);
    setLevel(interest.skill_level);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setName("");
    setType("hobby");
    setLevel("beginner");
  };

  const submitInterest = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the interest a name.");

    setBusy("interest");
    setError(null);

    const result = editingId
      ? await updateInterest(editingId, {
          interest_type: type,
          interest_name: trimmed,
          skill_level: level,
        })
      : await addInterest({
          interest_type: type,
          interest_name: trimmed,
          skill_level: level,
        });
    setBusy(null);

    if (!result.success) return setError(result.error);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cancelEditing();
    await interests.reload();
  };

  const submitCourse = async () => {
    const trimmedCode = code.trim();
    const trimmedName = courseName.trim();
    if (!trimmedCode || !trimmedName) {
      return setError("A course needs both a code and a name.");
    }

    setBusy("course");
    setError(null);
    const result = await addCourse({
      course_code: trimmedCode,
      course_name: trimmedName,
      is_current: true,
    });
    setBusy(null);

    if (!result.success) return setError(result.error);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCode("");
    setCourseName("");
    await courses.reload();
  };

  const drop = async (
    key: string,
    run: () => Promise<{ success: boolean; error?: string }>,
    reload: () => Promise<void>
  ) => {
    setBusy(key);
    setError(null);
    const result = await run();
    setBusy(null);
    if (!result.success) return setError(result.error ?? "Could not remove that.");
    await reload();
  };

  const labelFor = (interest: ApiInterest) => interest.interest_name || interest.name || "Interest";

  return (
    <SettingsShell title="Interests and courses">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
        >
          <Text variant="body" color="textSecondary">
            These decide who the app suggests to you. The more you add, the better the people it
            finds across campuses.
          </Text>

          {error ? <InlineNotice message={error} /> : null}

          {/* Interests */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Interests</Text>

            {interests.loading ? (
              <EmptyState.Loading compact />
            ) : (interests.data ?? []).length === 0 ? (
              <Text variant="caption" color="textMuted">
                Nothing yet. Add the first one below.
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {(interests.data ?? []).map((interest) => (
                  <Chip
                    key={interest.interest_id}
                    label={labelFor(interest)}
                    hue={TYPE_HUE[interest.interest_type] ?? culture.violet}
                    removing={busy === interest.interest_id}
                    onPress={() => startEditing(interest)}
                    onRemove={() =>
                      drop(
                        interest.interest_id,
                        () => removeInterest(interest.interest_id),
                        interests.reload
                      )
                    }
                  />
                ))}
              </View>
            )}

            <FormField
              label={editingId ? "Edit interest" : "Add an interest"}
              placeholder="Robotics, Afrobeats, debate…"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <FormChoice
              label="Kind"
              value={type}
              options={[...INTEREST_TYPES]}
              onChange={setType}
            />
            <FormChoice
              label="How deep"
              value={level}
              options={[...SKILL_LEVELS]}
              onChange={setLevel}
            />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {editingId ? (
                <View style={{ flex: 1 }}>
                  <Button label="Cancel" variant="secondary" onPress={cancelEditing} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Button
                  label={editingId ? "Save changes" : "Add interest"}
                  loading={busy === "interest"}
                  disabled={!name.trim()}
                  onPress={submitInterest}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Courses */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="heading">Courses</Text>

            {courses.loading ? (
              <EmptyState.Loading compact />
            ) : (courses.data ?? []).length === 0 ? (
              <Text variant="caption" color="textMuted">
                Add the courses you are taking this semester.
              </Text>
            ) : (
              <View style={{ gap: spacing.xs }}>
                {(courses.data ?? []).map((course) => (
                  <View
                    key={course.user_course_id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: spacing.sm,
                      minHeight: 56,
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.sm,
                      backgroundColor: colors.surface,
                      opacity: busy === String(course.user_course_id) ? 0.5 : 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="body">{course.course_code}</Text>
                      <Text variant="caption" color="textMuted" numberOfLines={1}>
                        {course.course_name}
                      </Text>
                    </View>
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${course.course_code}`}
                      disabled={busy === String(course.user_course_id)}
                      onPress={() =>
                        drop(
                          String(course.user_course_id),
                          () => removeCourse(course.user_course_id),
                          courses.reload
                        )
                      }
                      style={{
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="close" size={16} color={colors.textMuted} />
                    </PressableScale>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="Code"
                  placeholder="CSC 305"
                  value={code}
                  onChangeText={setCode}
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
            <Button
              label="Add course"
              loading={busy === "course"}
              disabled={!code.trim() || !courseName.trim()}
              onPress={submitCourse}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
