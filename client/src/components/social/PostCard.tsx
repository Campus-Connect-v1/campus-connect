import Colors from "@/src/constants/Colors";
import type { Post } from "@/src/services/social";
import { timeAgo } from "@/src/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PostCardProps {
  post: Post;
  onToggleLike: (post: Post) => void;
  onPress?: (post: Post) => void;
}

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function VideoMedia({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (nextPlayer) => {
    nextPlayer.loop = false;
  });

  return <VideoView player={player} style={styles.media} nativeControls contentFit="cover" />;
}

function PostCardBase({ post, onToggleLike, onPress }: PostCardProps) {
  const { author, stats, user_actions } = post;
  const liked = user_actions.has_liked;
  const sticker = post.media_url?.startsWith("sticker:")
    ? post.media_url.replace(/^sticker:/, "")
    : null;

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(post)}>
      {/* Header */}
      <View style={styles.header}>
        {author.profile_picture_url ? (
          <Image source={author.profile_picture_url} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {initials(author.first_name, author.last_name)}
            </Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {author.first_name} {author.last_name}
          </Text>
          {!!author.profile_headline && (
            <Text style={styles.headline} numberOfLines={1}>
              {author.profile_headline}
            </Text>
          )}
        </View>
        <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
      </View>

      {/* Body */}
      {!!post.content && <Text style={styles.content}>{post.content}</Text>}
      {!!sticker && (
        <View style={styles.stickerMedia}>
          <Text style={styles.stickerText}>{sticker}</Text>
        </View>
      )}
      {!!post.media_url && !sticker && post.media_type === "video" && (
        <VideoMedia uri={post.media_url} />
      )}
      {!!post.media_url && !sticker && post.media_type !== "text" && post.media_type !== "video" && (
        <Image source={post.media_url} style={styles.media} contentFit="cover" transition={150} />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.action}
          onPress={() => onToggleLike(post)}
          hitSlop={8}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={22}
            color={liked ? Colors.light.like : Colors.light.gray}
          />
          <Text style={[styles.actionText, liked && styles.actionTextActive]}>
            {stats.like_count}
          </Text>
        </Pressable>
        <View style={styles.action}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.light.gray} />
          <Text style={styles.actionText}>{stats.comment_count}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.lightGray,
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.light.gray,
    fontFamily: "Barlow_600SemiBold",
    fontSize: 16,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    color: Colors.light.username,
    fontFamily: "Barlow_600SemiBold",
  },
  headline: {
    fontSize: 13,
    color: Colors.light.caption,
    fontFamily: "Barlow_500Medium",
    marginTop: 1,
  },
  time: {
    fontSize: 13,
    color: Colors.light.timestamp,
    fontFamily: "Barlow_500Medium",
    marginLeft: 8,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    fontFamily: "Barlow_400Regular",
    marginBottom: 10,
  },
  media: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: Colors.light.lightGray,
    marginBottom: 10,
  },
  stickerMedia: {
    width: "100%",
    minHeight: 160,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  stickerText: {
    fontSize: 76,
  },
  actions: {
    flexDirection: "row",
    gap: 24,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
  },
  actionTextActive: {
    color: Colors.light.like,
  },
});

export const PostCard = memo(PostCardBase);
export default PostCard;
