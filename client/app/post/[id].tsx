import Colors from "@/src/constants/Colors"
import { PostCard } from "@/src/components/social/PostCard"
import {
  addComment,
  getComments,
  getPost,
  likePost,
  unlikePost,
  type Comment,
  type Post,
} from "@/src/services/social"
import { timeAgo } from "@/src/utils/time"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  type ListRenderItemInfo,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"
}

function CommentRow({ comment }: { comment: Comment }) {
  const { author } = comment
  return (
    <View style={styles.commentRow}>
      {author.profile_picture_url ? (
        <Image source={author.profile_picture_url} style={styles.commentAvatar} contentFit="cover" />
      ) : (
        <View style={[styles.commentAvatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{initials(author.first_name, author.last_name)}</Text>
        </View>
      )}
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentName}>
            {author.first_name} {author.last_name}
          </Text>
          <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  )
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList<Comment>>(null)

  const loadComments = useCallback(async () => {
    const commentsRes = await getComments(id)
    if (commentsRes.success) {
      setComments(commentsRes.data)
      setCommentsError(null)
    } else {
      setCommentsError(commentsRes.error.message)
    }
  }, [id])

  const load = useCallback(async () => {
    setLoading(true)
    const [postRes, commentsRes] = await Promise.all([getPost(id), getComments(id)])
    if (postRes.success) {
      setPost(postRes.data)
      setError(null)
    } else {
      setError(postRes.error.message)
    }
    if (commentsRes.success) {
      setComments(commentsRes.data)
      setCommentsError(null)
    } else {
      setCommentsError(commentsRes.error.message)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const toggleLike = useCallback((p: Post) => {
    const wasLiked = p.user_actions.has_liked
    setPost((prev) =>
      prev
        ? {
            ...prev,
            user_actions: { has_liked: !wasLiked },
            stats: { ...prev.stats, like_count: prev.stats.like_count + (wasLiked ? -1 : 1) },
          }
        : prev,
    )
    const call = wasLiked ? unlikePost : likePost
    void call(p.post_id).then((res) => {
      if (!res.success) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                user_actions: { has_liked: wasLiked },
                stats: { ...prev.stats, like_count: p.stats.like_count },
              }
            : prev,
        )
      }
    })
  }, [])

  const send = async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    const res = await addComment(id, content)
    setSending(false)
    if (res.success) {
      setDraft("")
      await loadComments()
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
      setPost((prev) =>
        prev
          ? { ...prev, stats: { ...prev.stats, comment_count: prev.stats.comment_count + 1 } }
          : prev,
      )
    } else {
      Alert.alert("Comment failed", res.error.message || "Please try again")
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.primary} />
        </Pressable>
        <Text style={styles.topTitle}>Post</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : error || !post ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={44} color={Colors.light.gray} />
          <Text style={styles.errorText}>{error ?? "Post not found"}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(c) => c.comment_id}
          renderItem={({ item }: ListRenderItemInfo<Comment>) => <CommentRow comment={item} />}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          ListHeaderComponent={
            <>
              <PostCard post={post} onToggleLike={toggleLike} />
              <Text style={styles.commentsTitle}>
                Comments {post.stats.comment_count > 0 ? `· ${post.stats.comment_count}` : ""}
              </Text>
            </>
          }
          ListEmptyComponent={
            commentsError ? (
              <View style={styles.commentError}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={Colors.light.gray} />
                <Text style={styles.noComments}>Couldn&apos;t load comments.</Text>
                <Text style={styles.commentErrorText}>{commentsError}</Text>
                <Pressable style={styles.retryButton} onPress={loadComments}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.noComments}>No comments yet. Be the first.</Text>
            )
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
        />
      )}

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          style={styles.composerInput}
          placeholder="Add a comment…"
          placeholderTextColor={Colors.light.gray}
          value={draft}
          onChangeText={setDraft}
          multiline
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={send}
          disabled={!draft.trim() || sending}
          style={[styles.sendButton, (!draft.trim() || sending) && styles.sendDisabled]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: "Barlow_600SemiBold",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, padding: 32 },
  errorText: { color: Colors.light.gray, fontFamily: "Barlow_500Medium", textAlign: "center" },
  commentsTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Barlow_600SemiBold",
  },
  noComments: {
    textAlign: "center",
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    paddingVertical: 24,
  },
  listContent: {
    paddingBottom: 16,
  },
  commentError: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  commentErrorText: {
    color: Colors.light.gray,
    fontFamily: "Barlow_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: -12,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Barlow_600SemiBold",
    fontSize: 14,
  },
  commentRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.lightGray,
  },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarText: { color: Colors.light.gray, fontFamily: "Barlow_600SemiBold", fontSize: 13 },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentName: { fontSize: 14, color: Colors.light.username, fontFamily: "Barlow_600SemiBold" },
  commentTime: { fontSize: 12, color: Colors.light.timestamp, fontFamily: "Barlow_500Medium" },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
    fontFamily: "Barlow_400Regular",
    marginTop: 2,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  composerInput: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Barlow_400Regular",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: { opacity: 0.4 },
})
