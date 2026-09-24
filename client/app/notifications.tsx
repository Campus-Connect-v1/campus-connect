import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import {
  Avatar,
  EmptyState,
  Icon,
  Loader,
  PressableScale,
  SkeletonList,
  Text,
  type IconName,
} from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  clearNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  fetchNotifications,
  type ApiNotification,
} from "@/src/services/notificationServices";
import {
  fetchConnections,
  respondToConnection,
  type ConnectionStatus,
} from "@/src/services/userServices";
import type { Result } from "@/src/services/api";
import { onNotification } from "@/src/services/socket";
import { useUnread } from "@/src/services/UnreadContext";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/** The glyph for a notification whose actor has no avatar to show. */
const ICON_FOR: Record<string, IconName> = {
  post_like: "like",
  post_comment: "message",
  connection_request: "connectAdd",
  connection_accepted: "connect",
  event_invite: "events",
  event_created: "events",
  group_invite: "connect",
  story_view: "visible",
  new_post: "home",
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

  if (notification.type === "connection_request" && notification.actor) {
    return {
      pathname: "/person/[id]",
      params: { id: notification.actor.user_id },
    };
  }
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

type ResponseState =
  | { status: "idle" | "accepting" | "declining" | "accepted" | "declined" }
  | { status: "error"; message: string };

interface NotificationFeed {
  notifications: ApiNotification[];
  connectionStatuses: Record<string, ConnectionStatus>;
}

/**
 * A notification is historical, while its connection is live state. Loading
 * both prevents an old request notification from growing Accept/Decline
 * buttons again after a refresh or after the app is reopened.
 */
async function fetchNotificationFeed(): Promise<Result<NotificationFeed>> {
  const notificationResult = await fetchNotifications(30, 0);
  if (!notificationResult.success) return notificationResult;

  const connectionResult = await fetchConnections();
  const connectionStatuses: Record<string, ConnectionStatus> = {};

  if (connectionResult.success) {
    Object.values(connectionResult.data)
      .flat()
      .forEach((connection) => {
        connectionStatuses[connection.connection_id] = connection.status;
      });
  }

  return {
    success: true,
    data: { notifications: notificationResult.data, connectionStatuses },
  };
}

function Row({
  notification,
  response,
  onPress,
  onRespond,
}: {
  notification: ApiNotification;
  response: ResponseState;
  onPress: () => void;
  onRespond: (action: "accept" | "decline") => void;
}) {
  const { colors } = useTheme();
  const destination = destinationFor(notification);
  const isRequest = notification.type === "connection_request" && Boolean(notification.resource_id);
  const responding = response.status === "accepting" || response.status === "declining";
  const name = notification.actor
    ? [notification.actor.first_name, notification.actor.last_name].filter(Boolean).join(" ")
    : null;

  return (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
        // The unread marker is a tinted ground, not a dot: the whole row is
        // the thing you have not dealt with.
        // Opaque, not transparent: the row slides over a red delete action,
        // and a see-through row would show it bleeding under every read item.
        backgroundColor: notification.is_read ? colors.background : colors.surface,
      }}
    >
      <PressableScale
        accessibilityRole={destination ? "button" : "none"}
        accessibilityLabel={`${notification.title}${notification.is_read ? "" : ", unread"}`}
        disabled={!destination}
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
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

      {isRequest && (response.status === "idle" || response.status === "error" || responding) ? (
        <View style={{ paddingLeft: 42 + spacing.md, gap: spacing.xs }}>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Accept ${name ?? "connection"} request`}
              disabled={responding}
              onPress={() => onRespond("accept")}
              style={{
                minHeight: 44,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                backgroundColor: culture.yellow,
                opacity: responding ? 0.6 : 1,
              }}
            >
              {response.status === "accepting" ? <Loader size={17} color={culture.ink} /> : null}
              <Text variant="label" style={{ color: culture.ink }}>
                Accept
              </Text>
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Decline ${name ?? "connection"} request`}
              disabled={responding}
              onPress={() => onRespond("decline")}
              style={{
                minHeight: 44,
                paddingHorizontal: spacing.md,
                borderRadius: radius.full,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                opacity: responding ? 0.6 : 1,
              }}
            >
              {response.status === "declining" ? (
                <Loader size={17} color={colors.textPrimary} />
              ) : null}
              <Text variant="label">Decline</Text>
            </PressableScale>
          </View>

          {response.status === "error" ? (
            <Text variant="caption" color="destructive">
              {response.message}
            </Text>
          ) : null}
        </View>
      ) : null}

      {response.status === "accepted" || response.status === "declined" ? (
        <View
          style={{
            minHeight: 36,
            paddingLeft: 42 + spacing.md,
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.xs,
          }}
        >
          <Icon
            name={response.status === "accepted" ? "check" : "close"}
            size={16}
            color={response.status === "accepted" ? colors.success : colors.textMuted}
          />
          <Text
            variant="label"
            style={{ color: response.status === "accepted" ? colors.success : colors.textMuted }}
          >
            {response.status === "accepted" ? "You’re now friends" : "Request declined"}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const unreadBadge = useUnread();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});

  const feed = useAsync(
    useCallback(() => fetchNotificationFeed(), []),
    []
  );
  const refreshFeed = useRef(feed.refresh);
  const hasFocused = useRef(false);
  refreshFeed.current = feed.refresh;

  // A notification arriving over the socket refreshes the list rather than
  // being prepended: notifyMany's payload carries no notification_id (the
  // server sends a bare signal precisely because the client refetches), so
  // there is no safe key to render a row from or to de-duplicate against.
  //
  // Debounced because a fan-out — an event announcement to a whole group —
  // lands as a burst of frames, and one refetch per frame would hammer the
  // API to display the same list.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = onNotification(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refreshFeed.current(), 400);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Stack screens remain mounted while a profile is open. Re-read connection
  // state when the user comes back so a request accepted on that profile does
  // not keep stale action buttons here.
  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) void refreshFeed.current();
      else hasFocused.current = true;
    }, [])
  );

  const notifications = (feed.data?.notifications ?? [])
    .filter((n) => !removedIds.has(n.notification_id))
    .map((n) => (readIds.has(n.notification_id) ? { ...n, is_read: true } : n));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const open = (notification: ApiNotification) => {
    if (!notification.is_read) {
      setReadIds((current) => new Set(current).add(notification.notification_id));
      void markNotificationRead(notification.notification_id).then(() => unreadBadge.refresh());
    }

    const destination = destinationFor(notification);
    if (destination) router.push(destination as never);
  };

  const remove = async (notification: ApiNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRemovedIds((current) => new Set(current).add(notification.notification_id));

    const result = await deleteNotification(notification.notification_id);
    if (!result.success) {
      // Put it back rather than leaving the list claiming a delete that failed.
      setRemovedIds((current) => {
        const next = new Set(current);
        next.delete(notification.notification_id);
        return next;
      });
      return;
    }
    if (!notification.is_read) void unreadBadge.refresh();
  };

  const confirmClear = () =>
    Alert.alert(
      "Clear all notifications?",
      "This removes every notification, read and unread. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            const result = await clearNotifications();
            if (!result.success) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            unreadBadge.clear();
            await feed.reload();
          },
        },
      ]
    );

  const markAll = async () => {
    Haptics.selectionAsync();
    setReadIds(new Set(notifications.map((n) => n.notification_id)));
    unreadBadge.clear();
    await markAllNotificationsRead();
  };

  const respond = async (notification: ApiNotification, action: "accept" | "decline") => {
    if (!notification.resource_id) return;
    const id = notification.notification_id;
    const current = responses[id]?.status;
    if (current === "accepting" || current === "declining") return;

    setResponses((state) => ({
      ...state,
      [id]: { status: action === "accept" ? "accepting" : "declining" },
    }));

    const result = await respondToConnection(notification.resource_id, action);
    if (!result.success) {
      setResponses((state) => ({ ...state, [id]: { status: "error", message: result.error } }));
      return;
    }

    setResponses((state) => ({
      ...state,
      [id]: { status: action === "accept" ? "accepted" : "declined" },
    }));
    setReadIds((currentIds) => new Set(currentIds).add(id));
    void markNotificationRead(id).then(() => unreadBadge.refresh());

    if (action === "accept") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.selectionAsync();
    }
  };

  return (
    <SettingsShell title="Notifications">
      {notifications.length > 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.sm,
          }}
        >
          {unreadCount > 0 ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Mark all ${unreadCount} as read`}
              onPress={markAll}
              style={{ minHeight: 40, justifyContent: "center" }}
            >
              <Text variant="label" style={{ color: colors.accent }}>
                Mark all as read
              </Text>
            </PressableScale>
          ) : null}

          <View style={{ flex: 1 }} />

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Clear all notifications"
            onPress={confirmClear}
            style={{ minHeight: 40, justifyContent: "center" }}
          >
            <Text variant="label" color="destructive">
              Clear all
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
        renderItem={({ item }) => {
          const persistedStatus = item.resource_id
            ? feed.data?.connectionStatuses[item.resource_id]
            : undefined;
          const persistedResponse: ResponseState =
            persistedStatus === "accepted" || persistedStatus === "declined"
              ? { status: persistedStatus }
              : { status: "idle" };
          const response =
            persistedStatus === "accepted" || persistedStatus === "declined"
              ? persistedResponse
              : (responses[item.notification_id] ?? persistedResponse);

          return (
            <Swipeable
              // Right-to-left only: a left swipe on a row that can also be
              // tapped is too easy to trigger while scrolling.
              renderRightActions={() => (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Delete notification: ${item.title}`}
                  onPress={() => remove(item)}
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
              <Row
                notification={item}
                response={response}
                onPress={() => open(item)}
                onRespond={(action) => respond(item, action)}
              />
            </Swipeable>
          );
        }}
      />
    </SettingsShell>
  );
}
