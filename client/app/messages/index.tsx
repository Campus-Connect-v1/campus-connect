import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Avatar, EmptyState, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchConversations, type ApiConversation } from "@/src/services/conversationServices";
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

  const conversations = useAsync(
    useCallback(() => fetchConversations(), []),
    []
  );

  return (
    <SettingsShell title="Messages">
      <FlatList
        data={conversations.data ?? []}
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
        renderItem={({ item }) => <Row conversation={item} />}
      />
    </SettingsShell>
  );
}
