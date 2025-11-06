import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import '../globals.css';
import Colors from "@/src/constants/Colors";
import { Easing } from "react-native-reanimated";
import { LanguageProvider } from "@/src/contexts/language-context";
import { SocketProvider } from "@/src/contexts/socket-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Gilroy-Medium": require("../assets/fonts/Gilroy-Medium.ttf"),
    "Gilroy-Regular": require("../assets/fonts/Gilroy-Regular.ttf"),
    "Gilroy-SemiBold": require("../assets/fonts/Gilroy-SemiBold.ttf"),
    "Chillis": require("../assets/fonts/chilispepper.ttf"),
    "Camood": require("../assets/fonts/camood.otf"),
  });

  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string>("onboarding");

  useEffect(() => {
    const init = async () => {
      const seen = await AsyncStorage.getItem("hasSeenOnboarding");
      const loggedIn = false; 

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
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="bg-white">
      <SafeAreaProvider>
      <LanguageProvider>
      <SocketProvider>
        <Stack
  screenOptions={{
    headerShown: false,
    contentStyle: { backgroundColor: '#fff' },
    animation: 'slide_from_right', // default
    gestureEnabled: true,
  }}
>
  <Stack.Screen
    name="onboarding"
    options={{
      animation: 'fade', // fade transition
            
    }}
  />
  <Stack.Screen
    name="auth/login"
    options={{
      animation: 'slide_from_bottom', 

    }}
  />
  <Stack.Screen
    name="auth/register"
    options={{
      animation: 'fade_from_bottom', 
    }}
  />
</Stack>
      </SocketProvider>
      </LanguageProvider>

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


