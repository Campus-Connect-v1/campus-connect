import { useCallback, useEffect, useRef, useState } from "react";
import { getMessagesWith } from "../services/conversations";
import { connectSocket, type WireMessage } from "../services/socket";
import { useAuthStore } from "../store/authStore";

export interface ChatMessage {
  id: string;
  fromMe: boolean;
  content: string;
  createdAt: string;
  pending?: boolean;
}

/**
 * Realtime 1:1 chat with `peerId` over Socket.io. Sends via `send_message`,
 * receives via `receive_message`, and confirms own sends via `message_sent`.
 * History before this session isn't loaded (no server endpoint yet).
 */
export function useChat(peerId: string) {
  const myId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Awaited<ReturnType<typeof connectSocket>>>(null);

  // Load persisted history once per peer.
  useEffect(() => {
    let active = true;
    void getMessagesWith(peerId).then((res) => {
      if (!active || !res.success) return;
      setMessages(
        res.data.map((m) => ({
          id: m._id,
          fromMe: m.senderId === myId,
          content: m.content,
          createdAt: m.createdAt,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [peerId, myId]);

  useEffect(() => {
    let cancelled = false;

    const involvesPeer = (m: WireMessage) =>
      m.senderId._id === peerId || m.receiverId._id === peerId;

    const toMsg = (m: WireMessage): ChatMessage => ({
      id: m._id,
      fromMe: m.senderId._id === myId,
      content: m.content,
      createdAt: m.createdAt,
    });

    void connectSocket().then((socket) => {
      if (cancelled || !socket) {
        if (!socket) setError("Couldn't connect to chat.");
        return;
      }
      socketRef.current = socket;
      setConnected(socket.connected);

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("connect_error", () => setError("Chat connection failed."));

      socket.on("receive_message", (m: WireMessage) => {
        if (involvesPeer(m)) setMessages((prev) => [...prev, toMsg(m)]);
      });
      socket.on("message_sent", (m: WireMessage) => {
        if (involvesPeer(m)) {
          setMessages((prev) => {
            // Replace the optimistic pending bubble with the confirmed one.
            const withoutPending = prev.filter(
              (x) => !(x.pending && x.content === m.content),
            );
            return [...withoutPending, toMsg(m)];
          });
        }
      });
      socket.on("error_message", (msg: string) => setError(msg));
    });

    return () => {
      cancelled = true;
      const s = socketRef.current;
      if (s) {
        s.off("receive_message");
        s.off("message_sent");
        s.off("error_message");
        s.off("connect");
        s.off("disconnect");
        s.off("connect_error");
      }
    };
  }, [peerId, myId]);

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      const socket = socketRef.current;
      if (!trimmed || !socket) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `pending_${Date.now()}`,
          fromMe: true,
          content: trimmed,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);
      socket.emit("send_message", { receiverId: peerId, content: trimmed });
    },
    [peerId],
  );

  return { messages, connected, error, send };
}
