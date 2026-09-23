import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard } from "@/src/components/feed/PostCard";
import { PostOptionsSheet } from "@/src/components/feed/PostOptionsSheet";
import {
  Button,
  EmptyState,
  SkeletonList,
  GraphicOverlay,
  Media,
  PressableScale,
  Tag,
  Text,
  Icon,
} from "@/src/components/ui";
import { adaptPost } from "@/src/features/feed/adapt";
import { adaptProfile } from "@/src/features/profile/adapt";
import { type FeedPost } from "@/src/features/feed/types";
import { useAsync } from "@/src/hooks/useAsync";
import { useSavedPosts } from "@/src/services/SavedPostsContext";
import { useSession } from "@/src/services/SessionContext";
import { fetchPostsByAuthor } from "@/src/services/socialServices";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** How long a loaded profile is treated as fresh when the tab regains focus. */
const STALE_AFTER_MS = 30_000;

/** No cover column exists on users yet, so every profile shares this backdrop. */
const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=75&auto=format&fit=crop";

/**
 * One figure in the profile's stat row.
 *
 * Pressable rather than decorative: a count with no way to see what it counts
 * is a dead end, and these are the three things someone opens a profile to
 * look through. Falls back to plain text when there is nowhere to go, so the
 * control never lies about being tappable.
 */
