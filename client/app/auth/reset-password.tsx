import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AuthShell } from "@/src/components/auth/AuthShell";
import { Button, Field, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { resetPassword } from "@/src/services/authServices";
import { spacing } from "@/src/styles/theme";

export default function ResetPasswordScreen() {
  // Both arrive from the forgot-password screen; either can be typed instead.
  const { token: initialCode, email: initialEmail } = useLocalSearchParams<{
    token?: string;
    email?: string;
  }>();

  const [code, setCode] = useState(initialCode ?? "");
  /**
   * The code alone cannot identify anyone.
   *
   * It is six digits with no claims in it, unlike the signed token this
   * replaced, so the server has to be told whose code it is. It is normally
   * carried through from the previous screen; the field below appears only
   * when it was not, rather than making everyone retype it.
   */
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!email.trim()) return setError("Enter the email you asked for the code with.");
    if (!/^\d{6}$/.test(code.trim())) return setError("The code is the six digits from your email.");
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

    const result = await resetPassword(email.trim(), code.trim(), password);
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
            {initialEmail
              ? `We sent a six digit code to ${initialEmail}. Enter it below with your new password.`
              : "Enter the six digit code from your email, then choose a new password."}
          </Text>

          {/* Only when the previous screen did not carry it. */}
          {initialEmail ? null : (
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@university.edu.gh"
            />
          )}

          <Field
            label="Code from email"
            value={code}
            // Digits only, six of them: the keyboard, the length and the
            // one-time-code hint all say the same thing, so the field cannot
            // be mistaken for the old pasteable token.
            onChangeText={(next) => setCode(next.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="123456"
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
