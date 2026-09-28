import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { EmptyState, Icon, InlineNotice, Loader, PressableScale, Text } from "@/src/components/ui";
import {
  fetchConversationMessages,
  type ApiMessageContext,
  type ApiMessageMedia,
} from "@/src/services/conversationServices";
import { pickFromLibrary } from "@/src/services/media";
import { uploadMedia } from "@/src/services/uploadServices";
import { useSession } from "@/src/services/SessionContext";
import { getSocket, markMessageRead, sendMessage, type SocketMessage } from "@/src/services/socket";
import { culture, inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface ChatMessage {
  id: string;
  content: string;
  mine: boolean;
  at: string;
  context?: ApiMessageContext | null;
  media?: ApiMessageMedia | null;
}

/**
 * A message that is nothing but emoji is drawn large and without a bubble.
 *
 * This is what "stickers" means here: the app has no sticker artwork, and a
 * picker of big emoji is the same gesture with nothing to download. The
 * bubble is dropped because a 40pt emoji inside a chat bubble reads as a
 * mistake rather than as a reaction.
 *
 * Capped at three so a sentence of emoji stays a sentence.
 */
/** The sticker row. Short on purpose: a grid you have to read is slower than typing. */
const CHAT_STICKERS = ["❤️", "🔥", "😂", "👏", "😮", "🙏", "🎉", "💯"] as const;

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D)+$/u;

function isStickerMessage(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 12) return false;
  if (!EMOJI_ONLY.test(trimmed)) return false;
  return [...trimmed.replace(/[\uFE0F\u200D]/g, "")].length <= 3;
}

/**
 * The quoted block above a reply, the way a chat app shows what you answered.
 *
 * Tappable, and it opens THAT story rather than the person's rail -- but only
 * while the story is still alive. A story lives 24 hours and the reply
 * outlives it, so a quote that always looked tappable would usually dead-end
 * into an empty viewer. expiresAt travels on the message for exactly this, so
 * the state is known without a request per quote in a scrolling list.
 *
 * An expired quote stays visible and says so. It is still the record of what
 * was answered; it has just stopped being a way back.
 */
