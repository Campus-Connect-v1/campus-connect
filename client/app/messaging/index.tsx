// // "use client"

// // import type React from "react"
// // import { useEffect, useRef, useState } from "react"
// // import {
// //   Animated,
// //   View,
// //   Text,
// //   StatusBar,
// //   TouchableOpacity,
// //   ActivityIndicator,
// //   Dimensions,
// //   FlatList,
// // } from "react-native"
// // import { SafeAreaView } from "react-native-safe-area-context"
// // import { Ionicons } from "@expo/vector-icons"
// // import { router } from "expo-router"
// // import useSWR from "swr"
// // import { fetcher } from "@/src/utils/fetcher"
// // import ConversationCard from "@/src/components/messaging/conversation-card"
// // import SearchBar from "@/src/components/messaging/search-bar"
// // import DropdownAlert from "@/src/components/ui/DropdownAlert"
// // import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"

// // const { width } = Dimensions.get("window")

// // const MessagesScreen: React.FC = () => {
// //   const { alert, hideAlert, error: toast } = useDropdownAlert()
// //   const { data, isLoading, mutate } = useSWR<any>("/messages/conversations", fetcher)
// //   const [searchQuery, setSearchQuery] = useState("")
// //   const [filteredConversations, setFilteredConversations] = useState<any[]>([])

// //   // entrance animation
// //   const fadeAnim = useRef(new Animated.Value(0)).current
// //   const slideAnim = useRef(new Animated.Value(20)).current

// //   useEffect(() => {
// //     Animated.parallel([
// //       Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
// //       Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
// //     ]).start()
// //   }, [])

// //   useEffect(() => {
// //     if (data?.conversations) {
// //       const filtered = data.conversations.filter((conv: any) =>
// //         conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()),
// //       )
// //       setFilteredConversations(filtered)
// //     }
// //   }, [data, searchQuery])

// //   if (isLoading) {
// //     return (
// //       <SafeAreaView className="flex-1 items-center justify-center bg-white">
// //         <ActivityIndicator size="large" color="#ef4444" />
// //         <Text className="mt-4 text-gray-500">Loading conversations...</Text>
// //       </SafeAreaView>
// //     )
// //   }

// //   const conversations = filteredConversations || []

// //   return (
// //     <>
// //       <StatusBar barStyle="dark-content" />
// //       <SafeAreaView className="flex-1 bg-white">
// //         <DropdownAlert
// //           visible={alert.visible}
// //           type={alert.type}
// //           title={alert.title}
// //           message={alert.message}
// //           onDismiss={hideAlert}
// //         />

// //         {/* Header */}
// //         <View className="px-4 py-4 border-b border-gray-100">
// //           <View className="flex-row items-center justify-between mb-4">
// //             <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 28, color: "#0f172a" }}>Messages</Text>
// //             <TouchableOpacity onPress={() => router.push("/messaging/new")} className="p-2">
// //               <Ionicons name="create-outline" size={24} color="#ef4444" />
// //             </TouchableOpacity>
// //           </View>

// //           {/* Search Bar */}
// //           <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
// //         </View>

// //         {/* Conversations List */}
// //         <Animated.View
// //           style={{
// //             flex: 1,
// //             opacity: fadeAnim,
// //             transform: [{ translateY: slideAnim }],
// //           }}
// //         >
// //           {conversations.length > 0 ? (
// //             <FlatList
// //               data={conversations}
// //               keyExtractor={(item) => item.id}
// //               renderItem={({ item }) => (
// //                 <ConversationCard conversation={item} onPress={() => router.push(`/messaging/${item.id}`)} />
// //               )}
// //               scrollEnabled={true}
// //               contentContainerStyle={{ paddingVertical: 8 }}
// //             />
// //           ) : (
// //             <View className="flex-1 items-center justify-center">
// //               <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
// //               <Text style={{ fontFamily: "Gilroy-Regular", color: "#94a3b8", marginTop: 12 }}>
// //                 {searchQuery ? "No conversations found" : "No messages yet"}
// //               </Text>
// //               <Text style={{ fontFamily: "Gilroy-Regular", color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>
// //                 Start a conversation to connect with classmates
// //               </Text>
// //             </View>
// //           )}
// //         </Animated.View>
// //       </SafeAreaView>
// //     </>
// //   )
// // }

// // export default MessagesScreen


// "use client"

// import type React from "react"
// import { useEffect, useRef, useState } from "react"
// import {
//   Animated,
//   View,
//   Text,
//   StatusBar,
//   TouchableOpacity,
//   ActivityIndicator,
//   FlatList,
// } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { Ionicons } from "@expo/vector-icons"
// import { router } from "expo-router"
// import useSWR from "swr"
// import { fetcher } from "@/src/utils/fetcher"
// import ConversationCard from "@/src/components/messaging/conversation-card"
// import SearchBar from "@/src/components/messaging/search-bar"
// import DropdownAlert from "@/src/components/ui/DropdownAlert"
// import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"
// import { mockConversations } from "@/src/mocks/messaging-data" // ✅ import mock data

