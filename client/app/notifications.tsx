import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import {
  Avatar,
  EmptyState,
  Icon,
  PressableScale,
  SkeletonList,
  Text,
  type IconName,
} from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  markAllNotificationsRead,
  markNotificationRead,
  fetchNotifications,
  type ApiNotification,
} from "@/src/services/notificationServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** The glyph for a notification whose actor has no avatar to show. */
const ICON_FOR: Record<string, IconName> = {
  post_like: "like",
  post_comment: "message",
  connection_request: "connectAdd",
  connection_accepted: "connect",
  event_invite: "events",
  group_invite: "connect",
  story_view: "visible",
};

function since(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Where a notification sends you.
 *
 * Returns null when the resource has no screen yet, and the row is then
 * rendered as unpressable rather than as a link into nothing.
 */
function destinationFor(notification: ApiNotification) {
  const { resource_type, resource_id } = notification;
  if (!resource_id) return null;

  if (resource_type === "post") return { pathname: "/post/[id]", params: { id: resource_id } };
  if (resource_type === "user") return { pathname: "/person/[id]", params: { id: resource_id } };
  if (resource_type === "story") {
    return notification.actor
      ? { pathname: "/stories/[userId]", params: { userId: notification.actor.user_id } }
      : null;
  }
  if (resource_type === "event" || resource_type === "study_group") {
    return { pathname: "/(tabs)/events" as const, params: {} };
  }
  return null;
}

function Row({ notification, onPress }: { notification: ApiNotification; onPress: () => void }) {
  const { colors } = useTheme();
  const destination = destinationFor(notification);
  const name = notification.actor
    ? [notification.actor.first_name, notification.actor.last_name].filter(Boolean).join(" ")
    : null;

  return (
    <PressableScale
      accessibilityRole={destination ? "button" : "none"}
      accessibilityLabel={`${notification.title}${notification.is_read ? "" : ", unread"}`}
      disabled={!destination}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        // The unread marker is a tinted ground, not a dot: the whole row is
        // the thing you have not dealt with.
        backgroundColor: notification.is_read ? "transparent" : colors.surface,
      }}
    >
      {notification.actor ? (
        <Avatar uri={notification.actor.profile_picture_url ?? undefined} size={42} />
      ) : (
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.surfaceSunken,
          }}
        >
          <Icon
            name={ICON_FOR[notification.type] ?? "notification"}
            size={19}
            color={colors.textSecondary}
          />
        </View>
      )}

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={2}>
          {notification.title}
        </Text>
        {notification.body ? (
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
        <Text variant="caption" color="textMuted">
          {name ? `${name} · ` : ""}
          {since(notification.created_at)}
        </Text>
      </View>

      {!notification.is_read ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: radius.full,
            backgroundColor: culture.pink,
          }}
        />
      ) : null}
    </PressableScale>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const feed = useAsync(
    useCallback(() => fetchNotifications(30, 0), []),
    []
  );

  const notifications = (feed.data ?? []).map((n) =>
    readIds.has(n.notification_id) ? { ...n, is_read: true } : n
  );
  const unread = notifications.filter((n) => !n.is_read).length;

  const open = (notification: ApiNotification) => {
    if (!notification.is_read) {
      setReadIds((current) => new Set(current).add(notification.notification_id));
      markNotificationRead(notification.notification_id);
    }

    const destination = destinationFor(notification);
    if (destination) router.push(destination as never);
  };

  const markAll = async () => {
    Haptics.selectionAsync();
    setReadIds(new Set(notifications.map((n) => n.notification_id)));
    await markAllNotificationsRead();
  };

  return (
    <SettingsShell title="Notifications">
      {unread > 0 ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Mark all ${unread} as read`}
            onPress={markAll}
            style={{ alignSelf: "flex-start", minHeight: 40, justifyContent: "center" }}
          >
            <Text variant="label" style={{ color: colors.accent }}>
              Mark all as read
            </Text>
          </PressableScale>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        style={{ flex: 1 }}
        keyExtractor={(item) => item.notification_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={feed.refresh}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          feed.loading ? (
            <SkeletonList count={4} />
          ) : feed.error ? (
            <EmptyState
              tone="error"
              title="Could not load notifications"
              body={feed.error}
              actionLabel="Try again"
              onAction={feed.reload}
            />
          ) : (
            <EmptyState
              title="Nothing yet"
              body="Likes, comments and connection requests will show up here."
            />
          )
        }
        renderItem={({ item }) => <Row notification={item} onPress={() => open(item)} />}
      />
    </SettingsShell>
  );
}
