import Colors from "@/src/constants/Colors"
import {
  getAllConnections,
  respondToConnection,
  searchUsers,
  sendConnectionRequest,
  type Connection,
  type UserSummary,
} from "@/src/services/user"
import ScreenHeader from "@/src/components/ui/ScreenHeader"
import { Font } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

function initials(f?: string, l?: string) {
  return `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase() || "?"
}

function Avatar({ uri, f, l }: { uri?: string | null; f?: string; l?: string }) {
  if (uri) return <Image source={uri} style={styles.avatar} contentFit="cover" />
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initials(f, l)}</Text>
    </View>
  )
}

export default function ConnectionsScreen() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSummary[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [accepted, setAccepted] = useState<Connection[]>([])
  const [pending, setPending] = useState<Connection[]>([])
  const [requested, setRequested] = useState<Set<string>>(new Set())
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadConnections = useCallback(async () => {
    const res = await getAllConnections()
    if (res.success) {
      setAccepted(res.data.accepted)
      setPending(res.data.pending)
    }
  }, [])

  useEffect(() => {
    void loadConnections()
  }, [loadConnections])

  // Debounced search.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    const q = query.trim()
    if (q.length < 2) {
      setResults(null)
      return
    }
    setSearching(true)
    debounce.current = setTimeout(async () => {
      const res = await searchUsers({ q })
      setResults(res.success ? res.data : [])
      setSearching(false)
    }, 400)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [query])

  const connect = async (userId: string) => {
    setRequested((prev) => new Set(prev).add(userId))
    const res = await sendConnectionRequest(userId)
    if (!res.success) {
      setRequested((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const respond = async (connectionId: string, action: "accept" | "decline") => {
    // Optimistically drop it from pending, then reconcile with the server.
    setPending((prev) => prev.filter((c) => c.connection_id !== connectionId))
    const res = await respondToConnection(connectionId, action)
    if (res.success) await loadConnections()
  }

  const showingSearch = results !== null

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Classmates"
        right={
          <Pressable hitSlop={8} onPress={() => router.push("/nearby")}>
            <Ionicons name="navigate-outline" size={22} color={Colors.light.primary} />
          </Pressable>
        }
      />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.light.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search classmates by name"
          placeholderTextColor={Colors.light.gray}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.light.gray} />
          </Pressable>
        )}
      </View>

      {showingSearch ? (
        <FlatList
          data={results ?? []}
          keyExtractor={(u) => u.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            searching ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.light.primary} />
            ) : null
          }
          ListEmptyComponent={
            !searching ? (
              <Text style={styles.empty}>No classmates found for “{query.trim()}”.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.id } })}
            >
              <Avatar uri={item.profile_picture_url} f={item.first_name} l={item.last_name} />
              <View style={styles.rowBody}>
                <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
                {!!item.program && <Text style={styles.sub} numberOfLines={1}>{item.program}</Text>}
              </View>
              <Pressable
                style={[styles.connectBtn, requested.has(item.id) && styles.connectBtnDone]}
                onPress={() => connect(item.id)}
                disabled={requested.has(item.id)}
              >
                <Text style={[styles.connectText, requested.has(item.id) && styles.connectTextDone]}>
                  {requested.has(item.id) ? "Requested" : "Connect"}
                </Text>
              </Pressable>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={accepted}
          keyExtractor={(c) => c.connection_id}
          ListHeaderComponent={
            pending.length > 0 ? (
              <View>
                <Text style={styles.sectionTitle}>Pending</Text>
                {pending.map((c) => (
                  <View key={c.connection_id} style={styles.row}>
                    <Avatar uri={c.receiver.profile_picture_url} f={c.receiver.first_name} l={c.receiver.last_name} />
                    <View style={styles.rowBody}>
                      <Text style={styles.name}>{c.receiver.first_name} {c.receiver.last_name}</Text>
                      <Text style={styles.sub}>{c.is_pending_action ? "Wants to connect" : "Request sent"}</Text>
                    </View>
                    {c.is_pending_action ? (
                      <View style={styles.respondRow}>
                        <Pressable
                          style={styles.declineBtn}
                          onPress={() => respond(c.connection_id, "decline")}
                        >
                          <Ionicons name="close" size={18} color={Colors.light.gray} />
                        </Pressable>
                        <Pressable
                          style={styles.acceptBtn}
                          onPress={() => respond(c.connection_id, "accept")}
                        >
                          <Text style={styles.acceptText}>Accept</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ))}
                <Text style={styles.sectionTitle}>Connections</Text>
              </View>
            ) : (
              <Text style={styles.sectionTitle}>Connections</Text>
            )
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No connections yet. Search above to find classmates.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.receiver.id } })}
            >
              <Avatar uri={item.receiver.profile_picture_url} f={item.receiver.first_name} l={item.receiver.last_name} />
              <View style={styles.rowBody}>
                <Text style={styles.name}>{item.receiver.first_name} {item.receiver.last_name}</Text>
                {!!item.receiver.program && <Text style={styles.sub} numberOfLines={1}>{item.receiver.program}</Text>}
              </View>
              <Pressable
                style={styles.messageBtn}
                onPress={() =>
                  router.push({
                    pathname: "/chat/[peerId]",
                    params: { peerId: item.receiver.id, name: `${item.receiver.first_name} ${item.receiver.last_name}` },
                  })
                }
              >
                <Ionicons name="chatbubble-outline" size={18} color={Colors.light.primary} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: { flex: 1, fontFamily: Font.body, fontSize: 15, color: Colors.light.text },
  sectionTitle: {
    fontFamily: Font.display,
    fontSize: 20,
    letterSpacing: 0.5,
    color: Colors.light.text,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  empty: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: Colors.light.gray,
    textAlign: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.light.lightGray },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarText: { fontFamily: Font.display, fontSize: 18, color: Colors.light.primary },
  rowBody: { flex: 1 },
  name: { fontFamily: Font.semibold, fontSize: 15, color: Colors.light.text },
  sub: { fontFamily: Font.body, fontSize: 13, color: Colors.light.gray, marginTop: 1 },
  connectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  connectBtnDone: { backgroundColor: Colors.light.lightGray },
  connectText: { fontFamily: Font.semibold, fontSize: 13, color: "#FBF5E9" },
  connectTextDone: { color: Colors.light.gray },
  respondRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  acceptBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.light.primary,
  },
  acceptText: { fontFamily: Font.semibold, fontSize: 13, color: "#FBF5E9" },
  declineBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
})
