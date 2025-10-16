import { StyleSheet, Text, View } from "react-native"
import Colors from "@/src/constants/Colors"

export default function HomeScreen() {
  return (
    <View >
      <Text className="text-red-500 text-4xl">Home Screen</Text>
      <Text >Welcome to CampusConnect!</Text>
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
