import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AuthShell } from "@/src/components/auth/AuthShell";
import { Button, Field, InlineNotice, PressableScale, Text, Icon } from "@/src/components/ui";
import GoogleLoginButton, { isGoogleAuthConfigured } from "@/src/components/ui/GoogleLoginButton";
import { loginSchema, type LoginSchema } from "@/src/schemas/authSchemas";
import { signedInDestination } from "@/src/features/profile/setup";
import { EMAIL_UNVERIFIED, signInWithEmail } from "@/src/services/authServices";
import { useSession } from "@/src/services/SessionContext";
import { spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function LoginScreen() {
  const router = useRouter();
  const { email: verifiedEmail } = useLocalSearchParams<{ email?: string }>();
  const { colors } = useTheme();
  const { refresh, setupDismissed } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: verifiedEmail ?? "", password: "" },
  });

  const onSubmit = async (data: LoginSchema) => {
    setSubmitting(true);
    setFormError(null);
    const result = await signInWithEmail(data);

    if (result.success) {
      // Load the new account BEFORE navigating. Without this the context still
      // holds whoever was signed in last, and the tabs render their details.
      const refreshed = await refresh();
      setSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(
        signedInDestination(
          refreshed.profile,
          setupDismissed || refreshed.setupCompleted
        ) as never
      );
      return;
    }
    setSubmitting(false);
    if (result.status === EMAIL_UNVERIFIED) {
      // Sign-up was never finished. Resume it instead of reporting a failure.
      router.push({ pathname: "/auth/verify", params: { email: data.email } });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setFormError(result.error);
  };

  return (
    <AuthShell>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, gap: spacing.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={{ width: 44, height: 44, justifyContent: "center" }}
          >
            <Icon name="back" size={22} color={colors.textPrimary} />
          </PressableScale>

          <Text variant="wordmark">Welcome{"\n"}to campus</Text>

          <View style={{ gap: spacing.lg }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Field
                  label="University email"
                  placeholder="you@university.edu"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  icon="mail"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Field
                  label="Password"
                  placeholder="Your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secure
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  icon="privacy"
                />
              )}
            />

            {formError ? <InlineNotice message={formError} /> : null}

            <Button label="Log in" onPress={handleSubmit(onSubmit)} loading={submitting} />

            <PressableScale
              accessibilityRole="link"
              accessibilityLabel="Forgot your password"
              onPress={() => router.push("/auth/forgot-password")}
              style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}
            >
              <Text variant="caption" color="textSecondary">
                Forgot your password?
              </Text>
            </PressableScale>

            {isGoogleAuthConfigured() ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                  <Text variant="micro" color="textMuted">
                    or
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                </View>

                <GoogleLoginButton
                  onSuccess={async () => {
                    const refreshed = await refresh();
                    router.replace(
                      signedInDestination(
                        refreshed.profile,
                        setupDismissed || refreshed.setupCompleted
                      ) as never
                    );
                  }}
                />
              </>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: spacing["2xs"],
              }}
            >
              <Text variant="caption" color="textSecondary">
                New here?
              </Text>
              <PressableScale
                accessibilityRole="link"
                onPress={() => router.replace("/auth/register")}
              >
                <Text variant="caption" style={{ textDecorationLine: "underline" }}>
                  Create an account
                </Text>
              </PressableScale>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
