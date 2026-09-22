import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";

import { AuthShell } from "@/src/components/auth/AuthShell";
import { Button, PressableScale, Text, Icon } from "@/src/components/ui";
import { resendOtp, verifyOtp } from "@/src/services/authServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function VerifyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const inputRef = useRef<TextInput>(null);

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = async (value: string) => {
    if (!email) return;
    setSubmitting(true);
    setError(null);
    const result = await verifyOtp(email, value);

    if (result.success) {
      setSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Verification confirms the email only; the API deliberately returns
      // no JWT here. Send the user through login to establish a real session.
      router.replace({ pathname: "/auth/login", params: { email } });
      return;
    }
    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setCode("");
    setError(result.error);
  };

  const onChange = (next: string) => {
    const digits = next.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === OTP_LENGTH) submit(digits);
  };

  return (
    <AuthShell>
      <KeyboardAvoidingView
        style={{ flex: 1, padding: spacing.xl, gap: spacing.lg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={{ width: 44, height: 44, justifyContent: "center" }}
        >
          <Icon name="back" size={22} color={colors.textPrimary} />
        </PressableScale>

        <Text variant="wordmark">Check your{"\n"}email</Text>
        <Text variant="body" color="textSecondary">
          We sent a 6 digit code to {email ?? "your university address"}. Your account is not active
          until you enter it.
        </Text>

        <View style={{ gap: spacing.lg }}>
          {/* One hidden input behind six boxes. Six real inputs is the usual
              approach and it breaks paste, autofill and backspace. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enter verification code"
            onPress={() => inputRef.current?.focus()}
            style={{ flexDirection: "row", gap: spacing.xs }}
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: error
                    ? colors.destructive
                    : i === code.length
                      ? colors.accent
                      : colors.border,
                  backgroundColor: colors.surface,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="heading">{code[i] ?? ""}</Text>
              </View>
            ))}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            autoFocus
            // Invisible: the digit boxes above render the value. This only
            // exists to hold focus and receive keystrokes.
            style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
          />

          {error ? (
            <Text variant="caption" color="destructive" accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}
          {notice ? (
            <Text variant="caption" color="success" accessibilityLiveRegion="polite">
              {notice}
            </Text>
          ) : null}

          <Button
            label="Verify"
            loading={submitting}
            disabled={code.length < OTP_LENGTH}
            onPress={() => submit(code)}
          />

          <PressableScale
            accessibilityRole="button"
            disabled={cooldown > 0 || !email}
            onPress={async () => {
              if (!email) return;
              setNotice(null);
              setError(null);
              const result = await resendOtp(email);
              if (result.success) {
                setNotice("A new code is on its way.");
                setCooldown(RESEND_SECONDS);
              } else {
                setError(result.error);
              }
            }}
            style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}
          >
            <Text variant="caption" color={cooldown > 0 ? "textMuted" : "textPrimary"}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
