import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard } from "@/src/components/feed/PostCard";
import { PostOptionsSheet } from "@/src/components/feed/PostOptionsSheet";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import {
  Avatar,
  EmptyState,
  Icon,
  InlineNotice,
  PostSkeleton,
  PressableScale,
  SkeletonList,
  Text,
} from "@/src/components/ui";
import { adaptPost } from "@/src/features/feed/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { usePostRealtime } from "@/src/hooks/usePostRealtime";
import {
  addComment,
  fetchComments,
  likeComment,
  unlikeComment,
  type ApiComment,
} from "@/src/services/commentServices";
import { useSavedPosts } from "@/src/services/SavedPostsContext";
import { useSession } from "@/src/services/SessionContext";
import { fetchPost, likePost, unlikePost } from "@/src/services/socialServices";
import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

function since(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function CommentRow({
  comment,
  liked,
  likeCount,
  onToggleLike,
}: {
  comment: ApiComment;
  liked: boolean;
  likeCount: number;
  onToggleLike: (commentId: string) => void;
}) {
  const { colors } = useTheme();
  const name = [comment.author.first_name, comment.author.last_name].filter(Boolean).join(" ");
  // A reply is inset rather than given its own card, so a thread reads as one
  // conversation instead of a stack of boxes.
  const isReply = Boolean(comment.parent_comment_id);

  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        paddingRight: spacing.lg,
        paddingLeft: spacing.lg + (isReply ? spacing.xl : 0),
      }}
    >
      <Avatar uri={comment.author.profile_picture_url ?? undefined} size={34} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Text variant="label">{name}</Text>
          <Text variant="caption" color="textMuted">
            {since(comment.created_at)}
          </Text>
        </View>
        <Text variant="body">{comment.content}</Text>
      </View>

      <PressableScale
        onPress={() => onToggleLike(comment.comment_id)}
        accessibilityRole="button"
        accessibilityState={{ selected: liked }}
        accessibilityLabel={
          `${liked ? "Unlike" : "Like"} comment by ${name}` +
          (likeCount > 0 ? `, ${likeCount} ${likeCount === 1 ? "like" : "likes"}` : "")
        }
        hitSlop={10}
        // Fixed width and a reserved line for the count, so the comment text
        // does not reflow sideways the moment a count appears or disappears.
        style={{ alignItems: "center", width: 30, paddingTop: 2 }}
      >
        <Icon
          name="like"
          size={16}
          filled={liked}
          color={liked ? colors.accent : colors.textMuted}
        />
        <Text
          variant="micro"
          color={liked ? "accent" : "textMuted"}
          style={{ marginTop: 1, opacity: likeCount > 0 ? 1 : 0 }}
        >
          {likeCount > 0 ? likeCount : "0"}
        </Text>
      </PressableScale>
    </View>
  );
}

