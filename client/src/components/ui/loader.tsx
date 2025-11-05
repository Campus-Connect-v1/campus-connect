import React from "react";
import LottieView from "lottie-react-native";
import { View, StyleSheet } from "react-native";

export default function Loader() {
  return (
    <View style={styles.container}>
      <LottieView
        source={require("../../../assets/animations/animation.json")}
        autoPlay
        loop
        style={{ width: 200, height: 200 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // or your theme background
  },
});
