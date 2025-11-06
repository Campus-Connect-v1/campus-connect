import { io, Socket } from "socket.io-client";
import { storage } from "../utils/storage";

let socketInstance: Socket | null = null;

function deriveApiBaseUrl(): string {
  // Derive from axios base if possible; fallback to localhost
  const axiosBase = "http://172.20.10.14:8000/api"; // keep in sync with authServices.ts
  try {
    const url = new URL(axiosBase);
    const maybeApiBase = `${url.protocol}//${url.host}`;
    return maybeApiBase;
  } catch {
    return "http://localhost:8000";
  }
}

export async function getSocket(): Promise<Socket> {
  if (socketInstance && socketInstance.connected) return socketInstance;

  const token = await storage.getToken();
  const API_BASE = deriveApiBaseUrl();

  socketInstance = io(API_BASE, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: true,
    auth: token ? { token } : undefined,
  });

  return socketInstance;
}

export function getCurrentSocket(): Socket | null {
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export async function sendMessageViaSocket(receiverId: string, content: string): Promise<void> {
  const socket = await getSocket();
  socket.emit("send_message", { receiverId, content });
}

export async function sendTypingIndicator(receiverId: string, isTyping: boolean): Promise<void> {
  const socket = await getSocket();
  socket.emit("typing", { receiverId, isTyping });
}

export async function initiateCall(receiverId: string, isVideoCall: boolean): Promise<void> {
  const socket = await getSocket();
  socket.emit("call_request", { receiverId, isVideoCall });
}

export async function acceptCall(callId: string): Promise<void> {
  const socket = await getSocket();
  socket.emit("call_accepted", { callId });
}

export async function rejectCall(callId: string): Promise<void> {
  const socket = await getSocket();
  socket.emit("call_rejected", { callId });
}

export async function endCall(callId: string): Promise<void> {
  const socket = await getSocket();
  socket.emit("call_ended", { callId });
}