export default function PostCommentsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useSession();
  const saved = useSavedPosts();
  const inputRef = useRef<TextInput>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extra, setExtra] = useState<ApiComment[]>([]);
  // Comments edited or removed by someone else while this screen is open.
  // Held apart from the fetched list, which useAsync owns and will not mutate.
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // Authoritative totals pushed by the server; they supersede the counts that
  // came with the post, which go stale the moment anyone else acts on it.
  const [liveCounts, setLiveCounts] = useState<{
    like_count: number | null;
    comment_count: number | null;
  } | null>(null);
  const [goneMessage, setGoneMessage] = useState<string | null>(null);
  // Overrides on top of whatever the fetched comment carried: our own taps
  // (optimistic) and other people's, pushed over the socket.
  const [commentLikes, setCommentLikes] = useState<
    Record<string, { liked?: boolean; count?: number }>
  >({});

  const post = useAsync(
    useCallback(() => fetchPost(id), [id]),
    [id]
  );

  const comments = useAsync(
    useCallback(() => fetchComments(id), [id]),
    [id]
  );

  // Liking from the detail screen updates only this copy; the feed corrects
  // itself on its next refresh.
  const [likeOverride, setLikeOverride] = useState<{ liked: boolean; likes: number } | null>(null);
  const [options, setOptions] = useState(false);

  usePostRealtime(id, {
    onCounts: setLiveCounts,
    // Appending rather than refetching keeps the reader's scroll position.
    // Guarded by id because the server also echoes to us if we never sent a
    // socket id, and a double-add is far worse than a missed one.
    onCommentAdded: (payload) => {
      const incoming = payload.comment;
      if (!incoming) return;
      setExtra((current) =>
        current.some((c) => c.comment_id === incoming.comment_id)
          ? current
          : [...current, incoming as ApiComment]
      );
    },
    onCommentUpdated: (payload) => {
      if (!payload.comment_id || payload.content === undefined) return;
      setEdits((current) => ({ ...current, [payload.comment_id!]: payload.content! }));
    },
    onCommentDeleted: (payload) => {
      if (!payload.comment_id) return;
      setRemoved((current) => new Set(current).add(payload.comment_id!));
    },
    // Someone else liked a comment. Only the count moves: "liked" is this
    // viewers own state and no one else can change it.
    onCommentLikeChanged: (payload) => {
      if (!payload.comment_id || typeof payload.like_count !== "number") return;
      setCommentLikes((current) => ({
        ...current,
        [payload.comment_id!]: {
          ...current[payload.comment_id!],
          count: payload.like_count!,
        },
      }));
    },
    onPostUpdated: () => post.reload(),
    // The author deleted it out from under us. Say so rather than leaving a
    // post on screen that no longer exists and whose actions would all 404.
    onPostDeleted: () => setGoneMessage("This post was deleted by its author."),
  });

  const adapted = post.data ? adaptPost(post.data) : null;
  const display = adapted
    ? {
        ...adapted,
        saved: saved.isSaved(adapted.id),
        liked: likeOverride?.liked ?? adapted.liked,
        // A like of our own wins over the broadcast total: ours is optimistic
        // and immediate, and the next fetch reconciles the two anyway.
        likes: likeOverride?.likes ?? liveCounts?.like_count ?? adapted.likes,
        comments: liveCounts?.comment_count ?? adapted.comments + extra.length,
      }
    : null;

  const toggleLike = () => {
    if (!adapted) return;
    const wasLiked = likeOverride?.liked ?? adapted.liked;
    const currentLikes = likeOverride?.likes ?? adapted.likes;
    setLikeOverride({ liked: !wasLiked, likes: currentLikes + (wasLiked ? -1 : 1) });
    (wasLiked ? unlikePost : likePost)(adapted.id);
  };

  const toggleCommentLike = (commentId: string) => {
    const source = all.find((c) => c.comment_id === commentId);
    const override = commentLikes[commentId];
    const wasLiked = override?.liked ?? Boolean(source?.has_liked);
    const currentCount = override?.count ?? Number(source?.like_count ?? 0);

    setCommentLikes((current) => ({
      ...current,
      [commentId]: { liked: !wasLiked, count: Math.max(0, currentCount + (wasLiked ? -1 : 1)) },
    }));

    void (wasLiked ? unlikeComment : likeComment)(commentId).then((result) => {
      // Revert on failure; the server total wins when it succeeds, since two
      // devices tapping at once would otherwise both show their own guess.
      if (!result.success) {
        setCommentLikes((current) => ({
          ...current,
          [commentId]: { liked: wasLiked, count: currentCount },
        }));
        return;
      }
      const confirmed = result.data?.like;
      if (!confirmed) return;
      setCommentLikes((current) => ({
        ...current,
        [commentId]: { liked: confirmed.has_liked, count: confirmed.like_count },
      }));
    });
  };

  // Locally added comments are appended rather than triggering a refetch, so
  // the list does not jump and lose the user's scroll position mid-thread.
  const all = [...(comments.data ?? []), ...extra]
    .filter((comment) => !removed.has(comment.comment_id))
    .map((comment) =>
      edits[comment.comment_id] !== undefined
        ? { ...comment, content: edits[comment.comment_id] }
        : comment
    );

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setError(null);
    const result = await addComment(id, content);
    setSending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExtra((current) => [...current, result.data]);
    setDraft("");
  };

  return (
    <SettingsShell title="Post">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 56}
      >
        <FlatList
          data={all}
          style={{ flex: 1 }}
          keyExtractor={(item) => item.comment_id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          ListHeaderComponent={
            <View style={{ paddingTop: spacing.xs }}>
              {post.loading ? (
                <PostSkeleton />
              ) : display ? (
                <>
                  <PostCard
                    post={display}
                    onToggleLike={toggleLike}
                    onToggleSave={saved.toggle}
                    onOpenOptions={() => setOptions(true)}
                    linkToDetail={false}
                  />
                  <Text
                    variant="micro"
                    color="textMuted"
                    style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}
                  >
                    {display.comments === 1 ? "1 COMMENT" : `${display.comments} COMMENTS`}
                  </Text>
                </>
              ) : post.error ? (
                <EmptyState
                  tone="error"
                  title="Could not load this post"
                  body={post.error}
                  actionLabel="Try again"
                  onAction={post.reload}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            comments.loading ? (
              <SkeletonList count={3} />
            ) : comments.error ? (
              <EmptyState
                tone="error"
                title="Could not load comments"
                body={comments.error}
                actionLabel="Try again"
                onAction={comments.reload}
              />
            ) : post.loading ? null : (
              <EmptyState
                compact
                title="No comments yet"
                body="Be the first to say something."
                actionLabel="Write a comment"
                onAction={() => inputRef.current?.focus()}
              />
            )
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              liked={commentLikes[item.comment_id]?.liked ?? Boolean(item.has_liked)}
              likeCount={commentLikes[item.comment_id]?.count ?? Number(item.like_count ?? 0)}
              onToggleLike={toggleCommentLike}
            />
          )}
        />

        {goneMessage ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
            <InlineNotice message={goneMessage} />
          </View>
        ) : error ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
            <InlineNotice message={error} />
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Avatar uri={profile?.profile_picture_url ?? undefined} size={34} />
          <TextInput
            ref={inputRef}
            accessibilityLabel="Write a comment"
            placeholder="Write a comment"
            placeholderTextColor={colors.textMuted}
            multiline
            autoCapitalize="sentences"
            value={draft}
            onChangeText={(value) => {
              setDraft(value);
              setError(null);
            }}
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 44,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              ...inputTextStyle(true),
              paddingHorizontal: spacing.md,
              paddingTop: spacing.xs + 2,
              paddingBottom: spacing.xs + 2,
            }}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send comment"
            accessibilityState={{ disabled: !draft.trim() || sending }}
            disabled={!draft.trim() || sending}
            onPress={send}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: draft.trim() ? colors.accent : colors.surface,
              opacity: sending ? 0.6 : 1,
            }}
          >
            <Icon name="send" size={18} color={draft.trim() ? colors.accentFg : colors.textMuted} />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      {options && display ? (
        <PostOptionsSheet
          postId={display.id}
          authorName={display.author.name}
          isOwnPost={display.author.id === user?.id}
          saved={display.saved}
          visible
          onClose={() => setOptions(false)}
          onRemoved={() => router.back()}
          onToggleSave={saved.toggle}
        />
      ) : null}
    </SettingsShell>
  );
}
