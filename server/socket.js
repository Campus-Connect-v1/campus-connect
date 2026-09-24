// socket.js
import { Server } from "socket.io";
import Message from "./models/message.model.js";
import Conversation from "./models/conversation.model.js"; // NEW
import { findByEmail, findById } from "./models/user.model.js";
import { verifySocketToken } from "./middleware/verifySocketToken.js";
import { isOriginAllowed } from "./config/cors.js";
import { registerRealtime, userRoom, postRoom, campusRoom } from "./realtime.js";

// send_message looked up sender AND receiver with a full MySQL join
// (findById/findByEmail) on every single message -- the highest-frequency
// event in the app. Only first/last name are actually used from that row, and
// they change rarely, so cache the lookup briefly instead of hitting MySQL
// every time the same pair of users chats.
const IDENTITY_CACHE_TTL_MS = 5 * 60 * 1000;
const userIdentityCache = new Map(); // "id:<id>" | "email:<email>" -> { data, expiresAt }

function cacheUserIdentity(user) {
  const expiresAt = Date.now() + IDENTITY_CACHE_TTL_MS;
  userIdentityCache.set(`id:${user.user_id}`, { data: user, expiresAt });
  if (user.email) {
    userIdentityCache.set(`email:${user.email}`, { data: user, expiresAt });
  }
}

async function getCachedUserById(userId) {
  const key = `id:${userId}`;
  const cached = userIdentityCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const user = await findById(userId);
  if (user) cacheUserIdentity(user);
  return user;
}

async function getCachedUserByEmail(email) {
  const key = `email:${email}`;
  const cached = userIdentityCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const user = await findByEmail(email);
  if (user) cacheUserIdentity(user);
  return user;
}

export default function socketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      // Same policy as the HTTP app: named origins only, but native clients
      // that send no Origin header still get through.
      origin(origin, callback) {
        if (isOriginAllowed(origin)) return callback(null, true);
        callback(new Error(`Blocked by CORS: ${origin}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Controllers and models emit through realtime.js rather than importing this
  // module, which would be circular. Register before any listener is attached.
  registerRealtime(io);

  io.use(verifySocketToken);

  const onlineUsers = new Map(); // userId -> socket.id

  /**
   * Per-socket throttle.
   *
   * The HTTP limiters do not apply here: a socket event is one frame on an
   * already-open connection, so send_message over the socket bypassed every
   * control on the REST side. A simple token bucket per socket per event is
   * enough -- the connection is already authenticated, so this is about
   * flooding rather than identity.
   *
   * Buckets live on the socket and die with it, which is the right lifetime:
   * a reconnect is cheap for a real client and no help to a flooder, who has
   * to redo the handshake to get a fresh allowance.
   */
  const RATES = {
    send_message: { max: 30, windowMs: 60_000 },
    mark_message_read: { max: 200, windowMs: 60_000 },
    get_conversations: { max: 30, windowMs: 60_000 },
    join_post: { max: 300, windowMs: 60_000 },
    leave_post: { max: 300, windowMs: 60_000 },
    whoami: { max: 30, windowMs: 60_000 },
  };

  const allow = (socket, event) => {
    const rate = RATES[event];
    if (!rate) return true;

    socket.data.buckets ??= {};
    const now = Date.now();
    const bucket = (socket.data.buckets[event] ??= { count: 0, resetAt: now + rate.windowMs });

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + rate.windowMs;
    }

    if (++bucket.count > rate.max) {
      // Told once per window, not per frame: a client in a loop would
      // otherwise be handed a second flood back.
      if (bucket.count === rate.max + 1) {
        socket.emit("rate_limited", { event, retry_in_ms: bucket.resetAt - now });
        console.warn(
          JSON.stringify({ level: "warn", scope: "socket.rate_limit", event, user_id: socket.user?.id })
        );
      }
      return false;
    }
    return true;
  };

  io.on("connection", (socket) => {
    // Applied as a catch-all rather than inside each handler, so an event
    // added later is covered by default instead of by remembering to.
    socket.use(([event], next) =>
      allow(socket, event) ? next() : next(new Error("rate limited"))
    );

    const userId = socket.user?.id;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      // onlineUsers keeps one socket per user, so a second device evicts the
      // first. The room holds every live socket; new emits address the room.
      socket.join(userRoom(userId));
      // Campus room: how a new post reaches everyone whose discovery feed
      // would include it, without enumerating them.
      if (socket.user?.university_id) {
        socket.join(campusRoom(socket.user.university_id));
      }
      console.log(`✅ User connected: ${userId} (${socket.id})`);
    }

    socket.on("send_message", async ({ receiverId, content }) => {
      try {
        const senderId = socket.user.id;
        console.log(`📨 Message from ${senderId} to ${receiverId}`);

        const sender = await getCachedUserById(senderId);

        // Find receiver in MySQL (cached -- see getCachedUserById/ByEmail above)
        let receiver;
        if (receiverId.includes("@")) {
          receiver = await getCachedUserByEmail(receiverId);
        } else {
          receiver = await getCachedUserById(receiverId);
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
            username:
              [sender?.first_name, sender?.last_name].filter(Boolean).join(" ") ||
              socket.user.email?.split("@")[0] ||
              "Campus user",
          };

          const receiverParticipant = {
            userId: actualReceiverId,
            email: receiver.email,
            username:
              [receiver.first_name, receiver.last_name].filter(Boolean).join(" ") ||
              receiver.username ||
              receiver.email?.split("@")[0] ||
              "Campus user",
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
            username:
              [sender?.first_name, sender?.last_name].filter(Boolean).join(" ") ||
              socket.user.email?.split("@")[0] ||
              "Campus user",
            email: socket.user.email,
          },
          receiverId: {
            _id: actualReceiverId,
            username:
              [receiver.first_name, receiver.last_name].filter(Boolean).join(" ") ||
              receiver.email?.split("@")[0] ||
              "Campus user",
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

    // ---- Post rooms ---------------------------------------------------
    //
    // A client opening a post subscribes to it; likes and comments from other
    // people then arrive live. Writes still go over HTTP -- the REST handlers
    // own validation, ownership checks and notifications, and duplicating that
    // logic in a socket handler is how the two drift apart. These events are
    // subscription only, so there is nothing here to authorise beyond the
    // handshake: post visibility is already enforced by GET /social/posts/:id.

    socket.on("join_post", (postId) => {
      if (typeof postId !== "string" || !postId) return;
      socket.join(postRoom(postId));
    });

    socket.on("leave_post", (postId) => {
      if (typeof postId !== "string" || !postId) return;
      socket.leave(postRoom(postId));
    });

    // Lets the client tell the REST API which socket it is, so its own writes
    // are not echoed back at it. Sent as the x-socket-id header on requests.
    socket.on("whoami", () => socket.emit("socket_id", socket.id));

    socket.on("disconnect", () => {
      if (userId) onlineUsers.delete(userId);
      console.log(`❌ User disconnected: ${userId}`);
    });
  });
}
