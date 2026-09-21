import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { ScrollView } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { PostCard } from "@/src/components/feed/PostCard";
import { EmptyState, SkeletonList } from "@/src/components/ui";
import { adaptPost } from "@/src/features/feed/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { useSavedPosts } from "@/src/services/SavedPostsContext";
import { fetchFeed } from "@/src/services/socialServices";
import { spacing } from "@/src/styles/theme";

export default function SavedScreen() {
  const store = useSavedPosts();
  const feed = useAsync(
    useCallback(() => fetchFeed(50, 0), []),
    []
  );

  // Saves are device-local ids, so the feed is the source of the post bodies
  // and the store decides which of them belong here. A saved post that has
  // since dropped out of the feed window simply will not appear.
  const saved = useMemo(
    () =>
      (feed.data ?? [])
        .map(adaptPost)
        .filter((post) => store.ids.has(post.id))
        .map((post) => ({ ...post, saved: true })),
    [feed.data, store.ids]
  );

  return (
    <SettingsShell title="Saved">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
      >
        {feed.loading ? (
          <SkeletonList count={2} />
        ) : saved.length ? (
          saved.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onToggleLike={() => {}}
              onToggleSave={store.toggle}
            />
          ))
        ) : (
          <EmptyState
            title="Nothing saved yet"
            body="Posts you save will stay here on this device so you can find them again."
            actionLabel="Browse the feed"
            onAction={() => router.replace("/(tabs)/home")}
          />
        )}
      </ScrollView>
    </SettingsShell>
  );
}
