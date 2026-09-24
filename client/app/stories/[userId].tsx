import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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

import { Avatar, EmptyState, Icon, PressableScale, Text } from "@/src/components/ui";
import { StoryViewers } from "@/src/components/stories/StoryViewers";
import { useAsync } from "@/src/hooks/useAsync";
import { useSession } from "@/src/services/SessionContext";
import {
  fetchStoryFeed,
  fetchUserStories,
  viewStory,
  type ApiStory,
  type ApiStoryGroup,
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

  /**
   * Falls back to this person's own stories when they are not in the feed.
   *
   * The story feed only carries people whose stories reach you through the
   * feed's own rules, so opening a profile's story directly -- from their
   * avatar, or from a notification -- found nothing and showed "No stories
   * here" for someone who plainly had one.
   */
  const direct = useAsync(
    useCallback(() => fetchUserStories(userId), [userId]),
    [userId]
  );

  const group: ApiStoryGroup | undefined = useMemo(() => {
    const fromFeed = (feed.data ?? []).find((g) => g.author.user_id === userId);
    if (fromFeed) return fromFeed;

    const stories = direct.data ?? [];
    if (stories.length === 0) return undefined;

    // The direct endpoint returns stories, not a group, so the author is
    // assembled from the first one.
    const first = stories[0] as (typeof stories)[number] & {
      author?: ApiStoryGroup["author"];
    };

    return {
      author: first.author ?? {
        user_id: userId,
        first_name: "",
        last_name: null,
        profile_picture_url: null,
      },
      story_count: stories.length,
      unseen_count: stories.filter((story) => !story.has_viewed).length,
      all_viewed: stories.every((story) => story.has_viewed),
      is_own: false,
      latest_story_at: stories[stories.length - 1]?.created_at ?? "",
      stories,
    };
  }, [feed.data, direct.data, userId]);

  // Memoised because it feeds a dependency array; a fresh [] each render
  // would restart the "open on first unseen" effect on every frame.
  const stories = useMemo(() => group?.stories ?? [], [group]);
  // Open on the first unseen story rather than always at the start, which is
  // what makes a rail of half-watched stories usable.
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const started = useRef(false);

  useFocusEffect(
    useCallback(() => {
      setPaused(false);
      return () => setPaused(true);
    }, [])
  );

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

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 < stories.length) return i + 1;
      router.back();
      return i;
    });
  }, [stories.length]);

  const back = () => setIndex((i) => Math.max(0, i - 1));

  if (feed.loading || direct.loading) {
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
            {/*
              The sharer's own caption, above the post being shared.

              It was saved correctly and simply never rendered: this branch
              showed reposted_post.content (the ORIGINAL post's text) while
              current.content (what the sharer typed) was only rendered in the
              plain-text-story branch below. So the share went out and the
              comment on it vanished.
            */}
            {current.content ? (
              <Text variant="body" onMedia numberOfLines={4} style={{ marginBottom: spacing.md }}>
                {current.content}
              </Text>
            ) : null}

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
          <PressableScale
            accessibilityRole="link"
            accessibilityLabel={isOwn ? "Open your profile" : `Open ${authorName}'s profile`}
            onPress={() => {
              router.push(isOwn ? "/(tabs)/profile" : `/person/${group.author.user_id}`);
            }}
            style={{
              flex: 1,
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
            }}
          >
            <Avatar uri={group.author.profile_picture_url ?? undefined} size={34} />
            <View style={{ flex: 1 }}>
              <Text variant="label" onMedia>
                {isOwn ? "Your story" : authorName}
              </Text>
              <Text variant="caption" onMedia style={{ opacity: 0.8 }}>
                {current ? timeAgo(current.created_at) : ""}
              </Text>
            </View>
          </PressableScale>

          {isOwn && current ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="See who viewed this story"
              onPress={() => {
                // Paused while the sheet is up, so the story does not advance
                // out from under the list the user is reading.
                setPaused(true);
                setShowViewers(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing["3xs"],
                minHeight: 44,
                paddingHorizontal: spacing.xs,
              }}
            >
              <Icon name="visible" size={18} color={colors.onMedia} />
              <Text variant="caption" onMedia>
                Views
              </Text>
            </PressableScale>
          ) : null}

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
        <StoryViewers
          storyId={current.story_id}
          visible={showViewers}
          onClose={() => {
            setShowViewers(false);
            setPaused(false);
          }}
        />
      ) : null}
    </View>
  );
}
