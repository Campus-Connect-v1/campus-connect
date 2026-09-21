import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AuthShell } from "@/src/components/auth/AuthShell";
import { Button, Field, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { requestPasswordReset } from "@/src/services/authServices";
import { spacing } from "@/src/styles/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const address = email.trim();
    if (!address.includes("@")) return setError("Enter your campus email address.");

    setBusy(true);
    setError(null);

    const result = await requestPasswordReset(address);
    setBusy(false);

    if (!result.success) return setError(result.error);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell>
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <Text variant="title" onMedia>
            Check your email
          </Text>
          <Text variant="body" onMedia style={{ opacity: 0.85 }}>
            If an account exists for {email.trim()}, a reset code is on its way. It expires shortly,
            so use it soon.
          </Text>
          <Button
            label="I have the code"
            onPress={() =>
              router.replace({
                pathname: "/auth/reset-password",
                params: { email: email.trim() },
              })
            }
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send it again"
            onPress={() => setSent(false)}
            style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}
          >
            <Text variant="caption" onMedia style={{ opacity: 0.85 }}>
              Send it again
            </Text>
          </PressableScale>
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
            Reset your password
          </Text>
          <Text variant="body" onMedia style={{ opacity: 0.85 }}>
            Enter your campus email and we will send you a code.
          </Text>

          <Field
            label="Campus email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            icon="mail"
          />

          {error ? <InlineNotice message={error} /> : null}

          <Button label="Send reset code" loading={busy} onPress={submit} />

          <PressableScale
            accessibilityRole="link"
            accessibilityLabel="Back to sign in"
            onPress={() => router.replace("/auth/login")}
            style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}
          >
            <Text variant="caption" onMedia style={{ opacity: 0.85 }}>
              Back to sign in
            </Text>
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
