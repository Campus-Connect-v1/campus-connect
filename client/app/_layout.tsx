import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import './globals.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Gilroy-Medium": require("../assets/fonts/Gilroy-Medium.ttf"),
    "Gilroy-Regular": require("../assets/fonts/Gilroy-Regular.ttf"),
    "Gilroy-SemiBold": require("../assets/fonts/Gilroy-SemiBold.ttf"),
    "Chillis": require("../assets/fonts/chilispepper.ttf"),
  });

  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string>("onboarding");

  useEffect(() => {
    const init = async () => {
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      const loggedIn = false; // TODO: hook Firebase here

      if (seen) {
        setInitialRoute("onboarding");
      } else if (loggedIn) {
        setInitialRoute("/(tabs)/home");
      } else {
        setInitialRoute("auth/login");
      }

      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRoute}
        >
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="/(tabs)/home" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
