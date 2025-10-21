"use client"

import FeedList from "@/src/components/ui/feed-list"
import { useState } from "react"
import { StatusBar, View , StyleSheet, Text} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"



export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false)

  // Sample data matching your screenshot
  const samplePosts = [
    {
      id: "1",
      user: {
        fullName: "AAOBA",
        username: "AAOBA",
        avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/ACCRA_ACADEMY_CREST.jpg/1200px-ACCRA_ACADEMY_CREST.jpg",
      },
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit.",
      timestamp: "7m",
      stats: {
        comments: 57,
        reposts: 144,
        likes: 194,
      },
      settings: {
        allowComments: true,
        allowReposts: true,
        allowShares: true,
      },
    },
    {
      id: "2",
      user: {
        fullName: "Kofi Williams",
        username: "kwilli",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      },
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: "https://images.unsplash.com/photo-1744059509939-866e0fb167c6?q=80&w=876&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Office workspace image
      timestamp: "2h",
      stats: {
        comments: 19,
        reposts: 48,
        likes: 482,
      },
      settings: {
        allowComments: true,
        allowReposts: true,
        allowShares: true,
      },
    },
  ]

  const handleRefresh = () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const handleLoadMore = () => {
    console.log("Load more posts")
  }

  const handleAddPost = () => {
    console.log("Add new post")
    // Navigate to create post screen
  }
  
  return (
    <View className="flex-1 bg-white p-4">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
        <Text className="text-3xl font-[Gilroy-SemiBold]">Feed Screen</Text>
      <FeedList
        posts={samplePosts}
        onRefresh={handleRefresh}
        onLoadMore={handleLoadMore}
        onAddPost={handleAddPost}
        refreshing={refreshing}
      />
    </View>
  )
}
