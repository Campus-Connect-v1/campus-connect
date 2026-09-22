import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "../constants/env";
import { getToken } from "./session";

/** Exactly what socket.js emits back on `receive_message` and `message_sent`. */
export interface SocketMessage {
  _id: string;
  senderId: { _id: string; username?: string; email?: string };
  receiverId: { _id: string; username?: string; email?: string };
  content: string;
  createdAt: string;
}

let socket: Socket | null = null;

/**
 * One shared Socket.IO connection for the whole app.
 *
 * Connecting per screen would open a second socket on every navigation, and the
 * server maps one socket id per user — the newest wins, so the older screen
 * silently stops receiving. The token is read at connect time rather than
 * captured, so signing in as someone else reconnects as them.
 */
export function getSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;

  if (socket?.connected || socket?.active) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    // The RN client has no cookies to send, and polling upgrades are a common
    // source of duplicate connections behind proxies.
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  // Signing out must not leave the next user subscribed to the previous
  // user's posts, or holding a socket id that no longer exists.
  joinedPosts.clear();
  socketId = null;
  lifecycleBound = false;
}

export function sendMessage(receiverId: string, content: string) {
  const active = getSocket();
  if (!active) return false;
  active.emit("send_message", { receiverId, content });
  return true;
}

export function markMessageRead(messageId: string) {
  getSocket()?.emit("mark_message_read", messageId);
}

// ---------------------------------------------------------------------------
// Realtime social events
//
// The server broadcasts to a room per post (`post:<id>`) and a room per user
// (`user:<id>`). Writes still go over HTTP — these are read-side updates only,
// so a dropped frame costs a stale counter until the next fetch, never a lost
// write.
// ---------------------------------------------------------------------------

/** Every post-room payload carries the post and its authoritative totals. */
export interface PostEventPayload {
  post_id: string;
  /** Null only if the server's count query failed; leave the UI value alone. */
  like_count: number | null;
  comment_count: number | null;
  user_id?: string;
  content?: string;
  comment_id?: string;
  /** Present on comment:liked / comment:unliked. */
  comment_like_count?: number;
  comment?: {
    comment_id: string;
    content: string;
    parent_comment_id: string | null;
    created_at: string;
    author: {
      user_id: string;
      first_name: string;
      last_name: string | null;
      profile_picture_url: string | null;
    };
  };
}

export interface NotificationEventPayload {
  notification_id?: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  resource_type: string | null;
  resource_id: string | null;
  title: string;
  body: string | null;
  is_read: 0 | 1;
}

export type PostEvent =
  | "comment:liked"
  | "comment:unliked"
  | "post:liked"
  | "post:unliked"
  | "post:updated"
  | "post:deleted"
  | "comment:added"
  | "comment:updated"
  | "comment:deleted";

/**
 * Posts this client wants to be subscribed to.
 *
 * Socket.IO rooms live on the server's socket object, so a reconnect silently
 * drops every membership. Holding them here lets us re-join on `connect` —
 * without it, a screen left open across a network blip stops updating and
 * gives no sign that it has.
 */
const joinedPosts = new Set<string>();
let socketId: string | null = null;
let lifecycleBound = false;

/**
 * The current socket's id, sent as `x-socket-id` so the server can skip
 * echoing this client's own writes back at it (which would race the optimistic
 * update and make counters flicker). Null is fine and simply means "echo to
 * me too".
 */
export function getSocketId(): string | null {
  return socketId;
}

/** Idempotent: attaches the reconnect handling exactly once per socket. */
function bindLifecycle(active: Socket) {
  if (lifecycleBound) return;
  lifecycleBound = true;

  active.on("connect", () => {
    // Ask for our id, then restore every room we believe we are in.
    active.emit("whoami");
    for (const postId of joinedPosts) active.emit("join_post", postId);
  });

  active.on("socket_id", (id: string) => {
    socketId = id;
  });

  active.on("disconnect", () => {
    socketId = null;
  });
}

export function joinPost(postId: string) {
  joinedPosts.add(postId);
  const active = getSocket();
  if (!active) return;
  bindLifecycle(active);
  if (active.connected) active.emit("join_post", postId);
}

export function leavePost(postId: string) {
  joinedPosts.delete(postId);
  const active = getSocket();
  if (active?.connected) active.emit("leave_post", postId);
}

/**
 * Subscribe to one post-room event. Returns an unsubscribe function, so a
 * screen can hand it straight back from useEffect.
 *
 * Payloads for other posts are filtered out here rather than at each call
 * site: one socket is shared by the whole app, so a feed row and an open post
 * detail both receive every room's traffic.
 */
export function onPostEvent(
  postId: string,
  event: PostEvent,
  handler: (payload: PostEventPayload) => void
): () => void {
  const active = getSocket();
  if (!active) return () => {};

  bindLifecycle(active);

  const listener = (payload: PostEventPayload) => {
    if (payload?.post_id === postId) handler(payload);
  };

  active.on(event, listener);
  return () => {
    active.off(event, listener);
  };
}

/** Subscribe to this user's notifications. Returns an unsubscribe function. */
export function onNotification(
  handler: (payload: NotificationEventPayload) => void
): () => void {
  const active = getSocket();
  if (!active) return () => {};

  bindLifecycle(active);
  active.on("notification:new", handler);
  return () => {
    active.off("notification:new", handler);
  };
}