function QuotedStory({ context, mine }: { context: ApiMessageContext; mine: boolean }) {
  const { colors } = useTheme();
  const tint = mine ? culture.warmWhite : colors.textPrimary;

  // No expiry recorded means the message predates the field. Treated as open,
  // because the viewer degrades gracefully and wrongly greying out a live
  // story is the worse error.
  const expired = context.expiresAt ? new Date(context.expiresAt).getTime() <= Date.now() : false;

  const open = () =>
    router.push({
      pathname: "/stories/[userId]",
      params: { userId: context.authorId, storyId: context.refId },
    });

  return (
    <PressableScale
      accessibilityRole={expired ? "text" : "link"}
      accessibilityLabel={
        expired ? "Story no longer available" : `Open the story this replies to`
      }
      disabled={expired}
      onPress={open}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          marginBottom: spacing.xs,
          paddingLeft: spacing.md,
          paddingRight: spacing.sm,
          paddingVertical: spacing.sm,
          /**
           * The quote sets the bubble's width, rather than the other way round.
           *
           * A bubble sizes to its content, so a one-emoji reply -- which is
           * most of them -- made a bubble barely wider than the emoji and the
           * quote inside it was crushed into two cramped lines beside the
           * thumbnail. A floor here means the quote reads the same whether the
           * reply is "😂" or a paragraph.
           *
           * 200 is the largest round number that still fits inside the 78%
           * cap on a 320pt screen (which leaves 218pt of bubble interior), and
           * it leaves the text column ~113pt next to a 40pt thumbnail. At 168
           * the text had 81pt and still wrapped awkwardly, which was the
           * cramped look this is fixing.
           */
          minWidth: 200,
          // Matches the thumbnail plus its padding, so a quote with one short
          // line is not shorter than a quote with a picture in it.
          minHeight: 56,
          borderRadius: radius.sm,
          // A translucent wash rather than a fixed colour, so one rule reads
          // correctly on the violet of your own bubble and on the surface of
          // theirs.
          backgroundColor: mine ? "rgba(255,255,255,0.16)" : colors.background,
          borderLeftWidth: 3,
          borderLeftColor: mine ? culture.warmWhite : culture.violet,
        }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="micro" style={{ color: tint, opacity: 0.8 }}>
            STORY
          </Text>
          <Text variant="caption" numberOfLines={2} style={{ color: tint, opacity: 0.9 }}>
            {expired
              ? "This story is no longer available"
              : context.text || (context.mediaUrl ? "Photo" : "Story")}
          </Text>
        </View>
        {context.mediaUrl ? (
          <Image
            source={{ uri: context.mediaUrl }}
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.sm,
              // The thumbnail is kept even when expired -- it is what makes the
              // quote recognisable -- but dimmed, so the block does not look
              // tappable when it is not.
              opacity: expired ? 0.45 : 1,
            }}
            contentFit="cover"
          />
        ) : null}
      </View>
    </PressableScale>
  );
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Bubble({ message }: { message: ChatMessage }) {
  const { colors } = useTheme();
  const sticker = !message.media && !message.context && isStickerMessage(message.content);

  // A sticker gets no bubble, no background and no padding: it is the message.
  if (sticker) {
    return (
      <View
        style={{
          alignSelf: message.mine ? "flex-end" : "flex-start",
          marginBottom: spacing.xs,
          alignItems: message.mine ? "flex-end" : "flex-start",
        }}
      >
        <Text style={{ fontSize: 44, lineHeight: 52 }}>{message.content.trim()}</Text>
        <Text variant="caption" color="textMuted" style={{ opacity: 0.7 }}>
          {clock(message.at)}
        </Text>
      </View>
    );
  }

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
      {message.context?.kind === "story" ? (
        <QuotedStory context={message.context} mine={message.mine} />
      ) : null}
      {message.media ? (
        <Image
          source={{ uri: message.media.url }}
          // Fixed width, 4:3. A chat has no room to honour each image's own aspect
          // ratio without the column jumping about as pictures load.
          style={{
            width: 216,
            height: 162,
            borderRadius: radius.sm,
            marginBottom: message.content.trim() ? spacing.xs : 0,
          }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
          accessibilityLabel={message.media.type === "video" ? "Video" : "Photo"}
        />
      ) : null}
      {message.content.trim() ? (
        <Text variant="body" style={message.mine ? { color: culture.warmWhite } : undefined}>
          {message.content}
        </Text>
      ) : null}
      <Text
        variant="caption"
        style={{
          // 2pt put the clock almost on the message's baseline, which is a lot
          // of the cramped feel on a one-line reply.
          marginTop: 4,
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
  const { user } = useSession();
  const { id, participantId, name } = useLocalSearchParams<{
    id: string;
    participantId: string;
    name?: string;
  }>();

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const append = useCallback((incoming: SocketMessage, mine: boolean) => {
    setMessages((current) => {
      if (current.some((m) => m.id === incoming._id)) return current;
      return [
        ...current,
        {
          id: incoming._id,
          content: incoming.content,
          context: incoming.context ?? null,
          media: incoming.media ?? null,
          mine,
          at: incoming.createdAt,
        },
      ];
    });
  }, []);

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      if (!id) {
        setHistoryError("This conversation is missing its ID.");
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      setHistoryError(null);
      const result = await fetchConversationMessages(id, 100);
      if (!active) return;

      if (!result.success) {
        setHistoryError(result.error);
        setHistoryLoading(false);
        return;
      }

      const history = result.data.messages.map((message) => ({
        id: message._id,
        content: message.content,
        context: message.context ?? null,
        media: message.media ?? null,
        mine: message.senderId._id === user?.id,
        at: message.createdAt,
      }));

      // A live message can arrive while history is loading. Merge by id rather
      // than replacing state so neither source can erase the other.
      setMessages((current) => {
        const merged = new Map([...history, ...current].map((message) => [message.id, message]));
        return [...merged.values()].sort(
          (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime()
        );
      });

      result.data.messages.forEach((message) => {
        if (message.receiverId._id === user?.id && message.status !== "read") {
          markMessageRead(message._id);
        }
      });
      setHistoryLoading(false);
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [id, user?.id]);

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
      markMessageRead(incoming._id);
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

  const send = (media?: { url: string; type: "image" | "video" }) => {
    const content = draft.trim();
    // An attachment can travel on its own; text cannot be empty without one.
    if ((!content && !media) || !participantId) return;

    setError(null);
    const ok = sendMessage(participantId, content, undefined, media);

    if (!ok) {
      setError("Not connected. Check your connection and try again.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraft("");
  };

  /**
   * Pick, upload, then send.
   *
   * Uploaded before the message exists rather than after: the server only
   * accepts a URL on our own Cloudinary account, so there is nothing to send
   * until the upload has produced one.
   */
  const attach = async () => {
    const picked = await pickFromLibrary("image");
    if (picked.status !== "picked") {
      // Cancelling is not an error and must not leave a message on screen.
      if (picked.status === "denied") {
        setError("Campus Connect needs photo access to send a picture.");
      }
      return;
    }

    setUploading(true);
    setError(null);
    const uploaded = await uploadMedia(picked.media, "posts");
    setUploading(false);

    if (!uploaded.success) {
      setError(uploaded.error);
      return;
    }

    send({ url: uploaded.url, type: uploaded.kind });
  };

  return (
    <SettingsShell title={name || "Chat"}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        /**
         * No keyboardVerticalOffset.
         *
         * SettingsShell renders its header IN FLOW and this sits below it, so
         * the frame React Native measures already excludes the top inset and
         * the header. The offset it used to pass described both again, and a
         * larger offset makes RN think the keyboard reaches higher than it
         * does -- so it padded ~100pt too much and left a band of background
         * between the composer and the keyboard.
         *
         * An offset is for a KeyboardAvoidingView that is the root with a
         * header floating OVER it. That is not this.
         */
      >
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
            historyLoading ? (
              <EmptyState.Loading />
            ) : historyError ? (
              <EmptyState tone="error" title="Could not load messages" body={historyError} />
            ) : (
              <EmptyState
                title={`Say hello to ${name || "them"}`}
                body="There are no messages in this conversation yet."
              />
            )
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

        {/* Stickers. A row of large emoji rather than artwork: the app ships
            no sticker pack, and this is the same gesture with nothing to
            download. One tap sends. */}
        {stickersOpen ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.xs,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            {CHAT_STICKERS.map((emoji) => (
              <PressableScale
                key={emoji}
                accessibilityRole="button"
                accessibilityLabel={`Send ${emoji}`}
                onPress={() => {
                  if (!participantId) return;
                  sendMessage(participantId, emoji);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStickersOpen(false);
                }}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.full,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{ fontSize: 26, lineHeight: 32 }}>{emoji}</Text>
              </PressableScale>
            ))}
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
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send a photo"
            accessibilityState={{ disabled: uploading }}
            disabled={uploading}
            onPress={attach}
            style={{ width: 40, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            {uploading ? (
              <Loader size={18} />
            ) : (
              <Icon name="photo" size={21} color={colors.textSecondary} />
            )}
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityState={{ selected: stickersOpen }}
            accessibilityLabel={stickersOpen ? "Hide stickers" : "Send a sticker"}
            onPress={() => setStickersOpen((open) => !open)}
            style={{ width: 40, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 20, lineHeight: 24, opacity: stickersOpen ? 1 : 0.65 }}>
              😊
            </Text>
          </PressableScale>

          {/* The box carries the height and the centring; the input sizes to
              its own text. A minHeight on the TextInput itself top-aligns the
              first line on iOS and leaves a gap beneath it, which is what made
              the placeholder sit high. */}
          <View
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              justifyContent: "center",
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
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
                color: colors.textPrimary,
                ...inputTextStyle(true),
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              }}
            />
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !draft.trim() }}
            disabled={!draft.trim()}
            onPress={() => send()}
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
