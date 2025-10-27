// socket.js
import { Server } from "socket.io";
import Message from "./models/message.model.js";
import { findByEmail, findById } from "./models/user.model.js"; // Your MySQL functions
import { verifySocketToken } from "./middleware/verifySocketToken.js";

export default function socketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use(verifySocketToken);

  const onlineUsers = new Map(); // userId -> socket.id

  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`✅ User connected: ${userId} (${socket.id})`);
    }

    socket.on("send_message", async ({ receiverId, content }) => {
      try {
        const senderId = socket.user.id;
        console.log(`📨 Message from ${senderId} to ${receiverId}`);

        // Find receiver in MySQL
        let receiver;
        if (receiverId.includes("@")) {
          receiver = await findByEmail(receiverId); // Direct email string
        } else {
          receiver = await findById(receiverId);
        }

        if (!receiver) {
          console.log(`❌ Receiver not found: ${receiverId}`);
          socket.emit("error_message", "Receiver not found");
          return;
        }

        const actualReceiverId = receiver.user_id.toString();
        console.log(
          `✅ Receiver found: ${receiver.email} (ID: ${actualReceiverId})`
        );

        // Save message in MongoDB (just store IDs as strings)
        const msg = await Message.create({
          senderId: senderId, // string from MySQL user_id
          receiverId: actualReceiverId, // string from MySQL user_id
          content: content,
        });

        console.log("💾 Message saved to MongoDB");

        // Create simple message object for frontend
        const messageData = {
          _id: msg._id,
          senderId: {
            _id: senderId,
            username: socket.user.username,
            email: socket.user.email,
          },
          receiverId: {
            _id: actualReceiverId,
            username: receiver.username,
            email: receiver.email,
          },
          content: content,
          createdAt: msg.createdAt,
        };

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(actualReceiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", messageData);
          console.log(`📤 Delivered to online user: ${receiver.email}`);
        }

        // Confirm to sender
        socket.emit("message_sent", messageData);
        console.log(`✅ Message sent successfully`);
      } catch (err) {
        console.error("💥 Error sending message:", err);
        socket.emit("error_message", "Failed to send message");
      }
    });

    socket.on("disconnect", () => {
      if (userId) onlineUsers.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
}
