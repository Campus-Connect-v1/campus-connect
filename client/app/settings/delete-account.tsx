import * as Haptics from "expo-haptics";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { FormField } from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, InlineNotice, Text } from "@/src/components/ui";
import { useSession } from "@/src/services/SessionContext";
import { deleteAccount } from "@/src/services/userServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** Typing this exactly is the second gate, after the password. */
const CONFIRM_WORD = "DELETE";

export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const { signOut } = useSession();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = password.length > 0 && confirm.trim().toUpperCase() === CONFIRM_WORD;

  const submit = async () => {
    if (!ready || busy) return;

    setBusy(true);
    setError(null);

    const result = await deleteAccount(password, reason);

    if (!result.success) {
      setBusy(false);
      setError(result.status === 401 ? "That password is not right." : result.error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // The account is gone, so the stored token is dead. signOut clears it and
    // sends the user back to the front door.
    await signOut();
  };

  return (
    <SettingsShell title="Delete account">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          <View
            style={{
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.destructive,
              backgroundColor: colors.surfaceSunken,
            }}
          >
            <Text variant="heading" color="destructive">
              This cannot be undone
            </Text>
            <Text variant="body" color="textSecondary">
              Deleting your account removes your profile, your posts, comments and stories, your
              events and groups, and your place in every conversation. Nobody will be able to find
              you on campus through Campus Connect.
            </Text>
          </View>

          <FormField
            label="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
          />

          <FormField
            label={`Type ${CONFIRM_WORD} to confirm`}
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={CONFIRM_WORD}
          />

          <FormField
            label="Why are you leaving? (optional)"
            value={reason}
            onChangeText={setReason}
            multiline
            autoCapitalize="sentences"
            hint="This helps us understand what went wrong. It is not required."
          />

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Delete my account" loading={busy} disabled={!ready} onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
