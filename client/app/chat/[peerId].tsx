import Colors from "@/src/constants/Colors"
import ScreenHeader from "@/src/components/ui/ScreenHeader"
import { useChat } from "@/src/hooks/useChat"
import { Font } from "@/src/theme/typography"
import { timeAgo } from "@/src/utils/time"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams } from "expo-router"
import { useState } from "react"
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function ChatScreen() {
  const { peerId, name } = useLocalSearchParams<{ peerId: string; name?: string }>()
  const insets = useSafeAreaInsets()
  const { messages, connected, error, send } = useChat(peerId)
  const [draft, setDraft] = useState("")

  const onSend = () => {
    if (!draft.trim()) return
    send(draft)
    setDraft("")
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader title={name || "Chat"} />

      {!connected && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {error ?? "Connecting…"}
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.fromMe ? styles.rowMe : styles.rowThem]}>
            <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, item.fromMe && styles.bubbleTextMe]}>
                {item.content}
              </Text>
              <Text style={[styles.time, item.fromMe && styles.timeMe]}>
                {item.pending ? "sending…" : timeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={44} color={Colors.light.gray} />
            <Text style={styles.emptyText}>Say hello 👋</Text>
          </View>
        }
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Message…"
          placeholderTextColor={Colors.light.gray}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Pressable
          style={[styles.send, !draft.trim() && styles.sendDisabled]}
          onPress={onSend}
          disabled={!draft.trim()}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  banner: {
    backgroundColor: Colors.light.lightGray,
    paddingVertical: 6,
    alignItems: "center",
  },
  bannerText: { fontFamily: Font.medium, fontSize: 12, color: Colors.light.gray },
  list: { padding: 16, gap: 8, flexGrow: 1 },
  bubbleRow: { flexDirection: "row" },
  rowMe: { justifyContent: "flex-end" },
  rowThem: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMe: { backgroundColor: Colors.light.primary, borderBottomRightRadius: 4 },
  bubbleThem: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontFamily: Font.body, fontSize: 15, lineHeight: 21, color: Colors.light.text },
  bubbleTextMe: { color: "#FBF5E9" },
  time: { fontFamily: Font.medium, fontSize: 10, color: Colors.light.timestamp, marginTop: 4, alignSelf: "flex-end" },
  timeMe: { color: "rgba(251,245,233,0.7)" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyText: { fontFamily: Font.medium, fontSize: 15, color: Colors.light.gray },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: Font.body,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: { opacity: 0.4 },
})
