import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomModal from "@/src/components/ui/BottomModal";
import { Avatar, EmptyState, Icon, PressableScale, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { useSession } from "@/src/services/SessionContext";
import {
  fetchStoryFeed,
  fetchStoryViewers,
  viewStory,
  type ApiStory,
  type ApiStoryGroup,
  type ApiStoryViewer,
} from "@/src/services/storyServices";
import { culture, foregroundOn, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** How long a non-video story stays on screen. */
const STORY_MS = 5000;

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

/** The segmented progress bar across the top, one segment per story. */
function Progress({
  count,
  index,
  duration,
  paused,
  onDone,
}: {
  count: number;
  index: number;
  duration: number;
  paused: boolean;
  onDone: () => void;
}) {
  const width = useSharedValue(0);
  const reduced = useReducedMotion();
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    width.value = 0;
    if (paused) return;

    width.value = withTiming(1, { duration });
    const timer = setTimeout(() => done.current(), duration);
    return () => clearTimeout(timer);
  }, [index, duration, paused, width]);

  const style = useAnimatedStyle(() => ({
    width: `${(reduced ? 1 : width.value) * 100}%`,
  }));

  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 2.5,
            borderRadius: radius.full,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        >
          {i < index ? (
            <View style={{ flex: 1, backgroundColor: culture.warmWhite }} />
          ) : i === index ? (
            <Animated.View
              style={[{ height: "100%", backgroundColor: culture.warmWhite }, style]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function VideoStory({ uri, paused }: { uri: string; paused: boolean }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.play();
  });

  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [paused, player]);

  return (
    <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls={false} />
  );
}

export default function StoryViewerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useSession();

  const feed = useAsync(
    useCallback(() => fetchStoryFeed(50, 0), []),
    []
  );

  const group: ApiStoryGroup | undefined = useMemo(
    () => (feed.data ?? []).find((g) => g.author.user_id === userId),
    [feed.data, userId]
  );

  // Memoised because it feeds a dependency array; a fresh [] each render
  // would restart the "open on first unseen" effect on every frame.
  const stories = useMemo(() => group?.stories ?? [], [group]);
  // Open on the first unseen story rather than always at the start, which is
  // what makes a rail of half-watched stories usable.
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || stories.length === 0) return;
    started.current = true;
    const firstUnseen = stories.findIndex((s) => !s.has_viewed);
    setIndex(firstUnseen === -1 ? 0 : firstUnseen);
  }, [stories]);

  const current: ApiStory | undefined = stories[index];
  const isOwn = group?.author.user_id === user?.id;

  useEffect(() => {
    if (current) viewStory(current.story_id);
  }, [current]);

  // Who viewed this story is the author's own metric — only fetched for
  // stories that belong to the signed-in user, one call per story shown.
  const [viewers, setViewers] = useState<ApiStoryViewer[] | null>(null);
  const [viewersOpen, setViewersOpen] = useState(false);
  const viewersSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    setViewers(null);
    if (!current || !isOwn) return;
    let cancelled = false;
    fetchStoryViewers(current.story_id).then((result) => {
      if (!cancelled && result.success) setViewers(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [current, isOwn]);

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 < stories.length) return i + 1;
      router.back();
      return i;
    });
  }, [stories.length]);

  const back = () => setIndex((i) => Math.max(0, i - 1));

  if (feed.loading) {
    return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  }

  if (!group || stories.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          title="No stories here"
          body="They may have expired. Stories disappear after a day."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  // The author picked this colour, so the text follows it rather than assuming
  // a dark ground: white on lime is 1.12:1 and cannot be read at all.
  const textStoryBackground = current?.background_color ?? culture.violet;
  const authorName = [group.author.first_name, group.author.last_name].filter(Boolean).join(" ");

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* The story itself */}
      <View style={{ flex: 1 }}>
        {current?.story_type === "video" && current.media_url ? (
          <VideoStory uri={current.media_url} paused={paused} />
        ) : current?.story_type === "image" && current.media_url ? (
          <Image
            source={current.media_url}
            contentFit="contain"
            style={{ flex: 1 }}
            accessibilityLabel={`Story from ${authorName}`}
          />
        ) : current?.story_type === "repost" && current.reposted_post ? (
          <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl }}>
            <View
              style={{
                borderRadius: radius.lg,
                overflow: "hidden",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              {current.reposted_post.media_url ? (
                <Image
                  source={current.reposted_post.media_url}
                  contentFit="cover"
                  style={{ width: "100%", height: 320 }}
                />
              ) : null}
              <View style={{ padding: spacing.md, gap: spacing.xs }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <Avatar
                    uri={current.reposted_post.author.profile_picture_url ?? undefined}
                    size={28}
                  />
                  <Text variant="label" onMedia>
                    {[
                      current.reposted_post.author.first_name,
                      current.reposted_post.author.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </Text>
                </View>
                {current.reposted_post.content ? (
                  <Text variant="body" onMedia numberOfLines={6}>
                    {current.reposted_post.content}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: spacing["2xl"],
              backgroundColor: textStoryBackground,
            }}
          >
            <Text
              variant="title"
              style={{ textAlign: "center", color: foregroundOn(textStoryBackground) }}
            >
              {current?.content}
            </Text>
          </View>
        )}
      </View>

      {/* Tap zones: the left half of the screen goes back, the right half
          advances — no dead zone in the middle. Holding anywhere pauses. */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: "row" }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous story"
          onPress={back}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={180}
          style={{ flex: 1 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next story"
          onPress={advance}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          delayLongPress={180}
          style={{ flex: 1 }}
        />
      </View>

      {/* Chrome */}
      <View
        style={{
          position: "absolute",
          top: insets.top + spacing.xs,
          left: spacing.md,
          right: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Progress
          count={stories.length}
          index={index}
          duration={STORY_MS}
          paused={paused}
          onDone={advance}
        />

        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Avatar uri={group.author.profile_picture_url ?? undefined} size={34} />
          <View style={{ flex: 1 }}>
            <Text variant="label" onMedia>
              {isOwn ? "Your story" : authorName}
            </Text>
            <Text variant="caption" onMedia style={{ opacity: 0.8 }}>
              {current ? timeAgo(current.created_at) : ""}
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close stories"
            onPress={() => router.back()}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={21} color={colors.onMedia} />
          </PressableScale>
        </View>
      </View>

      {isOwn && current ? (
        <View
          style={{
            position: "absolute",
            left: spacing.md,
            right: spacing.md,
            bottom: insets.bottom + spacing.md,
            alignItems: "center",
          }}
          pointerEvents="box-none"
        >
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={
              viewers === null
                ? "See who viewed this story"
                : `Seen by ${viewers.length} ${viewers.length === 1 ? "person" : "people"}`
            }
            onPress={() => setViewersOpen(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing["2xs"],
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            <Icon name="visible" size={16} color={colors.onMedia} />
            <Text variant="caption" onMedia>
              {viewers === null
                ? "Seen by…"
                : viewers.length === 0
                  ? "No views yet"
                  : `Seen by ${viewers.length}`}
            </Text>
          </PressableScale>
        </View>
      ) : null}

      <BottomModal
        ref={viewersSheetRef}
        state={viewersOpen}
        snapPoints={["50%"]}
        onChange={(i) => setViewersOpen(i >= 0)}
      >
        <Text variant="heading" style={{ marginBottom: spacing.sm }}>
          {viewers?.length === 1 ? "1 view" : `${viewers?.length ?? 0} views`}
        </Text>
        <BottomSheetFlatList
          data={viewers ?? []}
          keyExtractor={(item) => item.user_id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text variant="body" color="textMuted">
              No one has viewed this story yet.
            </Text>
          }
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingVertical: spacing.sm,
              }}
            >
              <Avatar uri={item.profile_picture_url ?? undefined} size={40} />
              <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                {[item.first_name, item.last_name].filter(Boolean).join(" ")}
              </Text>
              <Text variant="caption" color="textMuted">
                {timeAgo(item.viewed_at)}
              </Text>
            </View>
          )}
        />
      </BottomModal>
    </View>
  );
}
