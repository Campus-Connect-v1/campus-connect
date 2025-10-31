"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

type Language = "en" | "es" | "fr" | "de" | "zh"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en")
  const [isHydrated, setIsHydrated] = useState(false)

  // 🔹 Load saved language from AsyncStorage when app starts
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("uniCliq-language")
        if (savedLanguage && ["en", "es", "fr", "de", "zh"].includes(savedLanguage)) {
          setLanguageState(savedLanguage as Language)
        }
      } catch (error) {
        console.error("Failed to load language preference:", error)
      } finally {
        setIsHydrated(true)
      }
    }

    loadLanguage()
  }, [])

  // 🔹 Update language in state and AsyncStorage
  const setLanguage = async (lang: Language) => {
    try {
      setLanguageState(lang)
      await AsyncStorage.setItem("uniCliq-language", lang)
    } catch (error) {
      console.error("Failed to save language preference:", error)
    }
  }

  if (!isHydrated) {
    // You can return a splash screen or loader here if you want
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return context
}
