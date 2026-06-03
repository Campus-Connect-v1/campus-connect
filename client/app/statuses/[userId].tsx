import Colors from "@/src/constants/Colors"
import {
  getStatuses,
  getUserStatuses,
  type UserStatus,
} from "@/src/services/statuses"
import { Font, displayTracking } from "@/src/theme/typography"
import { timeAgo } from "@/src/utils/time"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useVideoPlayer, VideoView } from "expo-video"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get("window")

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"
}

function StatusVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (nextPlayer) => {
    nextPlayer.loop = true
    nextPlayer.play()
  })

  return <VideoView player={player} style={styles.media} nativeControls contentFit="cover" />
}

function StatusMedia({ status }: { status: UserStatus }) {
  const sticker = status.media_url?.startsWith("sticker:")
    ? status.media_url.replace(/^sticker:/, "")
    : null

  if (sticker) {
    return (
      <View style={styles.stickerPane}>
        <Text style={styles.sticker}>{sticker}</Text>
      </View>
    )
  }

  if (status.media_url && status.media_type === "video") {
    return <StatusVideo uri={status.media_url} />
  }

  if (status.media_url && status.media_type === "image") {
    return <Image source={status.media_url} style={styles.media} contentFit="cover" />
  }

  return null
}

function UserStatusPage({ userId }: { userId: string }) {
  const [statuses, setStatuses] = useState<UserStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getUserStatuses(userId).then((result) => {
      if (!mounted) return
      if (result.success) setStatuses(result.data)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [userId])

  const current = statuses[statuses.length - 1]

  if (loading) {
    return (
      <View style={styles.page}>
        <ActivityIndicator color={Colors.light.background} />
      </View>
    )
  }

  if (!current) {
    return (
      <View style={styles.page}>
        <Text style={styles.emptyText}>No active status</Text>
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <View style={styles.progressRow}>
        {statuses.map((status) => (
          <View key={status.status_id} style={styles.progressSegment} />
        ))}
      </View>

      <View style={styles.authorRow}>
        {current.author.profile_picture_url ? (
          <Image source={current.author.profile_picture_url} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {initials(current.author.first_name, current.author.last_name)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>
            {current.author.first_name} {current.author.last_name}
          </Text>
          <Text style={styles.time}>{timeAgo(current.created_at)}</Text>
        </View>
      </View>

      <View style={styles.statusBody}>
        <StatusMedia status={current} />
        {!!current.content && <Text style={styles.caption}>{current.content}</Text>}
      </View>
    </View>
  )
}

export default function StatusViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [latestStatuses, setLatestStatuses] = useState<UserStatus[]>([])
  const [loading, setLoading] = useState(true)
  const dragY = useRef(new Animated.Value(0)).current
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 16 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.3,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) dragY.setValue(gesture.dy)
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 110 || gesture.vy > 1.1) {
            router.back()
            return
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            speed: 18,
            bounciness: 5,
          }).start()
        },
      }),
    [dragY, router],
  )

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getStatuses()
    if (result.success) setLatestStatuses(result.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const initialIndex = useMemo(
    () => Math.max(0, latestStatuses.findIndex((status) => status.user_id === userId)),
    [latestStatuses, userId],
  )

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.light.background} />
      </View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.screen,
        {
          paddingTop: insets.top,
          transform: [{ translateY: dragY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="close" size={24} color={Colors.light.background} />
      </Pressable>
      <FlatList
        horizontal
        pagingEnabled
        data={latestStatuses}
        keyExtractor={(status) => status.user_id}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }: ListRenderItemInfo<UserStatus>) => (
          <UserStatusPage userId={item.user_id} />
        )}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.primary,
  },
  closeButton: {
    position: "absolute",
    top: 48,
    right: 18,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  page: {
    width,
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 36,
  },
  progressRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 18,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(251,245,233,0.72)",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.secondary,
  },
  avatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: Colors.light.background,
    fontFamily: Font.semibold,
    fontSize: 15,
  },
  authorName: {
    color: Colors.light.background,
    fontFamily: Font.semibold,
    fontSize: 16,
  },
  time: {
    color: "rgba(251,245,233,0.66)",
    fontFamily: Font.medium,
    fontSize: 13,
  },
  statusBody: {
    flex: 1,
    justifyContent: "center",
  },
  media: {
    width: "100%",
    aspectRatio: 9 / 14,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  stickerPane: {
    width: "100%",
    aspectRatio: 9 / 14,
    borderRadius: 18,
    backgroundColor: Colors.light.card,
    justifyContent: "center",
    alignItems: "center",
  },
  sticker: {
    fontSize: 110,
  },
  caption: {
    marginTop: 18,
    color: Colors.light.background,
    fontFamily: Font.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: displayTracking,
    textAlign: "center",
  },
  emptyText: {
    color: Colors.light.background,
    fontFamily: Font.medium,
    textAlign: "center",
  },
})
