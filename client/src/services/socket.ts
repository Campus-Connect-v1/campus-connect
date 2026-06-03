import { io, type Socket } from "socket.io-client";
import env from "../config/env";
import { getToken } from "./storage";

/**
 * Single shared Socket.io connection, authenticated with the JWT via the
 * handshake `auth.token` (matches server middleware/verifySocketToken.js).
 */
let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  if (socket?.connected) return socket;
  const token = await getToken();
  if (!token) return null;

  socket = io(env.socketUrl, {
    auth: { token },
    transports: ["websocket"],
    forceNew: false,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/** Raw message payload the server emits on `receive_message` / `message_sent`. */
export interface WireMessage {
  _id: string;
  senderId: { _id: string; username?: string; email?: string };
  receiverId: { _id: string; username?: string; email?: string };
  content: string;
  createdAt: string;
}
