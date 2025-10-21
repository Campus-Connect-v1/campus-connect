import { StyleSheet, Text, View } from "react-native"
import Colors from "@/src/constants/Colors"
import FeedScreen from "../feed/feed-screen"

export default function HomeScreen() {
  return (
    <View className="flex-1">
            <FeedScreen />
    </View>
  )
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: Colors.light.background,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: Colors.light.text,
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//   },
// })
