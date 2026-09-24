import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

import { FormChoice, FormField } from "@/src/components/forms/FormControls";
import {
  Avatar,
  Button,
  EmptyState,
  InlineNotice,
  PressableScale,
  Screen,
  Text,
} from "@/src/components/ui";
import {
  hasSetupBasics,
  PROFILE_INTERESTS,
  STUDY_YEARS,
  type ProfileInterestOption,
  type StudyYear,
} from "@/src/features/profile/setup";
import { useAsync } from "@/src/hooks/useAsync";
import { useCampusLookup } from "@/src/hooks/useCampusRing";
import { useSession } from "@/src/services/SessionContext";
import {
  addInterest,
  fetchRecommendations,
  removeInterest,
  sendConnectionRequest,
  updateProfile,
  type ApiUserCard,
} from "@/src/services/userServices";
import { culture, foregroundOn, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

type Stage = "profile" | "people";
const CARD_HUES = [culture.pink, culture.violet, culture.yellow, culture.lime];

function Progress({ stage }: { stage: Stage }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.xs }} accessibilityLabel={`Step ${stage === "profile" ? 1 : 2} of 2`}>
      {[0, 1].map((index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 4,
            borderRadius: radius.full,
            backgroundColor:
              index <= (stage === "profile" ? 0 : 1) ? culture.violet : colors.border,
          }}
        />
      ))}
    </View>
  );
}

function InterestChip({
  name,
  selected,
  disabled,
  onPress,
}: {
  name: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
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
      <Text variant="label" style={selected ? { color: culture.warmWhite } : undefined}>
        {selected ? "✓ " : ""}
        {name}
      </Text>
    </PressableScale>
  );
}

