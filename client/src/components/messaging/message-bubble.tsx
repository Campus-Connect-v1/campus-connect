import type React from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { formatChatTime } from "@/src/utils/format-time"

interface MessageBubbleProps {
  message: {
    id: string
    content: string
    sender_id: string
    timestamp: Date | string
    sender_avatar?: string
    is_current_user: boolean
  }
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isCurrentUser = message.is_current_user
  const formattedTime = formatChatTime(message.timestamp)

  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer]}>
      {!isCurrentUser && message.sender_avatar && (
        <Image source={{ uri: message.sender_avatar }} style={styles.avatar} />
      )}

      <View style={[styles.bubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
        <Text style={[styles.text, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
          {message.content}
        </Text>
        <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
          {formattedTime}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 4,
    alignItems: "flex-end",
  },
  currentUserContainer: {
    justifyContent: "flex-end",
  },
  otherUserContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: "#e2e8f0",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  currentUserBubble: {
    backgroundColor: "#ef4444",
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: "#f1f5f9",
    borderBottomLeftRadius: 4,
  },
  text: {
    fontFamily: "Gilroy-Regular",
    fontSize: 14,
  },
  currentUserText: {
    color: "#fff",
  },
  otherUserText: {
    color: "#0f172a",
  },
  timestamp: {
    fontFamily: "Gilroy-Regular",
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  otherUserTimestamp: {
    color: "#94a3b8",
  },
})

export default MessageBubble
