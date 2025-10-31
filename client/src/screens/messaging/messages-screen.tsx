"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Animated, View, Text, StatusBar, TouchableOpacity, ActivityIndicator, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import ConversationCard from "@/src/components/messaging/conversation-card"
import SearchBar from "@/src/components/messaging/search-bar"
import LanguageSwitcher from "@/src/components/messaging/language-switcher"
import { dataService } from "@/src/services/data-service"
import { useLanguage } from "@/src/contexts/language-context"
import { i18nService } from "@/src/services/i18n-service"

const MessagesScreen: React.FC = () => {
  const { language } = useLanguage()
  const t = (key: keyof ReturnType<typeof i18nService.getTranslations>) => i18nService.t(language, key)

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
    router.push(`/messaging/chat/${conversationId}`)
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
            <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 28, color: "#0f172a" }}>{t("messages")}</Text>
            <View className="flex-row items-center gap-2">
              <LanguageSwitcher />
              <TouchableOpacity className="p-2">
                <Ionicons name="create-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Conversations List */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {filteredConversations.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 16, color: "#0f172a", marginTop: 12 }}>
                {t("noConversations")}
              </Text>
              <Text style={{ fontFamily: "Gilroy-Regular", fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                {t("startNewConversation")}
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
