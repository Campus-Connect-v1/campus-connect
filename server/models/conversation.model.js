import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: { type: String, required: true }, // MySQL user_id
        email: { type: String, required: true },
        username: { type: String, required: true },
        lastReadAt: { type: Date, default: Date.now },
      },
    ],
    lastMessage: {
      content: String,
      senderId: String,
      timestamp: { type: Date, default: Date.now },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for faster participant lookup
conversationSchema.index({ "participants.userId": 1 });

// Virtual for easier access
conversationSchema.virtual("id").get(function () {
  return this._id.toString();
});

// Method to get other participant
conversationSchema.methods.getOtherParticipant = function (currentUserId) {
  return this.participants.find((p) => p.userId !== currentUserId);
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function (message) {
  this.lastMessage = {
    content: message.content,
    senderId: message.senderId,
    timestamp: message.createdAt || new Date(),
  };
  return this.save();
};

// Method to increment unread count
conversationSchema.methods.incrementUnread = function (userId) {
  const currentCount = this.unreadCount.get(userId) || 0;
  this.unreadCount.set(userId, currentCount + 1);
  return this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnread = function (userId) {
  this.unreadCount.set(userId, 0);
  return this.save();
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function (
  participant1,
  participant2
) {
  const { userId: userId1, email: email1, username: username1 } = participant1;
  const { userId: userId2, email: email2, username: username2 } = participant2;

  // Look for existing conversation
  let conversation = await this.findOne({
    "participants.userId": { $all: [userId1, userId2] },
  });

  // Create new conversation if not exists
  if (!conversation) {
    conversation = await this.create({
      participants: [
        { userId: userId1, email: email1, username: username1 },
        { userId: userId2, email: email2, username: username2 },
      ],
      unreadCount: new Map([
        [userId1, 0],
        [userId2, 0],
      ]),
    });
  }

  return conversation;
};

export default mongoose.model("Conversation", conversationSchema);
