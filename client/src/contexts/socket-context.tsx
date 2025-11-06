"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  getSocket,
  disconnectSocket,
  sendMessageViaSocket,
  getCurrentSocket,
  sendTypingIndicator,
  initiateCall as initiateCallService,
  acceptCall as acceptCallService,
  rejectCall as rejectCallService,
  endCall as endCallService,
} from "../services/socket";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (receiverId: string, content: string) => void;
  sendTyping: (receiverId: string, isTyping: boolean) => void;
  initiateCall: (receiverId: string, isVideoCall: boolean) => void;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  endCall: (callId: string) => void;
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

  const sendTyping = useCallback((receiverId: string, isTyping: boolean) => {
    if (!receiverId) return;
    sendTypingIndicator(receiverId, isTyping);
  }, []);

  const initiateCall = useCallback((receiverId: string, isVideoCall: boolean) => {
    if (!receiverId) return;
    initiateCallService(receiverId, isVideoCall);
  }, []);

  const acceptCall = useCallback((callId: string) => {
    if (!callId) return;
    acceptCallService(callId);
  }, []);

  const rejectCall = useCallback((callId: string) => {
    if (!callId) return;
    rejectCallService(callId);
  }, []);

  const endCall = useCallback((callId: string) => {
    if (!callId) return;
    endCallService(callId);
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      isConnected,
      sendMessage,
      sendTyping,
      initiateCall,
      acceptCall,
      rejectCall,
      endCall,
    }),
    [socket, isConnected, sendMessage, sendTyping, initiateCall, acceptCall, rejectCall, endCall]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within a SocketProvider");
  return ctx;
}


