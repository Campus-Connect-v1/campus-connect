// scripts/populateConversations.js
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js"; // Adjust path as needed
import dotenv from "dotenv";
dotenv.config();
// Sample user data
const USERS = [
  {
    userId: "user_1",
    email: "jsmith@stanford.edu",
    username: "john_doe",
  },
  {
    userId: "user_1761569942452_dt3igs8qw",
    email: "leslieajayi29@stanford.edu",
    username: "jane_smith",
  },
];

// Sample messages for the conversation
const SAMPLE_MESSAGES = [
  "Hey there! How's it going?",
  "I'm doing great! Just working on some projects.",
  "That's awesome! What kind of projects?",
  "Mostly web development with React and Node.js",
  "Nice! I've been learning React too.",
  "We should collaborate sometime!",
  "Definitely! Let me know when you're free.",
  "How about next week?",
  "Sounds good! I'll check my schedule.",
  "Great, talk to you soon!",
  "By the way, did you see the new features?",
  "Not yet, what's new?",
  "They added real-time messaging and file sharing",
  "That's cool! Can't wait to try it out",
  "Yeah, it's really smooth and fast",
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Create test conversation
const createTestConversation = async () => {
  try {
    // Clear existing conversations for these users (optional)
    await Conversation.deleteMany({
      "participants.userId": {
        $in: [USERS[0].userId, USERS[1].userId],
      },
    });
    console.log("🧹 Cleared existing conversations for test users");

    // Create conversation
    const conversation = await Conversation.findOrCreate(USERS[0], USERS[1]);
    console.log("✅ Conversation created:", conversation._id);

    // Add sample messages to the conversation
    let timestamp = new Date();

    for (let i = 0; i < SAMPLE_MESSAGES.length; i++) {
      const message = {
        content: SAMPLE_MESSAGES[i],
        senderId: i % 2 === 0 ? USERS[0].userId : USERS[1].userId, // Alternate senders
        createdAt: new Date(
          timestamp.getTime() - (SAMPLE_MESSAGES.length - i) * 60000
        ), // Stagger timestamps
      };

      await conversation.updateLastMessage(message);

      // Increment unread count for receiver
      const receiverId =
        message.senderId === USERS[0].userId
          ? USERS[1].userId
          : USERS[0].userId;
      await conversation.incrementUnread(receiverId);

      console.log(`💬 Added message ${i + 1}: "${message.content}"`);
    }

    console.log("🎉 Test conversation populated successfully!");
    console.log("📊 Conversation details:");
    console.log({
      id: conversation._id,
      participants: conversation.participants,
      lastMessage: conversation.lastMessage,
      unreadCount: Object.fromEntries(conversation.unreadCount),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });

    return conversation;
  } catch (error) {
    console.error("❌ Error creating test conversation:", error);
    throw error;
  }
};

// Main function
const populateData = async () => {
  await connectDB();
  await createTestConversation();

  // Close connection
  await mongoose.connection.close();
  console.log("🔌 MongoDB connection closed");
  process.exit(0);
};

// Run the script
populateData().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
