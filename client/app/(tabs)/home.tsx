import Colors from "@/src/constants/Colors"
import ProfileDrawer from "@/src/components/layout/profile-drawer"
import { PostCard } from "@/src/components/social/PostCard"
import { Font } from "@/src/theme/typography"
import { useFeed } from "@/src/hooks/useFeed"
import type { Post } from "@/src/services/social"
import { getStatuses, type UserStatus } from "@/src/services/statuses"
import { useAuthStore } from "@/src/store/authStore"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const TAB_BAR_HEIGHT = 64
const FAB_NAV_GAP = 18
const STORY_LIMIT = 12

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"
}

function StoriesStrip({
  statuses,
  onAdd,
  onOpen,
}: {
  statuses: UserStatus[]
  onAdd: () => void
  onOpen: (status: UserStatus) => void
}) {
  const stories = statuses.slice(0, STORY_LIMIT)

  return (
    <View style={styles.storiesWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContent}
      >
        <Pressable style={styles.storyItem} onPress={onAdd}>
          <View style={[styles.storyRing, styles.addStoryRing]}>
            <Ionicons name="add" size={26} color={Colors.light.primary} />
          </View>
          <Text style={styles.storyLabel} numberOfLines={1}>
            Status
          </Text>
        </Pressable>

        {stories.map((status) => (
          <Pressable
            key={status.user_id}
            style={styles.storyItem}
            onPress={() => onOpen(status)}
          >
            <View style={styles.storyRing}>
              {status.author.profile_picture_url ? (
                <Image
                  source={status.author.profile_picture_url}
                  style={styles.storyAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.storyAvatar, styles.storyAvatarFallback]}>
                  <Text style={styles.storyInitials}>
                    {initials(status.author.first_name, status.author.last_name)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>
              {status.author.first_name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statuses, setStatuses] = useState<UserStatus[]>([])
  const {
    posts,
    loading,
    refreshing,
    loadingMore,
    error,
    refresh,
    loadMore,
    toggleLike,
  } = useFeed()
  const insets = useSafeAreaInsets()

  // Refresh when returning to the tab (e.g. after composing a post), but not
  // on the first focus — the hook already loads on mount.
  const firstFocus = useRef(true)
  const loadStatuses = useCallback(async () => {
    const result = await getStatuses()
    if (result.success) setStatuses(result.data)
  }, [])

  useEffect(() => {
    void loadStatuses()
  }, [loadStatuses])

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false
        return
      }
      refresh()
      void loadStatuses()
    }, [refresh, loadStatuses]),
  )

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        post={item}
        onToggleLike={toggleLike}
        onPress={(p) => router.push({ pathname: "/post/[id]", params: { id: p.post_id } })}
      />
    ),
    [toggleLike, router],
  )

  const listHeader = useCallback(
    () => (
      <StoriesStrip
        statuses={statuses}
        onAdd={() => router.push({ pathname: "/post/compose", params: { mode: "story" } })}
        onOpen={(status) =>
          router.push({ pathname: "/statuses/[userId]", params: { userId: status.user_id } })
        }
      />
    ),
    [statuses, router],
  )

  return (
    <View style={styles.container}>
      <View style={[styles.screenHeader, { paddingTop: insets.top + 14 }]}>
        <Pressable style={styles.menuButton} onPress={() => setDrawerOpen(true)} hitSlop={8}>
          <Ionicons name="menu-outline" size={24} color={Colors.light.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.screenTitle}>Campus Connect</Text>
          <Text style={styles.screenSubtitle}>Live from your campus</Text>
        </View>
      </View>

      <ProfileDrawer
        isVisible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={{
          name: user?.name ?? "Student",
          username: user?.email ?? "",
          avatar: user?.profile_picture_url ?? "",
        }}
        onNavigate={() => undefined}
        onLogout={() => undefined}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : error && posts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.light.gray} />
          <Text style={styles.stateTitle}>Couldn&apos;t load your feed</Text>
          <Text style={styles.stateBody}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.post_id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.light.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={Colors.light.gray} />
              <Text style={styles.stateTitle}>Your feed is quiet</Text>
              <Text style={styles.stateBody}>
                Connect with classmates to see their posts here.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footer} color={Colors.light.primary} />
            ) : null
          }
          contentContainerStyle={posts.length === 0 ? styles.emptyContent : styles.listContent}
        />
      )}

      <Pressable
        accessibilityLabel="Create post"
        hitSlop={8}
        style={[
          styles.fab,
          { bottom: insets.bottom + TAB_BAR_HEIGHT + FAB_NAV_GAP },
        ]}
        onPress={() => router.push("/post/compose")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCopy: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    color: Colors.light.text,
    fontFamily: Font.display,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    marginTop: -2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  listContent: {
    paddingBottom: 150,
  },
  stateTitle: {
    fontSize: 21,
    color: Colors.light.text,
    fontFamily: Font.display,
    marginTop: 8,
  },
  stateBody: {
    fontSize: 14,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Barlow_600SemiBold",
  },
  footer: {
    paddingVertical: 20,
  },
  storiesWrap: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  storiesContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    width: 62,
    alignItems: "center",
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: Colors.light.accent,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.card,
  },
  addStoryRing: {
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.lightGray,
  },
  storyAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
  },
  storyAvatarFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
  },
  storyInitials: {
    color: Colors.light.background,
    fontFamily: "Barlow_600SemiBold",
    fontSize: 15,
  },
  storyLabel: {
    marginTop: 6,
    width: "100%",
    textAlign: "center",
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
})
