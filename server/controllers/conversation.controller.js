// controllers/conversationController.js
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { findById, findByEmail } from "../models/user.model.js"; // MySQL user lookup

// @desc    Get all conversations for user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    console.log("🔍 Searching conversations for user:", userId);
    console.log("📄 Page:", page, "Limit:", limit);

    // Debug: Check if user exists in MySQL
    try {
      const mysqlUser = await findById(userId);
      console.log("✅ MySQL User found:", mysqlUser ? "Yes" : "No");
      if (mysqlUser) {
        console.log("📋 MySQL User data:", {
          id: mysqlUser.user_id,
          email: mysqlUser.email,
          username: mysqlUser.username,
        });
      }
    } catch (mysqlError) {
      console.error("❌ MySQL user lookup failed:", mysqlError);
    }

    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ "lastMessage.timestamp": -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("💬 Raw conversations found:", conversations.length);
    console.log("📊 Conversation details:", conversations);

    // If no conversations, check if there are any messages that should create conversations
    if (conversations.length === 0) {
      console.log(
        "🔄 No conversations found, checking for existing messages..."
      );

      // Check if user has any messages in the system
      const userMessages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      }).limit(5);

      console.log("📨 User messages found:", userMessages.length);

      if (userMessages.length > 0) {
        console.log(
          "💡 User has messages but no conversations. Conversations need to be created."
        );
      }
    }

    // Enhance conversations with additional data
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== userId
        );

        console.log("👤 Other participant:", otherParticipant);

        // Get MySQL user data for additional info
        let mysqlUser = null;
        try {
          mysqlUser = await findById(otherParticipant.userId);
          console.log(
            "✅ Other participant MySQL data found:",
            mysqlUser ? "Yes" : "No"
          );
        } catch (error) {
          console.error("Error fetching MySQL user:", error);
        }

        return {
          ...conversation,
          otherParticipant: {
            ...otherParticipant,
            avatar: mysqlUser?.avatar_url,
            isOnline: false,
            lastSeen: mysqlUser?.last_login,
          },
          unreadCount: conversation.unreadCount?.get(userId) || 0,
        };
      })
    );

    const total = await Conversation.countDocuments({
      "participants.userId": userId,
    });

    console.log("📈 Total conversations:", total);
    console.log(
      "🎯 Final enhanced conversations:",
      enhancedConversations.length
    );

    res.json({
      success: true,
      data: enhancedConversations,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversations",
    });
  }
};

// @desc    Get single conversation
// @route   GET /api/conversations/:conversationId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Reset unread count for this user
    await conversation.resetUnread(userId);

    const otherParticipant = conversation.getOtherParticipant(userId);

    // Get MySQL user data
    let mysqlUser = null;
    try {
      mysqlUser = await findById(otherParticipant.userId);
    } catch (error) {
      console.error("Error fetching MySQL user:", error);
    }

    const enhancedConversation = {
      ...conversation.toObject(),
      otherParticipant: {
        ...otherParticipant,
        avatar: mysqlUser?.avatar_url,
        isOnline: false,
        lastSeen: mysqlUser?.last_login,
      },
    };

    res.json({
      success: true,
      data: enhancedConversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversation",
    });
  }
};

// @desc    Create or get conversation with user
// @route   POST /api/conversations
// @access  Private
export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.user.id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required",
      });
    }

    if (participantId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create conversation with yourself",
      });
    }

    // Get current user from MySQL
    const currentUserMysql = await findById(currentUserId);
    if (!currentUserMysql) {
      return res.status(404).json({
        success: false,
        message: "Current user not found",
      });
    }

    // Get participant from MySQL
    const participantMysql = await findById(participantId);
    if (!participantMysql) {
      return res.status(404).json({
        success: false,
        message: "Participant user not found",
      });
    }

    // Create conversation participants
    const currentUser = {
      userId: currentUserMysql.user_id.toString(),
      email: currentUserMysql.email,
      username: currentUserMysql.username,
    };

    const participant = {
      userId: participantMysql.user_id.toString(),
      email: participantMysql.email,
      username: participantMysql.username,
    };

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(
      currentUser,
      participant
    );

    // Reset unread count for current user
    await conversation.resetUnread(currentUserId);

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating conversation",
    });
  }
};

// @desc    Delete conversation
// @route   DELETE /api/conversations/:conversationId
// @access  Private
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Optionally delete all messages in this conversation
    await Message.deleteMany({
      $or: [
        {
          senderId: userId,
          receiverId: conversation.getOtherParticipant(userId).userId,
        },
        {
          senderId: conversation.getOtherParticipant(userId).userId,
          receiverId: userId,
        },
      ],
    });

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting conversation",
    });
  }
};

// @desc    Get conversation by participant
// @route   GET /api/conversations/participant/:participantId
// @access  Private
export const getConversationByParticipant = async (req, res) => {
  try {
    const { participantId } = req.params;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findOne({
      "participants.userId": { $all: [currentUserId, participantId] },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Reset unread count for current user
    await conversation.resetUnread(currentUserId);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Get conversation by participant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversation",
    });
  }
};
