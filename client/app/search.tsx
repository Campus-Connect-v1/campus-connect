import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, TextInput, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { UserRow } from "@/src/components/social/UserRow";
import { EmptyState, Icon, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { FollowButton } from "@/src/components/social/FollowButton";
import { searchUsers, type ApiUserCard } from "@/src/services/userServices";
import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const MIN_QUERY = 2;

export default function SearchScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiUserCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const term = query.trim();

  useEffect(() => {
    if (term.length < MIN_QUERY) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    // Debounced: one request per pause, not per keystroke, and the in-flight
    // result is discarded if the term has moved on.
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      const result = await searchUsers(term);
      if (cancelled) return;

      setResults(result.success ? result.data : []);
      setError(result.success ? null : result.error);
      setLoading(false);
      setSearched(true);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  return (
    <SettingsShell title="Find people">
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            minHeight: 50,
            paddingHorizontal: spacing.md,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Icon name="search" size={19} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Search for people by name or programme"
            placeholder="Name or programme"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            returnKeyType="search"
            style={[inputTextStyle(), { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
          />
          {query ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery("")}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="close" size={16} color={colors.textMuted} />
            </PressableScale>
          ) : null}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.user_id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        ListEmptyComponent={
          loading ? (
            <SkeletonList count={4} />
          ) : error ? (
            <EmptyState tone="error" title="Search failed" body={error} />
          ) : searched ? (
            <EmptyState
              title="Nobody matches that"
              body="Try a first name, a surname, or a programme."
            />
          ) : (
            <View style={{ paddingHorizontal: spacing["2xl"], paddingTop: spacing.xl }}>
              <Text variant="body" color="textMuted" style={{ textAlign: "center" }}>
                Search across every campus by name or programme.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <UserRow
            person={{
              id: item.user_id,
              name: [item.first_name, item.last_name].filter(Boolean).join(" ").trim(),
              avatar: item.profile_picture_url,
              detail: item.profile_headline ?? item.program,
              universityId: item.university_id,
            }}
            trailing={<FollowButton userId={item.user_id} compact />}
            onPress={() => router.push({ pathname: "/person/[id]", params: { id: item.user_id } })}
          />
        )}
      />
    </SettingsShell>
  );
}
