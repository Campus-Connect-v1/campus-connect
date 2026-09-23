import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Avatar, EmptyState, Icon, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  deleteConversation,
  fetchConversations,
  type ApiConversation,
} from "@/src/services/conversationServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

function when(iso?: string) {
  if (!iso) return "";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function Row({ conversation }: { conversation: ApiConversation }) {
  const { colors } = useTheme();
  const other = conversation.otherParticipant;
  const name = other?.username || other?.email?.split("@")[0] || "Someone";
  const unread = conversation.unreadCount > 0;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={
        `Conversation with ${name}` + (unread ? `, ${conversation.unreadCount} unread` : "")
      }
      onPress={() =>
        router.push({
          pathname: "/messages/[id]",
          params: {
            id: conversation._id,
            participantId: other?.userId ?? "",
            name,
          },
        })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        // Opaque: the row slides over a red delete action behind it.
        backgroundColor: colors.background,
      }}
    >
      <Avatar uri={other?.avatar ?? undefined} size={48} />

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" color="textMuted">
            {when(conversation.lastMessage?.timestamp)}
          </Text>
        </View>
        <Text variant="caption" color={unread ? "textPrimary" : "textMuted"} numberOfLines={1}>
          {conversation.lastMessage?.content ?? "No messages yet"}
        </Text>
      </View>

      {unread ? (
        <View
          style={{
            minWidth: 20,
            height: 20,
            paddingHorizontal: 5,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: culture.pink,
          }}
        >
          <Text variant="micro" style={{ color: colors.onMedia, fontSize: 10 }}>
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export default function ConversationsScreen() {
  const { colors } = useTheme();
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const conversations = useAsync(
    useCallback(() => fetchConversations(), []),
    []
  );

  return (
    <SettingsShell title="Messages">
      <FlatList
        data={(conversations.data ?? []).filter((row) => !removed.has(row._id))}
        style={{ flex: 1 }}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        refreshControl={
          <RefreshControl
            refreshing={conversations.refreshing}
            onRefresh={conversations.refresh}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          conversations.loading ? (
            <SkeletonList count={4} />
          ) : conversations.error ? (
            <EmptyState
              tone="error"
              title="Could not load messages"
              body={conversations.error}
              actionLabel="Try again"
              onAction={conversations.reload}
            />
          ) : (
            <EmptyState
              title="No messages yet"
              body="Find someone on Connect and say hello."
              actionLabel="Find people"
              onAction={() => router.replace("/(tabs)/connect")}
            />
          )
        }
        renderItem={({ item }) => {
          const name =
            item.otherParticipant?.username ||
            item.otherParticipant?.email?.split("@")[0] ||
            "this chat";

          const confirmDelete = () =>
            Alert.alert(
              "Delete this conversation?",
              `Your copy of the conversation with ${name} is removed. This cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    setRemoved((current) => new Set(current).add(item._id));
                    const result = await deleteConversation(item._id);
                    if (!result.success) {
                      // Restored rather than left looking deleted.
                      setRemoved((current) => {
                        const next = new Set(current);
                        next.delete(item._id);
                        return next;
                      });
                    }
                  },
                },
              ]
            );

          return (
            <Swipeable
              renderRightActions={() => (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Delete conversation with ${name}`}
                  onPress={confirmDelete}
                  style={{
                    width: 84,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: colors.destructive,
                  }}
                >
                  <Icon name="alert" size={20} color={colors.onMedia} />
                  <Text variant="caption" onMedia style={{ marginTop: 2 }}>
                    Delete
                  </Text>
                </PressableScale>
              )}
              overshootRight={false}
            >
              <Row conversation={item} />
            </Swipeable>
          );
        }}
      />
    </SettingsShell>
  );
}
