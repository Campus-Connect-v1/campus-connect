import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { FormChoice, FormDateTime, FormField } from "@/src/components/forms/FormControls";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, EmptyState, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import {
  PROFILE_INTERESTS,
  STUDY_YEARS,
  type ProfileInterestOption,
  type StudyYear,
} from "@/src/features/profile/setup";
import { useAsync } from "@/src/hooks/useAsync";
import { useSession } from "@/src/services/SessionContext";
import {
  addInterest,
  fetchProfile,
  removeInterest,
  updateProfile,
  type ApiProfile,
} from "@/src/services/userServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * Mirrors the server's Joi rules so a bad value is caught next to its field
 * instead of coming back as one flat 400 with no idea which input was wrong.
 */
const PHONE = /^\+?[\d\s-()]{10,}$/;
const GRAD_MIN = 2000;
const GRAD_MAX = 2030;

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type Errors = Partial<Record<string, string>>;

export default function EditProfileScreen() {
  const { refresh } = useSession();
  const { colors } = useTheme();

  /**
   * Re-read the private profile when this screen opens. It now returns every
   * editable field, so the editor no longer depends on the public-user route.
   */
  const record = useAsync(
    useCallback(() => fetchProfile(), []),
    []
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [program, setProgram] = useState("");
  const [year, setYear] = useState<StudyYear | "">("");
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [gradYear, setGradYear] = useState("");
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Seeded once the profile lands. Editing before that would be typing into
  // fields about to be overwritten.
  useEffect(() => {
    const row = record.data;
    if (!row) return;
    setFirstName(row.first_name ?? "");
    setLastName(row.last_name ?? "");
    setHeadline(row.profile_headline ?? "");
    setBio(row.bio ?? "");
    setProgram(row.program ?? "");
    setYear(row.year_of_study ?? "");
    const canonicalNames = new Map(
      PROFILE_INTERESTS.map((interest) => [interest.name.toLowerCase(), interest.name])
    );
    setSelectedInterests(
      new Set(
        (row.interests ?? []).map(
          (interest) =>
            canonicalNames.get(interest.interest_name.toLowerCase()) ?? interest.interest_name
        )
      )
    );
    setGradYear(row.graduation_year ? String(row.graduation_year) : "");
    setBirthday(row.date_of_birth ? new Date(row.date_of_birth) : null);
    setPhone(row.phone_number ?? "");
    setLinkedin(row.linkedin_url ?? "");
    setWebsite(row.website_url ?? "");
  }, [record.data]);

  const today = useMemo(() => new Date(), []);
  const interestOptions = useMemo(() => {
    const known = new Set(PROFILE_INTERESTS.map((interest) => interest.name.toLowerCase()));
    const custom = (record.data?.interests ?? [])
      .filter((interest) => !known.has(interest.interest_name.toLowerCase()))
      .map((interest) => ({ name: interest.interest_name, type: interest.interest_type }));
    return [...PROFILE_INTERESTS, ...custom] as ProfileInterestOption[];
  }, [record.data?.interests]);

  const toggleInterest = (name: string) => {
    Haptics.selectionAsync();
    setSelectedInterests((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else if (next.size < 6) next.add(name);
      return next;
    });
  };

  if (record.loading) {
    return (
      <SettingsShell title="Edit profile">
        <EmptyState.Loading />
      </SettingsShell>
    );
  }

  if (!record.data) {
    return (
      <SettingsShell title="Edit profile">
        <EmptyState
          tone="error"
          title="Could not load your profile"
          body={record.error ?? "Check your connection and try again."}
          actionLabel="Try again"
          onAction={record.reload}
        />
      </SettingsShell>
    );
  }

  const validate = (): Errors => {
    const next: Errors = {};

    if (!firstName.trim()) next.firstName = "Your first name cannot be empty.";
    else if (firstName.trim().length > 100) next.firstName = "Keep this under 100 characters.";

    if (lastName.trim().length > 100) next.lastName = "Keep this under 100 characters.";
    if (headline.length > 255) next.headline = "Keep your headline under 255 characters.";
    if (bio.length > 1000) next.bio = "Keep your bio under 1000 characters.";
    if (program.length > 100) next.program = "Keep this under 100 characters.";

    if (gradYear.trim()) {
      const year = Number(gradYear);
      if (!Number.isInteger(year) || year < GRAD_MIN || year > GRAD_MAX) {
        next.gradYear = `Enter a year between ${GRAD_MIN} and ${GRAD_MAX}.`;
      }
    }

    if (phone.trim() && !PHONE.test(phone.trim())) {
      next.phone = "Enter at least 10 digits. Spaces, dashes and + are fine.";
    }

    if (linkedin.trim() && !isUrl(linkedin.trim())) {
      next.linkedin = "Enter a full link, starting with https://";
    }
    if (website.trim() && !isUrl(website.trim())) {
      next.website = "Enter a full link, starting with https://";
    }

    return next;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    setFormError(null);

    if (Object.keys(found).length > 0) return;

    setSaving(true);

    // Only non-empty values are sent. Every field on this screen is `optional`
    // server-side but none accept an empty string, so blanking one out means
    // omitting it rather than sending "".
    const patch: Record<string, unknown> = { first_name: firstName.trim() };
    const put = (key: string, value: string) => {
      if (value.trim()) patch[key] = value.trim();
    };
    put("last_name", lastName);
    put("profile_headline", headline);
    put("bio", bio);
    put("program", program);
    put("phone_number", phone);
    put("linkedin_url", linkedin);
    put("website_url", website);
    if (gradYear.trim()) patch.graduation_year = Number(gradYear);
    if (birthday) patch.date_of_birth = birthday.toISOString().slice(0, 10);
    if (year) patch.year_of_study = year;

    const result = await updateProfile(patch as Partial<ApiProfile>);

    if (!result.success) {
      setSaving(false);
      setFormError(result.error);
      return;
    }

    const existing = record.data?.interests ?? [];
    const selectedKeys = new Set(
      Array.from(selectedInterests, (interest) => interest.toLowerCase())
    );
    const existingKeys = new Set(
      existing.map((interest) => interest.interest_name.toLowerCase())
    );
    const interestResults = await Promise.all([
      ...existing
        .filter((interest) => !selectedKeys.has(interest.interest_name.toLowerCase()))
        .map((interest) => removeInterest(interest.interest_id)),
      ...Array.from(selectedInterests)
        .filter((name) => !existingKeys.has(name.toLowerCase()))
        .map((name) => {
          const option = interestOptions.find(
            (interest) => interest.name.toLowerCase() === name.toLowerCase()
          );
          return addInterest({
            interest_name: name,
            interest_type: option?.type ?? "hobby",
            skill_level: "beginner",
          });
        }),
    ]);
    const interestFailure = interestResults.find((interestResult) => !interestResult.success);

    if (interestFailure && !interestFailure.success) {
      setSaving(false);
      setFormError(`Your main details were saved, but interests could not be fully updated. ${interestFailure.error}`);
      await Promise.all([record.reload(), refresh()]);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await refresh();
    setSaving(false);
    router.back();
  };

  return (
    <SettingsShell title="Edit profile">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <FormField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                error={errors.lastName}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
              />
            </View>
          </View>

          <FormField
            label="Headline"
            placeholder="Final year CS, building things between lectures"
            value={headline}
            onChangeText={setHeadline}
            error={errors.headline}
            autoCapitalize="sentences"
            hint="A line that shows next to your name when people find you."
          />

          <FormField
            label="Bio"
            placeholder="What are you around for?"
            value={bio}
            onChangeText={setBio}
            error={errors.bio}
            multiline
            autoCapitalize="sentences"
          />

          <FormField
            label="Programme"
            placeholder="Computer Science"
            value={program}
            onChangeText={setProgram}
            error={errors.program}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <FormChoice
            label="Year of study"
            value={year}
            options={STUDY_YEARS}
            onChange={setYear}
          />

          <View style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing["2xs"] }}>
              <Text variant="micro" color="textMuted">
                INTERESTS
              </Text>
              <Text variant="caption" color="textSecondary">
                Choose up to six. These shape who and what Campus Connect recommends.
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
              {interestOptions.map((interest) => {
                const selected = selectedInterests.has(interest.name);
                const disabled = !selected && selectedInterests.size >= 6;
                return (
                  <PressableScale
                    key={interest.name}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled }}
                    disabled={disabled}
                    onPress={() => toggleInterest(interest.name)}
                    style={{
                      minHeight: 44,
                      justifyContent: "center",
                      paddingHorizontal: spacing.md,
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: selected ? culture.violet : colors.border,
                      backgroundColor: selected ? culture.violet : colors.surface,
                      opacity: disabled ? 0.45 : 1,
                    }}
                  >
                    <Text
                      variant="label"
                      style={selected ? { color: culture.warmWhite } : undefined}
                    >
                      {selected ? "✓ " : ""}
                      {interest.name}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <FormField
            label="Graduation year"
            placeholder={String(GRAD_MAX)}
            value={gradYear}
            onChangeText={setGradYear}
            error={errors.gradYear}
            keyboardType="number-pad"
            maxLength={4}
          />

          <FormDateTime
            label="Date of birth"
            mode="date"
            value={birthday}
            maximumDate={today}
            placeholder="Not set"
            onChange={setBirthday}
          />

          <FormField
            label="Phone"
            placeholder="+233 20 000 0000"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />

          <FormField
            label="LinkedIn"
            placeholder="https://linkedin.com/in/you"
            value={linkedin}
            onChangeText={setLinkedin}
            error={errors.linkedin}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="URL"
          />

          <FormField
            label="Website"
            placeholder="https://yoursite.com"
            value={website}
            onChangeText={setWebsite}
            error={errors.website}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="URL"
          />

          {formError ? <InlineNotice message={formError} /> : null}

          <Button label="Save changes" loading={saving} onPress={save} />

          <Text variant="caption" color="textMuted">
            Your courses stay synced with your campus records.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
