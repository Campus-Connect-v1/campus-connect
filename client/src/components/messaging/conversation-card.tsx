// import type React from "react"
// import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native"

// interface ConversationCardProps {
//   conversation: {
//     id: string
//     participant_name: string
//     participant_avatar: string
//     last_message: string
//     last_message_time: string
//     unread_count: number
//     is_online: boolean
//   }
//   onPress: () => void
// }

// const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, onPress }) => {
//   const isUnread = conversation.unread_count > 0

//   return (
//     <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
//       {/* Avatar with online indicator */}
//       <View style={styles.avatarContainer}>
//         <Image source={{ uri: conversation.participant_avatar }} style={styles.avatar} />
//         {conversation.is_online && <View style={styles.onlineIndicator} />}
//       </View>

//       {/* Message content */}
//       <View style={styles.contentContainer}>
//         <View style={styles.headerRow}>
//           <Text style={[styles.name, isUnread && { fontFamily: "Gilroy-SemiBold" }]} numberOfLines={1}>
//             {conversation.participant_name}
//           </Text>
//           <Text style={styles.time}>{conversation.last_message_time}</Text>
//         </View>

//         <Text style={[styles.message, isUnread && { color: "#0f172a", fontFamily: "Gilroy-Medium" }]} numberOfLines={1}>
//           {conversation.last_message}
//         </Text>
//       </View>

//       {/* Unread badge */}
//       {isUnread && (
//         <View style={styles.unreadBadge}>
//           <Text style={styles.unreadText}>{conversation.unread_count}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   avatarContainer: {
//     position: "relative",
//     marginRight: 12,
//   },
//   avatar: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#e2e8f0",
//   },
//   onlineIndicator: {
//     position: "absolute",
//     bottom: 0,
//     right: 0,
//     width: 14,
//     height: 14,
//     borderRadius: 7,
//     backgroundColor: "#10b981",
//     borderWidth: 2,
//     borderColor: "#fff",
//   },
//   contentContainer: {
//     flex: 1,
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 4,
//   },
//   name: {
//     fontFamily: "Gilroy-Regular",
//     fontSize: 15,
//     color: "#0f172a",
//     flex: 1,
//   },
//   time: {
//     fontFamily: "Gilroy-Regular",
//     fontSize: 12,
//     color: "#94a3b8",
//     marginLeft: 8,
//   },
//   message: {
//     fontFamily: "Gilroy-Regular",
//     fontSize: 13,
//     color: "#64748b",
//   },
//   unreadBadge: {
//     marginLeft: 12,
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "#ef4444",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   unreadText: {
//     fontFamily: "Gilroy-SemiBold",
//     fontSize: 11,
//     color: "#fff",
//   },
// })

// export default ConversationCard



import type React from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native"
import { formatMessageTime } from "@/src/utils/format-time"

interface ConversationCardProps {
  conversation: {
    id: string
    participant_name: string
    participant_avatar: string
    last_message: string
    last_message_time: Date | string
    unread_count: number
    is_online: boolean
  }
  onPress: () => void
}

const ConversationCard: React.FC<ConversationCardProps> = ({ conversation, onPress }) => {
  const isUnread = conversation.unread_count > 0
  const formattedTime = formatMessageTime(conversation.last_message_time)

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      {/* Avatar with online indicator */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: conversation.participant_avatar }} style={styles.avatar} />
        {conversation.is_online && <View style={styles.onlineIndicator} />}
      </View>

      {/* Message content */}
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, isUnread && { fontFamily: "Gilroy-SemiBold" }]} numberOfLines={1}>
            {conversation.participant_name}
          </Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>

        <Text style={[styles.message, isUnread && { color: "#0f172a", fontFamily: "Gilroy-Medium" }]} numberOfLines={1}>
          {conversation.last_message}
        </Text>
      </View>

      {/* Unread badge */}
      {isUnread && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{conversation.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e2e8f0",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontFamily: "Gilroy-Regular",
    fontSize: 15,
    color: "#0f172a",
    flex: 1,
  },
  time: {
    fontFamily: "Gilroy-Regular",
    fontSize: 12,
    color: "#94a3b8",
    marginLeft: 8,
  },
  message: {
    fontFamily: "Gilroy-Regular",
    fontSize: 13,
    color: "#64748b",
  },
  unreadBadge: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: 11,
    color: "#fff",
  },
})

export default ConversationCard
