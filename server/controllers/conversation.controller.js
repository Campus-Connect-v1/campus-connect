// controllers/conversationController.js
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { findById, findByIdsModel } from "../models/user.model.js";
import mongoose from "mongoose";

const participantIdentity = (participant, mysqlUser) => ({
  ...participant,
  username:
    [mysqlUser?.first_name, mysqlUser?.last_name].filter(Boolean).join(" ") ||
    participant.username,
  avatar: mysqlUser?.profile_picture_url ?? null,
  isOnline: false,
  lastSeen: mysqlUser?.last_login ?? null,
});

const displayName = (user) =>
  [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
  user?.username ||
  user?.email?.split("@")[0] ||
  "Campus user";

const unreadFor = (unreadCount, userId) =>
  unreadCount instanceof Map
    ? unreadCount.get(userId) || 0
    : unreadCount?.[userId] || 0;

// @desc    Get all conversations for user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .sort({ "lastMessage.timestamp": -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enhance conversations with additional data. Fetch every participant's
    // MySQL row in one batched query instead of one query per conversation.
    const otherParticipantIds = [
      ...new Set(
        conversations
          .map(
            (conversation) =>
              conversation.participants.find((p) => p.userId !== userId)
                ?.userId
          )
          .filter(Boolean)
      ),
    ];

    let mysqlUsersById = new Map();
    try {
      const mysqlUsers = await findByIdsModel(otherParticipantIds);
      mysqlUsersById = new Map(
        mysqlUsers.map((user) => [String(user.user_id), user])
      );
    } catch (error) {
      console.error("Error fetching MySQL users:", error);
    }

    const enhancedConversations = conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId
      );
      const mysqlUser = mysqlUsersById.get(String(otherParticipant?.userId)) ?? null;

      return {
        ...conversation,
        otherParticipant: participantIdentity(otherParticipant, mysqlUser),
        unreadCount: unreadFor(conversation.unreadCount, userId),
      };
    });

    const total = await Conversation.countDocuments({
      "participants.userId": userId,
    });

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

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

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
      otherParticipant: participantIdentity(
        otherParticipant.toObject(),
        mysqlUser
      ),
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
      username: displayName(currentUserMysql),
    };

    const participant = {
      userId: participantMysql.user_id.toString(),
      email: participantMysql.email,
      username: displayName(participantMysql),
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

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

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

    const otherParticipant = conversation.getOtherParticipant(currentUserId);
    const mysqlUser = await findById(otherParticipant.userId).catch(() => null);

    res.json({
      success: true,
      data: {
        ...conversation.toObject(),
        otherParticipant: participantIdentity(
          otherParticipant.toObject(),
          mysqlUser
        ),
        unreadCount: 0,
      },
    });
  } catch (error) {
    console.error("Get conversation by participant error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversation",
    });
  }
};

// @desc    Get paginated message history for one conversation
// @route   GET /api/conversations/:conversationId/messages
// @access  Private (conversation participants only)
export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 50, 1),
      100
    );
    const before = req.query.before ? new Date(req.query.before) : null;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    if (before && Number.isNaN(before.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "before must be a valid date" });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    }).lean();

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== userId
    );
    if (!otherParticipant) {
      return res.status(409).json({
        success: false,
        message: "Conversation has no other participant",
      });
    }

    const query = {
      $or: [
        { senderId: userId, receiverId: otherParticipant.userId },
        { senderId: otherParticipant.userId, receiverId: userId },
      ],
      ...(before ? { createdAt: { $lt: before } } : {}),
    };

    const rows = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse();
    const userIds = [
      ...new Set(
        page.flatMap((message) => [message.senderId, message.receiverId])
      ),
    ];
    const identities = new Map();

    await Promise.all(
      userIds.map(async (id) => {
        const user = await findById(id).catch(() => null);
        identities.set(id, {
          _id: id,
          username:
            [user?.first_name, user?.last_name]
              .filter(Boolean)
              .join(" ") || undefined,
          email: user?.email,
        });
      })
    );

    res.json({
      success: true,
      data: page.map((message) => ({
        ...message,
        senderId: identities.get(message.senderId) ?? {
          _id: message.senderId,
        },
        receiverId: identities.get(message.receiverId) ?? {
          _id: message.receiverId,
        },
      })),
      pagination: {
        hasMore,
        oldest: page[0]?.createdAt ?? null,
      },
    });
  } catch (error) {
    console.error("Get conversation messages error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    });
  }
};
