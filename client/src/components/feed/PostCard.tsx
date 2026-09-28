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
import { PollCard } from "./PollCard";
import type { FeedPost } from "@/src/features/feed/types";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface Props {
  post: FeedPost;
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
 * The feed's video renderer. Same expo-video pattern already proven in
 * MediaAttachment and the stories viewer: native controls, no autoplay, no
 * loop. useVideoPlayer ties the player's lifetime to this component, so
 * scrolling the card out of the list and unmounting it stops playback and
 * releases the player -- nothing extra to clean up here.
 */
function PostVideo({ uri, accessibilityLabel }: { uri: string; accessibilityLabel: string }) {
  const { colors } = useTheme();
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });
  const { status } = useEvent(player, "statusChange", { status: player.status });

  return (
    <View
      style={{ height: 460, borderRadius: radius.lg, overflow: "hidden", backgroundColor: "#000" }}
    >
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls
        // Android's default SurfaceView renders in its own compositor layer
        // outside normal view clipping, so with more than one video mounted
        // in the same scrolling list it can bleed over neighbouring cards.
        // textureView composites like an ordinary view instead.
        surfaceType="textureView"
        accessibilityLabel={accessibilityLabel}
      />

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
  onToggleLike,
  onToggleSave,
  onOpenOptions,
  linkToDetail = true,
}: Props) {
  const { colors } = useTheme();
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
        label={post.saved ? "Saved" : "Save"}
        active={post.saved}
        tint={culture.yellow}
        foreground={culture.ink}
        accessibilityLabel={post.saved ? "Remove from saved" : "Save"}
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
        <Text variant="body">{post.caption}</Text>
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
        <Text variant="body">{post.caption}</Text>
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
        <PostVideo uri={post.image} accessibilityLabel={`Video from ${post.author.name}`} />
        <Text variant="body">{post.caption}</Text>
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
              <Text variant="body" onMedia numberOfLines={3}>
                {post.caption}
              </Text>
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
