import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { EmptyState, InlineNotice, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchHiddenPosts, unhidePost } from "@/src/services/moderationServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

function when(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function HiddenPostsScreen() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Restored rows leave the list immediately; the refresh confirms it.
  const [restored, setRestored] = useState<Set<string>>(new Set());

  const hidden = useAsync(
    useCallback(() => fetchHiddenPosts(), []),
    []
  );

  const rows = (hidden.data ?? []).filter((row) => !restored.has(row.post_id));

  const restore = async (postId: string) => {
    setBusy(postId);
    setError(null);
    const result = await unhidePost(postId);
    setBusy(null);

    if (!result.success) {
      setError(result.error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRestored((current) => new Set(current).add(postId));
  };

  return (
    <SettingsShell title="Hidden posts">
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
        <Text variant="body" color="textSecondary">
          Posts you hid. They are only hidden for you, and showing one puts it back in your feed.
        </Text>
      </View>

      {error ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <InlineNotice message={error} />
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.post_id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        refreshControl={
          <RefreshControl
            refreshing={hidden.refreshing}
            onRefresh={() => {
              setRestored(new Set());
              hidden.refresh();
            }}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          hidden.loading ? (
            <SkeletonList count={3} />
          ) : hidden.error ? (
            <EmptyState
              tone="error"
              title="Could not load hidden posts"
              body={hidden.error}
              actionLabel="Try again"
              onAction={hidden.reload}
            />
          ) : (
            <EmptyState
              title="Nothing hidden"
              body="Posts you hide from the feed will collect here."
            />
          )
        }
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.md,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              opacity: busy === item.post_id ? 0.5 : 1,
            }}
          >
            {item.media_url ? (
              <Image
                source={item.media_url}
                contentFit="cover"
                style={{ width: 52, height: 52, borderRadius: radius.sm }}
              />
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radius.sm,
                  backgroundColor: colors.surfaceSunken,
                }}
              />
            )}

            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="body" numberOfLines={2}>
                {item.content || "Media post"}
              </Text>
              <Text variant="caption" color="textMuted">
                Hidden {when(item.hidden_at)}
                {item.is_active ? "" : " · since deleted"}
              </Text>
            </View>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Show this post again"
              disabled={busy === item.post_id}
              onPress={() => restore(item.post_id)}
              style={{
                minHeight: 38,
                paddingHorizontal: spacing.md,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.borderStrong,
              }}
            >
              <Text variant="caption">Show</Text>
            </PressableScale>
          </View>
        )}
      />
    </SettingsShell>
  );
}
