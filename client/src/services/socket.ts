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
