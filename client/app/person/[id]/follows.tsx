import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { FollowButton } from "@/src/components/social/FollowButton";
import { UserRow } from "@/src/components/social/UserRow";
import { EmptyState, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchFollowers, fetchFollowing } from "@/src/services/userServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

type Mode = "followers" | "following";

export default function FollowsScreen() {
  const { colors } = useTheme();
  const { id, tab, name } = useLocalSearchParams<{
    id: string;
    tab?: Mode;
    name?: string;
  }>();

  const [mode, setMode] = useState<Mode>(tab === "following" ? "following" : "followers");

  const people = useAsync(
    useCallback(() => (mode === "followers" ? fetchFollowers(id) : fetchFollowing(id)), [id, mode]),
    [id, mode]
  );

  return (
    <SettingsShell title={name || "People"}>
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          padding: 4,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
        }}
      >
        {(["followers", "following"] as Mode[]).map((value) => {
          const active = value === mode;
          return (
            <PressableScale
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setMode(value)}
              style={{
                flex: 1,
                minHeight: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.full,
                backgroundColor: active ? colors.textPrimary : "transparent",
              }}
            >
              <Text variant="label" color={active ? "background" : "textSecondary"}>
                {value === "followers" ? "Followers" : "Following"}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <FlatList
        data={people.data ?? []}
        keyExtractor={(item) => item.user_id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        refreshControl={
          <RefreshControl
            refreshing={people.refreshing}
            onRefresh={people.refresh}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          people.loading ? (
            <SkeletonList count={4} />
          ) : people.error ? (
            <EmptyState
              tone="error"
              title="Could not load this list"
              body={people.error}
              actionLabel="Try again"
              onAction={people.reload}
            />
          ) : (
            <EmptyState
              title={mode === "followers" ? "No followers yet" : "Not following anyone yet"}
              body={
                mode === "followers"
                  ? "People who follow this profile will show up here."
                  : "Profiles they follow will show up here."
              }
            />
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
            // The row already carries the viewer's relationship, so the button
            // does not need its own request per row.
            trailing={
              <FollowButton userId={item.user_id} compact initialFollowing={item.is_following} />
            }
            onPress={() => router.push({ pathname: "/person/[id]", params: { id: item.user_id } })}
          />
        )}
      />
    </SettingsShell>
  );
}
