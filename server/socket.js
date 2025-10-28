// socket.js
import { Server } from "socket.io";
import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js"; // NEW
import { findByEmail, findById } from "./models/user.model.js";
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

        // Find receiver in MySQL (EXISTING CODE - UNCHANGED)
        let receiver;
        if (receiverId.includes("@")) {
          receiver = await findByEmail(receiverId);
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

        // Save message in MongoDB (EXISTING CODE - UNCHANGED)
        const msg = await Message.create({
          senderId: senderId,
          receiverId: actualReceiverId,
          content: content,
        });

        console.log("💾 Message saved to MongoDB");

        // NEW: Update conversation system (doesn't affect existing flow)
        try {
          const senderParticipant = {
            userId: senderId,
            email: socket.user.email,
            username: socket.user.username,
          };

          const receiverParticipant = {
            userId: actualReceiverId,
            email: receiver.email,
            username: receiver.username,
          };

          // Find or create conversation
          const conversation = await Conversation.findOrCreate(
            senderParticipant,
            receiverParticipant
          );

          // Update conversation with last message
          await conversation.updateLastMessage(msg);

          // Increment unread count for receiver
          await conversation.incrementUnread(actualReceiverId);

          console.log(`💬 Conversation updated: ${conversation._id}`);
        } catch (convError) {
          // If conversation update fails, don't break the message sending
          console.error(
            "⚠️ Conversation update failed, but message sent:",
            convError.message
          );
        }

        // Create simple message object for frontend (EXISTING CODE - UNCHANGED)
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

        // Emit to receiver if online (EXISTING CODE - UNCHANGED)
        const receiverSocketId = onlineUsers.get(actualReceiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", messageData);
          console.log(`📤 Delivered to online user: ${receiver.email}`);
        }

        // Confirm to sender (EXISTING CODE - UNCHANGED)
        socket.emit("message_sent", messageData);
        console.log(`✅ Message sent successfully`);
      } catch (err) {
        console.error("💥 Error sending message:", err);
        socket.emit("error_message", "Failed to send message");
      }
    });

    // NEW: Mark message as read (optional - doesn't affect existing flow)
    socket.on("mark_message_read", async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.receiverId === socket.user.id) {
          message.status = "read";
          await message.save();

          // Update conversation unread count
          const conversation = await Conversation.findOne({
            "participants.userId": {
              $all: [message.senderId, message.receiverId],
            },
          });

          if (conversation) {
            await conversation.resetUnread(socket.user.id);
          }

          socket.emit("message_read_success", messageId);
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    });

    // NEW: Get conversation list (optional)
    socket.on("get_conversations", async () => {
      try {
        const conversations = await Conversation.find({
          "participants.userId": socket.user.id,
        })
          .sort({ "lastMessage.timestamp": -1 })
          .limit(50);

        socket.emit("conversations_list", conversations);
      } catch (error) {
        console.error("Error getting conversations:", error);
        socket.emit("conversations_error", "Failed to get conversations");
      }
    });

    socket.on("disconnect", () => {
      if (userId) onlineUsers.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
}