// const MessagesScreen: React.FC = () => {
//   const { alert, hideAlert } = useDropdownAlert()
//   const { data, error, isLoading } = useSWR<any>("/messages/conversations", fetcher)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [filteredConversations, setFilteredConversations] = useState<any[]>([])

//   // entrance animation
//   const fadeAnim = useRef(new Animated.Value(0)).current
//   const slideAnim = useRef(new Animated.Value(20)).current

//   // Animate entrance
//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
//       Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
//     ]).start()
//   }, [])

//   // Handle data (use mock fallback)
//   const conversations = data?.conversations || mockConversations

//   // Filter conversations by search query
//   useEffect(() => {
//     const filtered = conversations.filter((conv: any) =>
//       conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()),
//     )
//     setFilteredConversations(filtered)
//   }, [searchQuery, conversations])

//   // Loading state
//   if (isLoading && !data) {
//     return (
//       <SafeAreaView className="flex-1 items-center justify-center bg-white">
//         <ActivityIndicator size="large" color="#ef4444" />
//         <Text className="mt-4 text-gray-500">Loading conversations...</Text>
//       </SafeAreaView>
//     )
//   }

//   return (
//     <>
//       <StatusBar barStyle="dark-content" />
//       <SafeAreaView className="flex-1 bg-white">
//         <DropdownAlert
//           visible={alert.visible}
//           type={alert.type}
//           title={alert.title}
//           message={alert.message}
//           onDismiss={hideAlert}
//         />

//         {/* Header */}
//         <View className="px-4 py-4 border-b border-gray-100">
//           <View className="flex-row items-center justify-between mb-4">
//             <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 28, color: "#0f172a" }}>
//               Messages
//             </Text>
//             <TouchableOpacity onPress={() => router.push("/messaging/new")} className="p-2">
//               <Ionicons name="create-outline" size={24} color="#ef4444" />
//             </TouchableOpacity>
//           </View>

//           {/* Search Bar */}
//           <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
//         </View>

//         {/* Conversations List */}
//         <Animated.View
//           style={{
//             flex: 1,
//             opacity: fadeAnim,
//             transform: [{ translateY: slideAnim }],
//           }}
//         >
//           {filteredConversations.length > 0 ? (
//             <FlatList
//               data={filteredConversations}
//               keyExtractor={(item) => item.id}
//               renderItem={({ item }) => (
//                 <ConversationCard
//                   conversation={item}
//                   onPress={() => router.push(`/messaging/${item.id}`)}
//                 />
//               )}
//               scrollEnabled={true}
//               contentContainerStyle={{ paddingVertical: 8 }}
//             />
//           ) : (
//             <View className="flex-1 items-center justify-center">
//               <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
//               <Text style={{ fontFamily: "Gilroy-Regular", color: "#94a3b8", marginTop: 12 }}>
//                 {searchQuery ? "No conversations found" : "No messages yet"}
//               </Text>
//               <Text
//                 style={{
//                   fontFamily: "Gilroy-Regular",
//                   color: "#cbd5e1",
//                   fontSize: 12,
//                   marginTop: 4,
//                 }}
//               >
//                 Start a conversation to connect with classmates
//               </Text>
//             </View>
//           )}
//         </Animated.View>
//       </SafeAreaView>
//     </>
//   )
// }

// export default MessagesScreen


"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Animated, View, Text, StatusBar, TouchableOpacity, ActivityIndicator, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import ConversationCard from "@/src/components/messaging/conversation-card"
import SearchBar from "@/src/components/messaging/search-bar"
import { dataService } from "@/src/services/data-service"

const MessagesScreen: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([])
  const [filteredConversations, setFilteredConversations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loadConversations = () => {
      try {
        const data = dataService.getConversations()
        setConversations(data)
        setFilteredConversations(data)
      } catch (error) {
        console.error("Failed to load conversations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [])

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter((conv) =>
      conv.participant_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  const handleConversationPress = (conversationId: string) => {
    router.push(`/messaging/chats/${conversationId}`)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ fontFamily: "Gilroy-Regular", marginTop: 12, color: "#64748b" }}>Loading conversations...</Text>
      </SafeAreaView>
    )
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 28, color: "#0f172a" }}>Messages</Text>
            <TouchableOpacity className="p-2">
              <Ionicons name="create-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Conversations List */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {filteredConversations.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 16, color: "#0f172a", marginTop: 12 }}>
                No conversations yet
              </Text>
              <Text style={{ fontFamily: "Gilroy-Regular", fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                Start a new conversation to get chatting!
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ConversationCard conversation={item} onPress={() => handleConversationPress(item.id)} />
              )}
              scrollEnabled={true}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </>
  )
}

export default MessagesScreen
