import { io, Socket } from "socket.io-client"
import { storage } from "@/src/utils/storage"

class SocketService {
  private socket: Socket | null = null
  private static instance: SocketService

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  async connect() {
    if (this.socket?.connected) {
      return this.socket
    }

    const token = await storage.getToken()
    const SOCKET_URL = "http://localhost:5000" // Update with your server URL

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    })

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id)
    })

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected")
    })

    this.socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  // Typing indicator methods
  emitTyping(conversationId: string, receiverId: string) {
    if (this.socket?.connected) {
      this.socket.emit("typing", { conversationId, receiverId })
    }
  }

  emitStopTyping(conversationId: string, receiverId: string) {
    if (this.socket?.connected) {
      this.socket.emit("stop_typing", { conversationId, receiverId })
    }
  }

  onTyping(callback: (data: { conversationId: string; userId: string; username: string }) => void) {
    if (this.socket) {
      this.socket.on("user_typing", callback)
    }
  }

  onStopTyping(callback: (data: { conversationId: string; userId: string }) => void) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback)
    }
  }

  // Message methods
  sendMessage(receiverId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit("send_message", { receiverId, content })
    }
  }

  onMessageReceived(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("receive_message", callback)
    }
  }

  onMessageSent(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("message_sent", callback)
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }
}

export const socketService = SocketService.getInstance()
