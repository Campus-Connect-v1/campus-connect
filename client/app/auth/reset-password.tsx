import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AuthShell } from "@/src/components/auth/AuthShell";
import { Button, Field, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { resetPassword } from "@/src/services/authServices";
import { spacing } from "@/src/styles/theme";

export default function ResetPasswordScreen() {
  // Prefilled when a deep link carries it; typed in from the email otherwise.
  const { token: initialToken, email } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();

  const [token, setToken] = useState(initialToken ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!token.trim()) return setError("Paste the code from your email.");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password.length > 128) return setError("Use no more than 128 characters.");
    if (!/[a-z]/.test(password)) return setError("Include a lowercase letter.");
    if (!/[A-Z]/.test(password)) return setError("Include an uppercase letter.");
    if (!/\d/.test(password)) return setError("Include a number.");
    if (!/[@$!%*?&]/.test(password)) {
      return setError("Include a special character: @ $ ! % * ? or &.");
    }
    if (password !== confirm) return setError("Those two passwords do not match.");

    setBusy(true);
    setError(null);

    const result = await resetPassword(token.trim(), password);
    setBusy(false);

    if (!result.success) {
      return setError(
        result.status === 400 || result.status === 404
          ? "That code is not valid, or it has expired. Ask for a new one."
          : result.error
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
  };

  if (done) {
    return (
      <AuthShell>
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <Text variant="title" onMedia>
            Password changed
          </Text>
          <Text variant="body" onMedia style={{ opacity: 0.85 }}>
            You can sign in with your new password now.
          </Text>
          <Button label="Go to sign in" onPress={() => router.replace("/auth/login")} />
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: spacing.xl,
            gap: spacing.md,
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <Text variant="title" onMedia>
            Set a new password
          </Text>
          <Text variant="body" onMedia style={{ opacity: 0.85 }}>
            {email
              ? `We sent a code to ${email}. Paste it below with your new password.`
              : "Paste the code from your email, then choose a new password."}
          </Text>

          <Field
            label="Code from email"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Paste the code"
          />

          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <Field
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secure
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Change password" loading={busy} onPress={submit} />

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            onPress={() => router.replace("/auth/login")}
            style={{ alignSelf: "center", minHeight: 48, justifyContent: "center" }}
          >
            <Text variant="label" onMedia>
              Back to sign in
            </Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