function PersonCard({
  person,
  index,
  status,
  onConnect,
}: {
  person: ApiUserCard;
  index: number;
  status: "idle" | "sending" | "sent" | "error";
  onConnect: () => void;
}) {
  const { colors } = useTheme();
  const campusOf = useCampusLookup();
  const hue = CARD_HUES[index % CARD_HUES.length];
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
  const sent = status === "sent";

  // Suggestions cross universities, so this card cannot call everyone a
  // classmate. Only a visitor's campus is named -- the same rule UserRow and
  // the home strip follow.
  const campus = campusOf(person.university_id);
  const away = campus ? !campus.isOwn : false;

  return (
    <View
      style={{
        flex: 1,
        minHeight: 230,
        overflow: "hidden",
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={away && campus ? `View ${name}, at ${campus.label}` : `View ${name}`}
        onPress={() => router.push(`/person/${person.user_id}`)}
        style={{
          minHeight: 132,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          backgroundColor: hue,
        }}
      >
        <Avatar uri={person.profile_picture_url ?? undefined} size={76} />
        {typeof person.match_percentage === "number" ? (
          <View
            style={{
              paddingHorizontal: spacing.xs,
              paddingVertical: 3,
              borderRadius: radius.full,
              backgroundColor: "rgba(255,255,255,0.72)",
            }}
          >
            <Text variant="micro" style={{ color: culture.ink }}>
              {person.match_percentage}% MATCH
            </Text>
          </View>
        ) : null}
      </PressableScale>

      <View style={{ flex: 1, padding: spacing.sm, gap: spacing.xs }}>
        <View style={{ flex: 1 }}>
          <Text variant="label" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {person.program ??
              person.profile_headline ??
              (away && campus ? campus.label : "On your campus")}
          </Text>
          {away && campus ? (
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 2,
                paddingHorizontal: spacing.xs,
                paddingVertical: 1,
                borderRadius: radius.full,
                backgroundColor: campus.color,
              }}
            >
              <Text variant="caption" style={{ color: foregroundOn(campus.color), fontSize: 10 }}>
                {campus.label}
              </Text>
            </View>
          ) : null}
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityState={{ disabled: sent || status === "sending", busy: status === "sending" }}
          disabled={sent || status === "sending"}
          onPress={onConnect}
          style={{
            minHeight: 42,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius.full,
            backgroundColor: sent ? colors.surfaceSunken : colors.textPrimary,
          }}
        >
          <Text
            variant="label"
            style={{ color: sent ? colors.textSecondary : colors.background }}
          >
            {status === "sending" ? "Sending…" : sent ? "Sent" : status === "error" ? "Retry" : "Connect"}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

export default function SetupScreen() {
  const { width } = useWindowDimensions();
  const { profile, refresh, signOut, dismissSetup, completeSetup } = useSession();
  const seeded = useRef(false);
  const [stage, setStage] = useState<Stage>(() => (hasSetupBasics(profile) ? "people" : "profile"));
  const [program, setProgram] = useState(profile?.program ?? "");
  const [year, setYear] = useState<StudyYear | "">(profile?.year_of_study ?? "");
  const [headline, setHeadline] = useState(profile?.profile_headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [connections, setConnections] = useState<
    Record<string, "idle" | "sending" | "sent" | "error">
  >({});

  const suggestions = useAsync(
    useCallback(() => fetchRecommendations(12), []),
    []
  );

  useEffect(() => {
    if (!profile || seeded.current) return;
    seeded.current = true;
    setProgram(profile.program ?? "");
    setYear(profile.year_of_study ?? "");
    setHeadline(profile.profile_headline ?? "");
    setBio(profile.bio ?? "");
    const canonicalNames = new Map(
      PROFILE_INTERESTS.map((interest) => [interest.name.toLowerCase(), interest.name])
    );
    setSelected(
      new Set(
        (profile.interests ?? []).map(
          (interest) =>
            canonicalNames.get(interest.interest_name.toLowerCase()) ?? interest.interest_name
        )
      )
    );
    if (hasSetupBasics(profile)) setStage("people");
  }, [profile]);

  const allInterestOptions = useMemo(() => {
    const known = new Set(PROFILE_INTERESTS.map((interest) => interest.name.toLowerCase()));
    const existing = (profile?.interests ?? [])
      .filter((interest) => !known.has(interest.interest_name.toLowerCase()))
      .map((interest) => ({ name: interest.interest_name, type: interest.interest_type }));
    return [...PROFILE_INTERESTS, ...existing] as ProfileInterestOption[];
  }, [profile?.interests]);

  const toggleInterest = (name: string) => {
    Haptics.selectionAsync();
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else if (next.size < 6) next.add(name);
      return next;
    });
    setFieldError(null);
  };

  const saveProfile = async () => {
    if (!program.trim()) {
      setFieldError("Add your programme so we can find classmates and relevant people.");
      return;
    }
    if (!year) {
      setFieldError("Choose your current year of study.");
      return;
    }
    if (selected.size < 3) {
      setFieldError("Pick at least three interests for better matches.");
      return;
    }

    setSaving(true);
    setError(null);
    setFieldError(null);

    const profileResult = await updateProfile({
      program: program.trim(),
      year_of_study: year,
      ...(headline.trim() ? { profile_headline: headline.trim() } : {}),
      ...(bio.trim() ? { bio: bio.trim() } : {}),
    });

    if (!profileResult.success) {
      setSaving(false);
      setError(profileResult.error);
      return;
    }

    const existing = profile?.interests ?? [];
    const selectedKeys = new Set(Array.from(selected, (name) => name.toLowerCase()));
    const existingKeys = new Set(existing.map((interest) => interest.interest_name.toLowerCase()));
    const changes = [
      ...existing
        .filter((interest) => !selectedKeys.has(interest.interest_name.toLowerCase()))
        .map((interest) => removeInterest(interest.interest_id)),
      ...Array.from(selected)
        .filter((name) => !existingKeys.has(name.toLowerCase()))
        .map((name) => {
          const option = allInterestOptions.find(
            (interest) => interest.name.toLowerCase() === name.toLowerCase()
          );
          return addInterest({
            interest_name: name,
            interest_type: option?.type ?? "hobby",
            skill_level: "beginner",
          });
        }),
    ];

    const results = await Promise.all(changes);
    const failed = results.find((result) => !result.success);
    if (failed && !failed.success) {
      setSaving(false);
      setError(failed.error);
      await refresh();
      return;
    }

    await refresh();
    await suggestions.reload();
    setSaving(false);
    setStage("people");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const connect = async (person: ApiUserCard) => {
    const id = person.user_id;
    if (connections[id] === "sending" || connections[id] === "sent") return;
    setConnections((current) => ({ ...current, [id]: "sending" }));
    const result = await sendConnectionRequest(id);
    if (!result.success) {
      setConnections((current) => ({ ...current, [id]: "error" }));
      setError(result.error);
      return;
    }
    setConnections((current) => ({ ...current, [id]: "sent" }));
    setError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const finish = async () => {
    setFinishing(true);
    setError(null);
    await completeSetup();

    // Local completion is authoritative for navigation. Keep the server in
    // sync when it supports this field, but an older deployment must never
    // block the user from entering the app.
    void updateProfile({ is_profile_complete: true }).then((result) => {
      if (result.success) void refresh();
    });

    setFinishing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)/home");
  };

  const skip = () => {
    dismissSetup();
    Haptics.selectionAsync();
    router.replace("/(tabs)/home");
  };

  if (stage === "profile") {
    return (
      <Screen edges={{ bottom: true }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.xl }}
          >
            <Progress stage="profile" />

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={signOut}
              style={{ alignSelf: "flex-end", minHeight: 36, justifyContent: "center" }}
            >
              <Text variant="label" color="textSecondary">Not your account? Sign out</Text>
            </PressableScale>

            <View style={{ gap: spacing.xs }}>
              <Text variant="micro" color="textMuted">STEP 1 OF 2</Text>
              <Text variant="title">Make campus feel like yours.</Text>
              <Text variant="body" color="textSecondary">
                A little context helps us fill your first screen with people and communities that fit.
              </Text>
            </View>

            <View style={{ gap: spacing.lg }}>
              <FormField
                label="Programme"
                placeholder="Computer Science"
                value={program}
                onChangeText={(value) => {
                  setProgram(value);
                  setFieldError(null);
                }}
                autoCapitalize="words"
                autoCorrect={false}
              />

              <FormChoice
                label="Year of study"
                value={year}
                options={STUDY_YEARS}
                onChange={(value) => {
                  if (value) setYear(value);
                  setFieldError(null);
                }}
              />

              <FormField
                label="Headline"
                placeholder="Designer, music lover, always at the library"
                value={headline}
                onChangeText={setHeadline}
                maxLength={255}
                autoCapitalize="sentences"
                hint="This appears beside your name when people discover you."
              />

              <FormField
                label="A bit about you"
                placeholder="What are you here to learn, make or find?"
                value={bio}
                onChangeText={setBio}
                maxLength={1000}
                multiline
                autoCapitalize="sentences"
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <View style={{ gap: spacing["2xs"] }}>
                <Text variant="heading">Pick your interests</Text>
                <Text variant="caption" color="textMuted">
                  Choose 3–6. These shape who we recommend first.
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {allInterestOptions.map((interest) => {
                  const active = selected.has(interest.name);
                  return (
                    <InterestChip
                      key={interest.name}
                      name={interest.name}
                      selected={active}
                      disabled={!active && selected.size >= 6}
                      onPress={() => toggleInterest(interest.name)}
                    />
                  );
                })}
              </View>
              <Text variant="micro" color="textMuted">{selected.size}/6 SELECTED</Text>
            </View>

            {fieldError ? <InlineNotice message={fieldError} /> : null}
            {error ? <InlineNotice message={error} /> : null}
            <Button label="Find my people" loading={saving} onPress={saveProfile} />
            <Button label="Skip for now" variant="ghost" onPress={skip} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    );
  }

  const cardGap = spacing.sm;
  const cardWidth = (width - spacing.lg * 2 - cardGap) / 2;
  const people = suggestions.data ?? [];

  return (
    <Screen edges={{ bottom: true }}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
        <Progress stage="people" />
        <View style={{ gap: spacing.xs }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Back to profile setup"
            onPress={() => setStage("profile")}
            style={{ alignSelf: "flex-start", minHeight: 36, justifyContent: "center" }}
          >
            <Text variant="label" color="textSecondary">← Back</Text>
          </PressableScale>
          <Text variant="micro" color="textMuted">STEP 2 OF 2</Text>
          <Text variant="title">There are already people here for you.</Text>
          <Text variant="body" color="textSecondary">
            These matches use your interests and profile, from your campus and others nearby. Send a few requests now—you can always find more later.
          </Text>
        </View>
        {error ? <InlineNotice message={error} /> : null}
      </View>

      <FlatList
        data={people}
        numColumns={2}
        keyExtractor={(item) => item.user_id}
        columnWrapperStyle={{ gap: cardGap }}
        contentContainerStyle={{ padding: spacing.lg, gap: cardGap, paddingBottom: spacing["3xl"] }}
        showsVerticalScrollIndicator={false}
        refreshing={suggestions.refreshing}
        onRefresh={suggestions.refresh}
        ListEmptyComponent={
          suggestions.loading ? (
            <EmptyState.Loading />
          ) : suggestions.error ? (
            <EmptyState
              tone="error"
              title="Could not find matches"
              body={suggestions.error}
              actionLabel="Try again"
              onAction={suggestions.reload}
            />
          ) : (
            <EmptyState
              title="You’re early"
              body="No matches yet, here or on the other campuses. Your profile is ready for when they arrive."
            />
          )
        }
        renderItem={({ item, index }) => (
          <View style={{ width: cardWidth }}>
            <PersonCard
              person={item}
              index={index}
              status={connections[item.user_id] ?? "idle"}
              onConnect={() => connect(item)}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={{ paddingTop: spacing.lg, gap: spacing.sm }}>
            <Button label="Enter Campus Connect" loading={finishing} onPress={finish} />
            <Button label="Skip for now" variant="ghost" onPress={skip} />
            <Text variant="caption" color="textMuted" style={{ textAlign: "center" }}>
              You can update your interests and profile anytime from You.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
