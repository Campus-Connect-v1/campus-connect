import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { EmptyState, Icon, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { getSocket, sendMessage, type SocketMessage } from "@/src/services/socket";
import { culture, inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface ChatMessage {
  id: string;
  content: string;
  mine: boolean;
  at: string;
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Bubble({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        alignSelf: message.mine ? "flex-end" : "flex-start",
        maxWidth: "78%",
        marginBottom: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.lg,
        // The corner nearest the sender is squared off, which is what makes a
        // column of bubbles read as a direction rather than a list of pills.
        borderBottomRightRadius: message.mine ? radius.sm : radius.lg,
        borderBottomLeftRadius: message.mine ? radius.lg : radius.sm,
        backgroundColor: message.mine ? culture.violet : colors.surface,
      }}
    >
      <Text variant="body" style={message.mine ? { color: culture.warmWhite } : undefined}>
        {message.content}
      </Text>
      <Text
        variant="caption"
        style={{
          marginTop: 2,
          opacity: 0.7,
          color: message.mine ? culture.warmWhite : colors.textMuted,
        }}
      >
        {clock(message.at)}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { participantId, name } = useLocalSearchParams<{
    id: string;
    participantId: string;
    name?: string;
  }>();

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const append = useCallback((incoming: SocketMessage, mine: boolean) => {
    setMessages((current) => {
      if (current.some((m) => m.id === incoming._id)) return current;
      return [
        ...current,
        {
          id: incoming._id,
          content: incoming.content,
          mine,
          at: incoming.createdAt,
        },
      ];
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setError("You are signed out. Sign in again to send messages.");
      return;
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    // Only messages from THIS conversation's other participant land here; the
    // socket is app-wide and also carries other people's threads.
    const onReceive = (incoming: SocketMessage) => {
      if (incoming.senderId?._id !== participantId) return;
      append(incoming, false);
    };
    const onSent = (incoming: SocketMessage) => append(incoming, true);
    const onError = (message: string) => setError(message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive_message", onReceive);
    socket.on("message_sent", onSent);
    socket.on("error_message", onError);

    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive_message", onReceive);
      socket.off("message_sent", onSent);
      socket.off("error_message", onError);
    };
  }, [participantId, append]);

  useEffect(() => {
    if (messages.length) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = () => {
    const content = draft.trim();
    if (!content || !participantId) return;

    setError(null);
    const ok = sendMessage(participantId, content);

    if (!ok) {
      setError("Not connected. Check your connection and try again.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraft("");
  };

  return (
    <SettingsShell title={name || "Chat"}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 56}
      >
        {/* The API has no endpoint that returns message history, so this
            thread starts empty and fills as messages arrive. See
            BACKEND-REQUEST-message-history.md. */}
        <FlatList
          ref={listRef}
          data={messages}
          style={{ flex: 1 }}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
          ListEmptyComponent={
            <EmptyState
              title={`Say hello to ${name || "them"}`}
              body="Earlier messages are not loaded yet, so this thread starts here."
            />
          }
          renderItem={({ item }) => <Bubble message={item} />}
        />

        {error ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
            <InlineNotice message={error} />
          </View>
        ) : null}

        {!connected && !error ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}>
            <Text variant="caption" color="textMuted">
              Connecting…
            </Text>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <TextInput
            accessibilityLabel="Message"
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            multiline
            autoCapitalize="sentences"
            value={draft}
            onChangeText={setDraft}
            style={{
              flex: 1,
              maxHeight: 120,
              minHeight: 44,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              ...inputTextStyle(true),
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs + 2,
            }}
          />
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !draft.trim() }}
            disabled={!draft.trim()}
            onPress={send}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: draft.trim() ? colors.accent : colors.surface,
            }}
          >
            <Icon name="send" size={18} color={draft.trim() ? colors.accentFg : colors.textMuted} />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}
