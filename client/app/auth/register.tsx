import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { AuthShell } from "@/src/components/auth/AuthShell";
import { UniversityPicker } from "@/src/components/auth/UniversityPicker";
import { Button, Field, PressableScale, Text, Icon } from "@/src/components/ui";
import { signupSchema, type SignupSchema } from "@/src/schemas/authSchemas";
import { signUpWithEmail } from "@/src/services/authServices";
import {
  fetchUniversities,
  matchUniversityByEmail,
  type UniversityOption,
} from "@/src/services/universityServices";
import { spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(true);
  const [uniError, setUniError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      university_id: "",
    },
  });

  const loadUniversities = useCallback(() => {
    setLoadingUnis(true);
    setUniError(null);
    fetchUniversities()
      .then((list) => {
        setUniversities(list);
        if (list.length === 0) {
          setUniError("No verified universities are available on the server yet.");
        }
      })
      .catch((error: unknown) => {
        setUniversities([]);
        setUniError(error instanceof Error ? error.message : "Could not load universities.");
      })
      .finally(() => setLoadingUnis(false));
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  // Most students' email domain identifies their university, so fill it in for
  // them rather than making them hunt through a list they can't misread.
  const email = watch("email");
  const selectedId = watch("university_id");
  useEffect(() => {
    if (!email || selectedId || universities.length === 0) return;
    const match = matchUniversityByEmail(email, universities);
    if (match) setValue("university_id", match.university_id, { shouldValidate: true });
  }, [email, selectedId, universities, setValue]);

  const onSubmit = async (data: SignupSchema) => {
    setSubmitting(true);
    setFormError(null);
    const result = await signUpWithEmail(data);
    setSubmitting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // The account exists but is unverified until the OTP is accepted.
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

          <Text variant="wordmark">Create your{"\n"}account</Text>

          <View style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="first_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Field
                      label="First name"
                      placeholder="Ama"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.first_name?.message}
                      autoCapitalize="words"
                      textContentType="givenName"
                      icon="profile"
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="last_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Field
                      label="Last name"
                      placeholder="Boateng"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.last_name?.message}
                      autoCapitalize="words"
                      textContentType="familyName"
                      icon="profile"
                    />
                  )}
                />
              </View>
            </View>

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
              name="university_id"
              render={({ field: { onChange, value } }) => (
                <UniversityPicker
                  universities={universities}
                  loading={loadingUnis}
                  unavailableReason={uniError}
                  value={value}
                  onChange={onChange}
                  onRetry={loadUniversities}
                  error={errors.university_id?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Field
                  label="Password"
                  placeholder="8+ chars, upper, number, symbol"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  secure
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  icon="privacy"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Field
                  label="Confirm password"
                  placeholder="Type it again"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  secure
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  icon="privacy"
                />
              )}
            />

            {formError ? (
              <Text variant="caption" color="destructive" accessibilityLiveRegion="polite">
                {formError}
              </Text>
            ) : null}

            <Button
              label="Create account"
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              disabled={universities.length === 0}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: spacing["2xs"],
              }}
            >
              <Text variant="caption" color="textSecondary">
                Already have an account?
              </Text>
              <PressableScale
                accessibilityRole="link"
                onPress={() => router.replace("/auth/login")}
              >
                <Text variant="caption" style={{ textDecorationLine: "underline" }}>
                  Log in
                </Text>
              </PressableScale>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