function Stat({
  value,
  label,
  onPress,
}: {
  value: number;
  label: string;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Text variant="heading">{value.toLocaleString()}</Text>
      <Text variant="micro" color="textMuted">
        {label}
      </Text>
    </>
  );

  if (!onPress) return <View style={{ gap: 2, alignItems: "center" }}>{body}</View>;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${value} ${label}`}
      onPress={onPress}
      hitSlop={10}
      style={{ gap: 2, alignItems: "center", minWidth: 72 }}
    >
      {body}
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user, profile, stats, university, loadingProfile, profileError, refresh } = useSession();
  const store = useSavedPosts();
  // The three-dot control rendered on every card here but had no handler, so
  // tapping it did nothing -- no delete, no save, no report, on your own posts.
  const [options, setOptions] = useState<FeedPost | null>(null);
  // Locally removed so a delete leaves immediately rather than waiting for a
  // refetch this screen does not do.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList<FeedPost>>(null);

  const heroHeight = Math.max(380, height * 0.52);

  // Refetched on focus so an edit made in settings shows on the way back, but
  // rate-limited: without the guard every tab switch costs two API calls, and
  // a profile does not change between two taps a second apart.
  const lastFetched = useRef(0);
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetched.current < STALE_AFTER_MS) return;
      lastFetched.current = Date.now();
      refresh();
    }, [refresh])
  );

  const display = useMemo(() => (profile ? adaptProfile(profile) : null), [profile]);

  const userId = user?.id;
  const posts = useAsync(
    useCallback(
      () =>
        userId ? fetchPostsByAuthor(userId) : Promise.resolve({ success: true as const, data: [] }),
      [userId]
    ),
    [userId]
  );

  const myPosts = useMemo(
    () => (posts.data ?? []).map(adaptPost).filter((post) => !removedIds.has(post.id)),
    [posts.data, removedIds]
  );

  if (loadingProfile && !display) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EmptyState.Loading />
      </View>
    );
  }

  if (!display) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          tone="error"
          title="Could not load your profile"
          body={profileError ?? "Check your connection and try again."}
          actionLabel="Try again"
          onAction={refresh}
        />
      </View>
    );
  }

  const meta = [display.year, display.programme].filter(Boolean).join(" · ");

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {options ? (
        <PostOptionsSheet
          postId={options.id}
          authorName={options.author.name}
          isOwnPost={options.author.id === user?.id}
          saved={store.isSaved(options.id)}
          visible
          onClose={() => setOptions(null)}
          onRemoved={(id) => setRemovedIds((current) => new Set(current).add(id))}
          onToggleSave={store.toggle}
        />
      ) : null}

      <FlatList
        ref={listRef}
        data={myPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        refreshControl={
          <RefreshControl
            refreshing={loadingProfile}
            onRefresh={() => {
              lastFetched.current = Date.now();
              refresh();
              posts.refresh();
            }}
            tintColor={colors.textMuted}
            colors={[culture.violet]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={{ height: heroHeight }}>
              <Media
                source={display.avatar ?? COVER_FALLBACK}
                scrim="full"
                rounded="none"
                style={{ flex: 1 }}
                accessibilityIgnoresInvertColors
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    padding: spacing.xl,
                    gap: spacing.sm,
                  }}
                >
                  <Text variant="display" onMedia>
                    {display.name}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: spacing.md,
                    }}
                  >
                    {meta ? (
                      <View
                        style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}
                      >
                        <Icon name="course" size={13} color={colors.onMedia} />
                        <Text variant="caption" onMedia>
                          {meta}
                        </Text>
                      </View>
                    ) : null}
                    <Text variant="caption" onMedia>
                      {display.age ? `${display.age} · ` : ""}@{display.handle}
                    </Text>
                  </View>

                  {display.interests.length ? (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.xs,
                        marginTop: spacing["2xs"],
                      }}
                    >
                      {display.interests.map((interest) => (
                        <Tag key={interest} label={interest} onMedia />
                      ))}
                    </View>
                  ) : null}
                </View>
              </Media>
            </View>

            <View
              style={{ backgroundColor: colors.background, padding: spacing.xl, gap: spacing.lg }}
            >
              <Button
                label="Edit profile"
                icon={<Icon name="edit" size={17} color={colors.accentFg} />}
                onPress={() => router.push("/settings/account")}
              />

              {/* Centred and evenly spread, so the three read as one unit
                  rather than as a left-aligned list. */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-evenly",
                  alignItems: "flex-start",
                }}
              >
                <Stat
                  value={myPosts.length}
                  label="Posts"
                  // Already on screen below; scrolling to them beats a
                  // navigation that shows the same list again.
                  onPress={() => listRef.current?.scrollToOffset({ offset: heroHeight, animated: true })}
                />
                <Stat
                  value={stats?.connections ?? 0}
                  label="Connections"
                  onPress={() => router.push("/(tabs)/connect")}
                />
                <Stat
                  value={stats?.groups ?? 0}
                  label="Groups"
                  onPress={() => router.push("/(tabs)/events")}
                />
              </View>

              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

              {display.bio ? (
                <Text variant="body" color="textSecondary">
                  {display.bio}
                </Text>
              ) : (
                <Text variant="body" color="textMuted">
                  No bio yet. Add one so people know what you are around for.
                </Text>
              )}

              <View style={{ gap: spacing.sm }}>
                <Text variant="micro" color="textMuted">
                  ABOUT YOU
                </Text>
                <View style={{ gap: spacing.sm }}>
                  {university || display.programme ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Icon name="campus" size={18} color={colors.textMuted} />
                      <Text variant="body">
                        {[university?.label, display.programme].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Icon name="profile" size={18} color={colors.textMuted} />
                    <Text variant="body">
                      {display.age ? `${display.age} years old · ` : ""}@{display.handle}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Icon name="message" size={18} color={colors.textMuted} />
                    <Text selectable variant="body">
                      {display.email}
                    </Text>
                  </View>
                </View>
              </View>

              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Open your campus activity"
                onPress={() => router.push("/(tabs)/events")}
                style={{
                  minHeight: 176,
                  borderRadius: radius.lg,
                  overflow: "hidden",
                  backgroundColor: culture.lime,
                  padding: spacing.lg,
                  justifyContent: "space-between",
                }}
              >
                <GraphicOverlay color={culture.ink} pattern="orbit" opacity={0.13} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Icon name="campus" size={18} color={culture.ink} />
                  <Text variant="micro" style={{ color: culture.ink }}>
                    YOUR CAMPUS YEAR
                  </Text>
                </View>
                <View style={{ gap: spacing["2xs"], maxWidth: 245 }}>
                  <Text variant="title" style={{ color: culture.ink }}>
                    {stats?.events ?? 0} events. {stats?.groups ?? 0} groups.
                  </Text>
                  <Text variant="caption" style={{ color: culture.ink, opacity: 0.72 }}>
                    Your saved plans and communities, all in one place.
                  </Text>
                </View>
              </PressableScale>
            </View>

            <Text
              variant="micro"
              color="textMuted"
              style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}
            >
              Posts
            </Text>
          </>
        }
        ListEmptyComponent={
          posts.loading ? (
            <SkeletonList count={2} />
          ) : (
            <EmptyState
              compact
              title="Nothing posted yet"
              body="Your posts will show up here once you share something."
              actionLabel="Write a post"
              onAction={() => router.push("/compose/post")}
            />
          )
        }
        renderItem={({ item }) => (
          <PostCard
            post={{ ...item, saved: store.isSaved(item.id) }}
            onToggleLike={() => {}}
            onToggleSave={store.toggle}
            onOpenOptions={setOptions}
          />
        )}
      />

      {/* Floating over media, so it needs its own contrast, not the page's. */}
      <View
        style={{
          position: "absolute",
          top: insets.top + spacing.xs,
          left: spacing.lg,
          right: spacing.lg,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View />

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push("/settings")}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(7,18,25,0.45)",
          }}
        >
          <Icon name="settings" size={20} color={colors.onMedia} />
        </PressableScale>
      </View>
    </View>
  );
}
