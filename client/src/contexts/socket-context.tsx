"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, disconnectSocket, sendMessageViaSocket, getCurrentSocket } from "../services/socket";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (receiverId: string, content: string) => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(getCurrentSocket());
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const reconnecting = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getSocket();
        if (!mounted) return;
        setSocket(s);
        setIsConnected(s.connected);

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        s.on("connect", onConnect);
        s.on("disconnect", onDisconnect);
        s.on("connect_error", () => {
          if (!reconnecting.current) reconnecting.current = true;
        });

        return () => {
          s.off("connect", onConnect);
          s.off("disconnect", onDisconnect);
        };
      } catch {
        // leave disconnected state if init fails
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const sendMessage = useCallback((receiverId: string, content: string) => {
    if (!receiverId || !content) return;
    sendMessageViaSocket(receiverId, content);
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({ socket, isConnected, sendMessage }),
    [socket, isConnected, sendMessage]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}


