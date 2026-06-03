import Colors from "@/src/constants/Colors"
import {
  pickFromLibrary,
  pickVideoFromLibrary,
  resolveImageForPost,
  resolveVideoForPost,
  takePhoto,
  takeVideo,
  type LocalImageAttachment,
  type LocalVideoAttachment,
} from "@/src/services/media"
import { createPost } from "@/src/services/social"
import { createStatus } from "@/src/services/statuses"
import { Font, displayTracking } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useVideoPlayer, VideoView } from "expo-video"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const MAX = 500
const STICKERS = ["🎉", "🔥", "💙", "📚", "☕", "🏆", "💡", "🙌"]

type Attachment =
  | { kind: "local-image"; image: LocalImageAttachment }
  | { kind: "local-video"; video: LocalVideoAttachment }
  | { kind: "remote-image"; url: string }
  | { kind: "sticker"; sticker: string }

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value)
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url.href)
    )
  } catch {
    return false
  }
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (nextPlayer) => {
    nextPlayer.loop = true
    nextPlayer.muted = true
    nextPlayer.play()
  })

  return <VideoView player={player} style={styles.preview} nativeControls contentFit="cover" />
}

export default function ComposeScreen() {
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  const insets = useSafeAreaInsets()
  const [content, setContent] = useState("")
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [urlDraft, setUrlDraft] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isStoryMode = mode === "story"

  const canPost = (content.trim().length > 0 || !!attachment) && !submitting

  const attach = async (source: "library" | "camera") => {
    const image = source === "camera" ? await takePhoto() : await pickFromLibrary()
    if (image) setAttachment({ kind: "local-image", image })
  }

  const attachVideo = async (source: "library" | "camera") => {
    const video = source === "camera" ? await takeVideo() : await pickVideoFromLibrary()
    if (video) setAttachment({ kind: "local-video", video })
  }

  const attachUrl = () => {
    const next = urlDraft.trim()
    if (!isValidImageUrl(next)) {
      Alert.alert("Invalid image link", "Paste a direct http/https image URL ending in png, jpg, jpeg, gif, or webp.")
      return
    }
    setAttachment({ kind: "remote-image", url: next })
    setUrlDraft("")
    setShowUrlInput(false)
  }

  const handlePost = async () => {
    if (!canPost) return
    setSubmitting(true)

    let mediaUrl: string | undefined
    if (attachment?.kind === "local-image") {
      const resolved = await resolveImageForPost(attachment.image)
      if (!resolved.success) {
        setSubmitting(false)
        Alert.alert("Image failed", resolved.error.message)
        return
      }
      mediaUrl = resolved.data
    } else if (attachment?.kind === "local-video") {
      const resolved = await resolveVideoForPost(attachment.video)
      if (!resolved.success) {
        setSubmitting(false)
        Alert.alert("Video failed", resolved.error.message)
        return
      }
      mediaUrl = resolved.data
    } else if (attachment?.kind === "remote-image") {
      mediaUrl = attachment.url
    } else if (attachment?.kind === "sticker") {
      mediaUrl = `sticker:${attachment.sticker}`
    }

    const payload = {
      content: content.trim() || undefined,
      media_url: mediaUrl,
      media_type: attachment?.kind === "local-video" ? "video" : mediaUrl ? "image" : "text",
    }
    const result = isStoryMode ? await createStatus(payload) : await createPost(payload)
    setSubmitting(false)

    if (result.success) {
      router.back()
    } else {
      Alert.alert(
        isStoryMode ? "Couldn't post status" : "Couldn't post",
        result.error.message || "Please try again",
      )
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>{isStoryMode ? "NEW STATUS" : "NEW POST"}</Text>
        <Pressable
          hitSlop={8}
          onPress={handlePost}
          disabled={!canPost}
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.input}
          placeholder={isStoryMode ? "Share a quick status update" : "What's happening on campus?"}
          placeholderTextColor={Colors.light.gray}
          value={content}
          onChangeText={(t) => setContent(t.slice(0, MAX))}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {attachment?.kind === "local-image" && (
          <View style={styles.previewWrap}>
            <Image source={attachment.image.uri} style={styles.preview} contentFit="cover" />
            <Pressable style={styles.removeButton} onPress={() => setAttachment(null)}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {attachment?.kind === "remote-image" && (
          <View style={styles.previewWrap}>
            <Image source={attachment.url} style={styles.preview} contentFit="cover" />
            <Pressable style={styles.removeButton} onPress={() => setAttachment(null)}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {attachment?.kind === "local-video" && (
          <View style={styles.previewWrap}>
            <VideoPreview uri={attachment.video.uri} />
            <View style={styles.videoBadge}>
              <Ionicons name="videocam" size={14} color="#fff" />
              <Text style={styles.videoBadgeText}>15s max</Text>
            </View>
            <Pressable style={styles.removeButton} onPress={() => setAttachment(null)}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {attachment?.kind === "sticker" && (
          <View style={styles.stickerPreview}>
            <Text style={styles.stickerLarge}>{attachment.sticker}</Text>
            <Pressable style={styles.removeButton} onPress={() => setAttachment(null)}>
              <Ionicons name="close" size={18} color="#fff" />
            </Pressable>
          </View>
        )}

        {showUrlInput && (
          <View style={styles.urlBox}>
            <TextInput
              style={styles.urlInput}
              placeholder="Paste direct image URL"
              placeholderTextColor={Colors.light.gray}
              value={urlDraft}
              onChangeText={setUrlDraft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Pressable style={styles.urlAddButton} onPress={attachUrl}>
              <Text style={styles.urlAddText}>Attach</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.stickerRow}>
          {STICKERS.map((sticker) => (
            <Pressable
              key={sticker}
              style={[
                styles.stickerButton,
                attachment?.kind === "sticker" &&
                  attachment.sticker === sticker &&
                  styles.stickerButtonActive,
              ]}
              onPress={() => setAttachment({ kind: "sticker", sticker })}
            >
              <Text style={styles.stickerText}>{sticker}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Toolbar */}
      <View style={[styles.toolbar, { paddingBottom: insets.bottom + 10 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.toolsScroll}
        >
          <Pressable style={styles.toolButton} onPress={() => attach("library")}>
            <Ionicons name="image-outline" size={24} color={Colors.light.accent} />
            <Text style={styles.toolLabel}>Photo</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => attach("camera")}>
            <Ionicons name="camera-outline" size={24} color={Colors.light.accent} />
            <Text style={styles.toolLabel}>Camera</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => attachVideo("library")}>
            <Ionicons name="film-outline" size={24} color={Colors.light.accent} />
            <Text style={styles.toolLabel}>Video</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => attachVideo("camera")}>
            <Ionicons name="videocam-outline" size={24} color={Colors.light.accent} />
            <Text style={styles.toolLabel}>Record</Text>
          </Pressable>
          <Pressable style={styles.toolButton} onPress={() => setShowUrlInput((v) => !v)}>
            <Ionicons name="link-outline" size={24} color={Colors.light.accent} />
            <Text style={styles.toolLabel}>Link</Text>
          </Pressable>
        </ScrollView>
        <Text style={styles.counter}>
          {content.length}/{MAX}
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  cancel: {
    fontSize: 16,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
  },
  title: {
    fontSize: 22,
    letterSpacing: displayTracking,
    color: Colors.light.text,
    fontFamily: Font.display,
  },
  postButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    minWidth: 64,
    alignItems: "center",
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Barlow_600SemiBold",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  input: {
    fontSize: 18,
    lineHeight: 26,
    minHeight: 120,
    color: Colors.light.text,
    fontFamily: "Barlow_400Regular",
  },
  previewWrap: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: Colors.light.lightGray,
  },
  videoBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  videoBadgeText: {
    color: "#fff",
    fontFamily: "Barlow_600SemiBold",
    fontSize: 12,
  },
  stickerPreview: {
    marginTop: 16,
    minHeight: 180,
    borderRadius: 14,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stickerLarge: {
    fontSize: 82,
  },
  removeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  toolsScroll: {
    gap: 16,
    paddingRight: 12,
  },
  toolButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toolLabel: {
    fontSize: 12,
    color: Colors.light.accent,
    fontFamily: "Barlow_600SemiBold",
  },
  urlBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },
  urlInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 12,
    color: Colors.light.text,
    fontFamily: "Barlow_400Regular",
  },
  urlAddButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
  },
  urlAddText: {
    color: "#fff",
    fontFamily: "Barlow_600SemiBold",
    fontSize: 14,
  },
  stickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  stickerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stickerButtonActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.sky,
  },
  stickerText: {
    fontSize: 23,
  },
  counter: {
    marginLeft: "auto",
    fontSize: 13,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
  },
})
