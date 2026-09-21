import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

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
  markAllNotificationsRead,
  markNotificationRead,
  fetchNotifications,
  type ApiNotification,
} from "@/src/services/notificationServices";
import { respondToConnection } from "@/src/services/userServices";
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
        backgroundColor: notification.is_read ? "transparent" : colors.surface,
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
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});

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
    markNotificationRead(id);

    if (action === "accept") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.selectionAsync();
    }
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
        renderItem={({ item }) => (
          <Row
            notification={item}
            response={responses[item.notification_id] ?? { status: "idle" }}
            onPress={() => open(item)}
            onRespond={(action) => respond(item, action)}
          />
        )}
      />
    </SettingsShell>
  );
}
