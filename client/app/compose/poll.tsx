import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { FormChoice, FormField, FormSwitchRow } from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, Icon, InlineNotice, PressableScale, Sticker, Text } from "@/src/components/ui";
import {
  createPoll,
  MAX_POLL_OPTIONS,
  MIN_POLL_OPTIONS,
  type ApiPoll,
} from "@/src/services/pollServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const VISIBILITIES: { value: ApiPoll["visibility"]; label: string }[] = [
  { value: "connections", label: "Connections" },
  { value: "university", label: "Campus" },
  { value: "public", label: "Everyone" },
];

const DURATIONS = [
  { value: "0", label: "No limit" },
  { value: "6", label: "6 hours" },
  { value: "24", label: "1 day" },
  { value: "72", label: "3 days" },
  { value: "168", label: "1 week" },
] as const;

export default function CreatePollScreen() {
  const { colors } = useTheme();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multi, setMulti] = useState(false);
  const [allowChange, setAllowChange] = useState(true);
  const [visibility, setVisibility] = useState<ApiPoll["visibility"]>("connections");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["value"]>("24");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setOption = (index: number, value: string) =>
    setOptions((current) => current.map((option, i) => (i === index ? value : option)));

  const addOption = () => {
    if (options.length >= MAX_POLL_OPTIONS) return;
    Haptics.selectionAsync();
    setOptions((current) => [...current, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_POLL_OPTIONS) return;
    Haptics.selectionAsync();
    setOptions((current) => current.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const trimmedQuestion = question.trim();
    const filled = options.map((option) => option.trim()).filter(Boolean);

    if (!trimmedQuestion) return setError("Ask a question.");
    if (filled.length < MIN_POLL_OPTIONS) {
      return setError(`A poll needs at least ${MIN_POLL_OPTIONS} options.`);
    }

    // The server compares options case-insensitively and 400s on duplicates,
    // so the same check runs here to keep the error next to the field.
    const distinct = new Set(filled.map((option) => option.toLowerCase()));
    if (distinct.size !== filled.length) return setError("Every option has to be different.");

    const hours = Number(duration);
    const closesAt = hours > 0 ? new Date(Date.now() + hours * 3600_000).toISOString() : null;

    setSaving(true);
    setError(null);

    const result = await createPoll({
      question: trimmedQuestion,
      options: filled,
      max_selections: multi ? filled.length : 1,
      closes_at: closesAt,
      allow_change: allowChange,
      visibility,
    });

    setSaving(false);

    if (!result.success) return setError(result.error);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/home");
  };

  return (
    <SettingsShell title="New poll">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          <Sticker label="ASK CAMPUS" backgroundColor={culture.violet} />

          <FormField
            label="Question"
            placeholder="Where should the end of semester party be?"
            value={question}
            onChangeText={setQuestion}
            multiline
            autoCapitalize="sentences"
            maxLength={500}
          />

          <View style={{ gap: spacing.xs }}>
            <Text variant="micro" color="textMuted">
              OPTIONS
            </Text>

            {options.map((option, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
              >
                <View style={{ flex: 1 }}>
                  <FormField
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChangeText={(value) => setOption(index, value)}
                    autoCapitalize="sentences"
                    maxLength={255}
                  />
                </View>
                {options.length > MIN_POLL_OPTIONS ? (
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Remove option ${index + 1}`}
                    onPress={() => removeOption(index)}
                    style={{
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="close" size={18} color={colors.textMuted} />
                  </PressableScale>
                ) : (
                  <View style={{ width: 44 }} />
                )}
              </View>
            ))}

            {options.length < MAX_POLL_OPTIONS ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Add another option"
                onPress={addOption}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.xs,
                  minHeight: 48,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: colors.borderStrong,
                }}
              >
                <Icon name="add" size={17} color={colors.textSecondary} />
                <Text variant="label" color="textSecondary">
                  Add option
                </Text>
              </PressableScale>
            ) : (
              <Text variant="caption" color="textMuted">
                {MAX_POLL_OPTIONS} options is the most a poll can have.
              </Text>
            )}
          </View>

          <FormChoice
            label="Closes"
            value={duration}
            options={[...DURATIONS]}
            onChange={setDuration}
          />

          <FormChoice
            label="Who can vote"
            value={visibility}
            options={VISIBILITIES}
            onChange={setVisibility}
          />

          <View style={{ gap: spacing.sm }}>
            <FormSwitchRow
              label="Allow several answers"
              detail="People can pick more than one option"
              value={multi}
              onChange={setMulti}
            />
            <FormSwitchRow
              label="Let people change their vote"
              detail="Off means a vote is final"
              value={allowChange}
              onChange={setAllowChange}
            />
          </View>

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Post poll" loading={saving} onPress={submit} />

          <Text variant="caption" color="textMuted">
            Results stay hidden until someone votes, so early answers do not sway later ones.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
