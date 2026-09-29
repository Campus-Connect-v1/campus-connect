import { useEvent } from "expo";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View, type GestureResponderEvent } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Avatar, Loader, Media, PressableScale, Text, Icon, type IconName } from "@/src/components/ui";
import { MentionText } from "@/src/components/social/MentionText";
import { PollCard } from "./PollCard";
import type { FeedPost } from "@/src/features/feed/types";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface Props {
  post: FeedPost;
  /**
   * True when this is the card the reader is actually looking at.
   *
   * Only this card's video plays. Driven by the list's viewability callback
   * rather than by the card itself, because a card can stay mounted well
   * outside the viewport and those must stay silent.
   *
   * Defaults to false, so a surface that does not manage it -- a profile
   * grid, a saved list -- simply has videos that wait to be tapped instead of
   * several playing at once.
   */
  active?: boolean;
  /**
   * Saved state as a separate primitive, overriding `post.saved`.
   *
   * This exists so a list does not have to spread a new post object per row to
   * inject it. `{ ...item.post, saved }` builds a fresh object on every render,
   * which defeats the memo below completely -- the props never compare equal,
   * so every visible card re-rendered whenever anything on the screen changed.
   * A boolean compares by value and costs nothing.
   */
  saved?: boolean;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  /** Opens the overflow menu. Omitted where the menu does not apply. */
  onOpenOptions?: (post: FeedPost) => void;
  /**
   * False on the post's own detail screen, where tapping the card or the
   * comment pill would navigate to the screen you are already on.
   */
  linkToDetail?: boolean;
}

function StatPill({
  icon,
  label,
  active,
  tint,
  foreground,
  accessibilityLabel,
  onPress,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  tint: string;
  foreground: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing["2xs"],
        paddingHorizontal: spacing.sm,
        minHeight: 38,
        borderRadius: radius.full,
        // Translucent over media rather than solid: the photo stays readable
        // through the control, which is what keeps these from looking pasted on.
        backgroundColor: active ? tint : "rgba(20,16,12,0.45)",
      }}
    >
      {/* Filled when active, so a like reads as on/off at a glance instead of
          relying on a colour shift the eye has to compare against memory. */}
      <Icon
        name={icon}
        size={15}
        filled={Boolean(active)}
        color={active ? foreground : colors.onMedia}
      />
      <Text variant="caption" style={active ? { color: foreground } : undefined} onMedia={!active}>
        {label}
      </Text>
    </PressableScale>
  );
}

function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

/**
 * The feed's video: it plays itself, and the controls are gestures.
 *
 * `active` comes from the list's viewability callback, not from this
 * component. Every mounted card would otherwise start its own video and you
 * would hear three at once; only the card the reader is actually looking at
 * plays.
 *
 * Muted to begin with, always. Autoplaying sound into a lecture hall is the
 * fastest way to make someone close the app, so sound is something the reader
 * turns on with a tap rather than something that happens to them.
 *
 * No nativeControls. A transport bar over a feed video is chrome the reader
 * never asked for; holding and releasing is faster than finding a pause
 * button, and it leaves the picture uncovered the rest of the time.
 */
