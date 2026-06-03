import Colors from "@/src/constants/Colors"
import {
  getConversations,
  otherParticipant,
  type Conversation,
} from "@/src/services/conversations"
import { useAuthStore } from "@/src/store/authStore"
import { Font } from "@/src/theme/typography"
import { timeAgo } from "@/src/utils/time"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function initials(s?: string) {
  return (s?.trim()?.[0] ?? "?").toUpperCase()
}

export default function ChatInboxScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const myId = useAuthStore((s) => s.user?.id) ?? ""
  const [items, setItems] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.headerTitle}>MESSAGES</Text>
    </View>
  )

  const load = useCallback(async (mode: "initial" | "refresh") => {
    mode === "refresh" ? setRefreshing(true) : setLoading(true)
    const res = await getConversations()
    if (res.success) setItems(res.data)
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load("initial")
    }, [load]),
  )

  if (loading) {
    return (
      <View style={styles.container}>
        {Header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
    <FlatList
      style={styles.container}
      data={items}
      keyExtractor={(c) => c._id}
      ListHeaderComponent={Header}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load("refresh")}
          tintColor={Colors.light.primary}
        />
      }
      contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.list}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.light.gray} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyBody}>Message a classmate from their profile to start chatting.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const peer = otherParticipant(item, myId)
        const peerName = peer?.username || peer?.email || "Student"
        return (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/chat/[peerId]",
                params: { peerId: peer?.userId ?? "", name: peerName },
              })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(peerName)}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.name} numberOfLines={1}>{peerName}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage?.content ?? "Tap to chat"}
              </Text>
            </View>
            {!!item.lastMessage?.timestamp && (
              <Text style={styles.time}>{timeAgo(item.lastMessage.timestamp)}</Text>
            )}
          </Pressable>
        )
      }}
    />
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 84 }]}
        onPress={() => router.push("/connections")}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontFamily: Font.display,
    fontSize: 26,
    letterSpacing: 0.5,
    color: Colors.light.text,
  },
  list: { paddingVertical: 4 },
  emptyContent: { flexGrow: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
    backgroundColor: Colors.light.background,
  },
  emptyTitle: { fontFamily: Font.display, fontSize: 21, color: Colors.light.text, marginTop: 8 },
  emptyBody: { fontFamily: Font.medium, fontSize: 14, color: Colors.light.gray, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontFamily: Font.display, fontSize: 20, color: "#FBF5E9" },
  rowBody: { flex: 1, gap: 2 },
  name: { fontFamily: Font.semibold, fontSize: 16, color: Colors.light.text },
  preview: { fontFamily: Font.body, fontSize: 14, color: Colors.light.gray },
  time: { fontFamily: Font.medium, fontSize: 12, color: Colors.light.timestamp },
  fab: {
    position: "absolute",
    right: 20,
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
