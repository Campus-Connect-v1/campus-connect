import { mockConversations,mockMessages } from "../mocks/messaging-data"

export const dataService = {
  // Get all conversations
  getConversations() {
    return mockConversations.map((conv:any) => ({
      id: conv.id,
      participant_name: `${conv.participants[0].first_name} ${conv.participants[0].last_name}`,
      participant_avatar: conv.participants[0].profile_picture_url,
      participant_headline: conv.participants[0].profile_headline,
      last_message: conv.lastMessage,
      last_message_time: conv.lastMessageTime,
      unread_count: conv.unreadCount,
      is_online: conv.isOnline,
    }))
  },

  // Get messages for a specific conversation
  getChat(conversationId: string) {
    const conversation = mockConversations.find((c) => c.id === conversationId)
    const messages = mockMessages[conversationId as keyof typeof mockMessages] || []

    if (!conversation) throw new Error("Conversation not found")

    return {
      conversation: {
        id: conversation.id,
        participant_name: `${conversation.participants[0].first_name} ${conversation.participants[0].last_name}`,
        participant_avatar: conversation.participants[0].profile_picture_url,
        participant_headline: conversation.participants[0].profile_headline,
        is_online: conversation.isOnline,
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        sender_id: msg.senderId,
        sender_name: msg.senderName,
        sender_avatar: msg.senderAvatar,
        content: msg.content,
        timestamp: msg.timestamp,
        is_current_user: msg.isCurrentUser,
      })),
    }
  },

  // Add a new message to a conversation
  addMessage(conversationId: string, content: string) {
    const newMessage = {
      id: `msg-${Date.now()}`,
      sender_id: "current-user",
      sender_name: "You",
      sender_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
      content,
      timestamp: new Date(),
      is_current_user: true,
    }
    return newMessage
  },
}
