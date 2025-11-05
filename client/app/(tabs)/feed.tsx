import React from "react"
import { View, Text, StyleSheet, ImageBackground } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { BlurView } from "expo-blur"
import { router } from "expo-router"
import FeedScreen from "../feed/feed-screen"
import FloatingAddButton from "@/src/components/ui/floating-add-button"

export default function HomeScreen() {
  const handleCreatePost = () => {
    router.push("/feed/compose-post")
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* App Title */}
      <Text className="font-[Camood] text-3xl text-black mx-5 mt-2">Feed</Text>

      {/* Background Layer */}
      <ImageBackground
        source={require("@/assets/images/background2.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <BlurView intensity={0} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.contentContainer}>
          <FeedScreen />
          <FloatingAddButton onPress={handleCreatePost} />
        </View>
      </ImageBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  background: {

  },
  contentContainer: {
  }
})