function PostVideo({
  uri,
  accessibilityLabel,
  active,
}: {
  uri: string;
  accessibilityLabel: string;
  active: boolean;
}) {
  const { colors } = useTheme();
  const [muted, setMuted] = useState(true);
  /** Set while a finger is down, so the badge can say what the hold is doing. */
  const [gesture, setGesture] = useState<"none" | "paused" | "fast">("none");

  const player = useVideoPlayer(uri, (instance) => {
    // Feed video loops: a fifteen second clip that stops dead is a card that
    // looks broken rather than finished.
    instance.loop = true;
    instance.muted = true;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });

  // Play and pause follow the list, not the component's lifetime: a card can
  // stay mounted well outside the viewport, and those must be silent.
  useEffect(() => {
    if (active) player.play();
    else {
      player.pause();
      // Back to the start, so returning to a card begins the clip again
      // rather than resuming something half-watched.
      player.currentTime = 0;
    }
  }, [active, player]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const hold = (mode: "paused" | "fast") => {
    setGesture(mode);
    if (mode === "paused") player.pause();
    else player.playbackRate = 2;
  };

  const release = () => {
    setGesture("none");
    player.playbackRate = 1;
    if (active) player.play();
  };

  return (
    <View
      style={{ height: 460, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" }}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
        // Android's default SurfaceView renders in its own compositor layer
        // outside normal view clipping, so with more than one video mounted
        // in the same scrolling list it can bleed over neighbouring cards.
        // textureView composites like an ordinary view instead.
        surfaceType="textureView"
        accessibilityLabel={accessibilityLabel}
      />

      {/* Two zones. The right third is the 2x zone, the rest pauses -- the
          same split TikTok and YouTube use, so the gesture is already learned.
          delayLongPress is short because this is a hold, not a long press:
          the default 500ms feels broken when you expect it to pause on
          contact. */}
      <View style={[StyleSheet.absoluteFillObject, { flexDirection: "row" }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={muted ? "Unmute video" : "Mute video"}
          onPress={() => setMuted((current) => !current)}
          onLongPress={() => hold("paused")}
          onPressOut={release}
          delayLongPress={160}
          style={{ flex: 2 }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold to play at double speed"
          onPress={() => setMuted((current) => !current)}
          onLongPress={() => hold("fast")}
          onPressOut={release}
          delayLongPress={160}
          style={{ flex: 1 }}
        />
      </View>

      {/* What the hold is doing. Without it a paused video is indistinguishable
          from one that has stalled on a bad connection. */}
      {gesture !== "none" ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.full,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <Text variant="label" style={{ color: colors.onMedia }}>
              {gesture === "fast" ? "2x" : "Paused"}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Sound state, always visible: a muted video with no indicator just
          looks like a video with no audio. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: spacing.sm,
          right: spacing.sm,
          width: 30,
          height: 30,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        <Icon name={muted ? "soundOff" : "soundOn"} size={15} color={colors.onMedia} />
      </View>

      {status === "loading" || status === "idle" ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center" }]}
        >
          <Loader size={28} color={colors.onMedia} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * The post IS the photo. Header and actions float on top of it rather than
 * sitting in chrome above and below, so a scroll reads as a stack of images
 * rather than a stack of boxes.
 *
 * Text-only posts fall back to a tinted card, since there is no photo to float
 * over — the topic hue does the work the image would have done.
 */
export const PostCard = memo(function PostCard({
  post,
  active = false,
  saved,
  onToggleLike,
  onToggleSave,
  onOpenOptions,
  linkToDetail = true,
}: Props) {
  const { colors } = useTheme();
  // Falls back to the flag on the post, for callers that already carry it.
  const isSaved = saved ?? post.saved;
  const openComments = linkToDetail ? () => router.push(`/post/${post.id}`) : undefined;

  // On the post's own detail screen there is nowhere left for a tap on the
  // photo to navigate to, so it opens a full-screen view of just the image
  // instead -- header, caption and actions fade away rather than sitting on
  // top of a photo that is finally shown at its own size.
  const canExpandMedia = !linkToDetail;
  const [expanded, setExpanded] = useState(false);
  const chromeProgress = useSharedValue(0);

  useEffect(() => {
    chromeProgress.value = withTiming(expanded ? 1 : 0, { duration: 240 });
  }, [expanded, chromeProgress]);

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: 1 - chromeProgress.value,
    transform: [{ translateY: chromeProgress.value * 28 }],
  }));

  const openAuthor = (event: GestureResponderEvent) => {
    // The card itself opens the post. Stop that parent press so tapping the
    // identity row has exactly one destination: the author's profile.
    event.stopPropagation();
    router.push({ pathname: "/person/[id]", params: { id: post.author.id } });
  };

  // Photos float header/caption/actions on top of the image via a scrim, so
  // that text needs light-on-dark styling. Video keeps its own native
  // transport controls at the bottom of the frame -- overlaying our chrome
  // there would collide with them -- so its header sits above the frame on
  // the ordinary card background instead, and wants ordinary text styling.
  const overlaysMedia = Boolean(post.image) && post.mediaType !== "video";

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={`View ${post.author.name}'s profile`}
        onPress={openAuthor}
        style={{
          flex: 1,
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <Avatar uri={post.author.avatar} size={38} />
        <View style={{ flex: 1 }}>
          <Text variant="label" onMedia={overlaysMedia}>
            {post.author.name}
          </Text>
          <Text
            variant="caption"
            color="textMuted"
            onMedia={overlaysMedia}
            style={overlaysMedia ? { opacity: 0.85 } : undefined}
          >
            {post.author.hall} · {post.postedAt}
          </Text>
        </View>
      </PressableScale>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Options for ${post.author.name}'s post`}
        onPress={() => onOpenOptions?.(post)}
        style={{ minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center" }}
      >
        <Icon name="more" size={18} color={overlaysMedia ? colors.onMedia : colors.textMuted} />
      </PressableScale>
    </View>
  );

  const actions = (
    <View style={{ flexDirection: "row", gap: spacing.xs }}>
      <StatPill
        icon="like"
        label={compact(post.likes)}
        active={post.liked}
        tint={culture.pink}
        foreground={culture.ink}
        accessibilityLabel={post.liked ? "Unlike" : "Like"}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggleLike(post.id);
        }}
      />
      <StatPill
        icon="message"
        label={compact(post.comments)}
        tint={culture.violet}
        foreground={culture.warmWhite}
        accessibilityLabel={`${post.comments} comments`}
        onPress={openComments ?? (() => {})}
      />
      <View style={{ flex: 1 }} />
      <StatPill
        icon="save"
        label={isSaved ? "Saved" : "Save"}
        active={isSaved}
        tint={culture.yellow}
        foreground={culture.ink}
        accessibilityLabel={isSaved ? "Remove from saved" : "Save"}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggleSave(post.id);
        }}
      />
    </View>
  );

  // A poll renders its options in place of a photo. Without a pollId (the feed
  // does not return one yet) it falls back to the plain text card below, which
  // still shows the question.
  if (post.pollId) {
    return (
      <PressableScale
        accessibilityRole={linkToDetail ? "button" : "none"}
        accessibilityLabel={linkToDetail ? `Open ${post.author.name}'s poll` : undefined}
        disabled={!linkToDetail}
        onPress={openComments}
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.lg,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          gap: spacing.sm,
        }}
      >
        {header}
        <MentionText variant="body" content={post.caption} />
        <PollCard pollId={post.pollId} />
        {actions}
      </PressableScale>
    );
  }

  if (!post.image) {
    return (
      <PressableScale
        accessibilityRole={linkToDetail ? "button" : "none"}
        accessibilityLabel={linkToDetail ? `Open ${post.author.name}'s post` : undefined}
        disabled={!linkToDetail}
        onPress={openComments}
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.lg,
          padding: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          gap: spacing.sm,
        }}
      >
        {header}
        <MentionText variant="body" content={post.caption} />
        {actions}
      </PressableScale>
    );
  }

  // Video: header above the frame, transport controls (play/pause/seek/
  // fullscreen) belong to the native player, caption/actions below. Not
  // wrapped in a navigate-on-tap Pressable like the photo branch -- the video
  // body needs direct touches for its own controls, so the comment pill is
  // the way into the post's detail screen for a video post.
  if (post.mediaType === "video") {
    return (
      <View
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.lg,
          gap: spacing.sm,
        }}
      >
        {header}
        <PostVideo
          uri={post.image}
          accessibilityLabel={`Video from ${post.author.name}`}
          active={active}
        />
        <MentionText variant="body" content={post.caption} />
        {actions}
      </View>
    );
  }

  const mediaPress = openComments ?? (canExpandMedia ? () => setExpanded(true) : undefined);

  return (
    <>
      <PressableScale
        accessibilityRole={mediaPress ? "button" : "none"}
        accessibilityLabel={
          linkToDetail
            ? `Open ${post.author.name}'s post`
            : canExpandMedia
              ? `View ${post.author.name}'s photo full screen`
              : undefined
        }
        disabled={!mediaPress}
        onPress={mediaPress}
        style={{ marginHorizontal: spacing.lg, marginBottom: spacing.lg }}
      >
        <Media
          source={post.image}
          scrim="full"
          rounded="lg"
          style={{ height: 460 }}
          accessibilityIgnoresInvertColors
          accessibilityLabel={`Photo from ${post.author.name}`}
        >
          <Animated.View
            style={[
              { flex: 1, justifyContent: "space-between", padding: spacing.md },
              chromeStyle,
            ]}
          >
            {header}
            <View style={{ gap: spacing.sm }}>
              <MentionText variant="body" onMedia numberOfLines={3} content={post.caption} />
              {actions}
            </View>
          </Animated.View>
        </Media>
      </PressableScale>

      {canExpandMedia ? (
        <Modal
          visible={expanded}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setExpanded(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(160)}
            style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close full-screen photo"
              onPress={() => setExpanded(false)}
              style={StyleSheet.absoluteFill}
            >
              <Image
                source={post.image}
                contentFit="contain"
                style={StyleSheet.absoluteFill}
                accessibilityIgnoresInvertColors
                accessibilityLabel={`Photo from ${post.author.name}`}
              />
            </Pressable>
          </Animated.View>
        </Modal>
      ) : null}
    </>
  );
});
