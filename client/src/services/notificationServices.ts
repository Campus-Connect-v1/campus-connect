import { api, request } from "./api";

export type NotificationType =
  | "post_like"
  | "post_comment"
  | "connection_request"
  | "connection_accepted"
  | "event_invite"
  | "group_invite"
  | "story_view"
  | string;

export interface ApiNotification {
  notification_id: string;
  type: NotificationType;
  resource_type: string | null;
  resource_id: string | null;
  title: string;
  body: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  actor: {
    user_id: string;
    first_name: string;
    last_name: string | null;
    profile_picture_url: string | null;
  } | null;
}

export async function fetchNotifications(limit = 30, offset = 0, unreadOnly = false) {
  const result = await request<{ count: number; notifications?: ApiNotification[] }>(() =>
    api.get("/notifications", {
      // The server compares against the literal "true", so the flag is sent as
      // a string rather than relying on axios's boolean serialisation.
      params: { limit, offset, ...(unreadOnly ? { unread_only: "true" } : {}) },
    })
  );
  return result.success ? { ...result, data: result.data.notifications ?? [] } : result;
}

export async function fetchUnreadCount() {
  const result = await request<{ count: number }>(() => api.get("/notifications/unread-count"));
  return result.success ? { ...result, data: result.data.count ?? 0 } : result;
}

export function markNotificationRead(notificationId: string) {
  return request(() => api.patch(`/notifications/${notificationId}/read`));
}

export function markAllNotificationsRead() {
  return request(() => api.patch("/notifications/read-all"));
}

export function deleteNotification(notificationId: string) {
  return request(() => api.delete(`/notifications/${notificationId}`));
}

export function clearNotifications() {
  return request(() => api.delete("/notifications"));
}

export type PushPlatform = "ios" | "android" | "web" | "unknown";

export function registerPushToken(token: string, platform: PushPlatform, deviceId?: string) {
  return request<{ message: string }>(() =>
    api.post("/notifications/push-tokens", {
      token,
      platform,
      device_id: deviceId ?? null,
    })
  );
}

export function unregisterPushToken(token: string) {
  return request<{ message: string }>(() =>
    api.delete("/notifications/push-tokens", { data: { token } })
  );
}
