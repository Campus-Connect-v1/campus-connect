import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { ScrollView } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { PostCard } from "@/src/components/feed/PostCard";
import { EmptyState, SkeletonList } from "@/src/components/ui";
import { adaptPost } from "@/src/features/feed/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { useSavedPosts } from "@/src/services/SavedPostsContext";
import { fetchSavedPosts } from "@/src/services/socialServices";
import { spacing } from "@/src/styles/theme";

export default function SavedScreen() {
  const store = useSavedPosts();

  // Asks the server for the saved posts themselves rather than pulling a page
  // of the feed and filtering it. The old approach could only ever show saves
  // that happened to still be in the first fifty feed rows -- anything older
  // was silently missing from a screen whose whole job is not to lose things.
  const feed = useAsync(
    useCallback(() => fetchSavedPosts(50, 0), []),
    []
  );

  const saved = useMemo(
    () => (feed.data ?? []).map(adaptPost).map((post) => ({ ...post, saved: true })),
    [feed.data]
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
