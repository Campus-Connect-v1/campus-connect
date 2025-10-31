"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useLanguage } from "@/src/contexts/language-context"
import { i18nService } from "@/src/services/i18n-service"

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const languages = i18nService.getAllLanguages()

  const currentLanguageName = languages.find((l) => l.code === language)?.name || "English"

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="flex-row items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg"
      >
        <Ionicons name="globe" size={16} color="#0f172a" />
        <Text style={{ fontFamily: "Gilroy-Regular", fontSize: 12, color: "#0f172a" }}>{currentLanguageName}</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl px-4 py-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 18, color: "#0f172a" }}>Select Language</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setLanguage(item.code as any)
                    setIsOpen(false)
                  }}
                  className={`flex-row items-center justify-between py-3 px-2 border-b border-gray-100 ${
                    language === item.code ? "bg-red-50" : ""
                  }`}
                >
                  <Text
                    style={{
                      fontFamily: "Gilroy-Regular",
                      fontSize: 14,
                      color: language === item.code ? "#ef4444" : "#0f172a",
                    }}
                  >
                    {item.name}
                  </Text>
                  {language === item.code && <Ionicons name="checkmark" size={20} color="#ef4444" />}
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </View>
        </View>
      </Modal>
    </>
  )
}

export default LanguageSwitcher
