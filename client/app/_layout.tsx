import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Colors from "@/src/constants/Colors";
import { useAuthStore } from "@/src/store/authStore";
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
  BebasNeue_400Regular,
} from "@/src/theme/typography";
import './globals.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Chillis": require("../assets/fonts/chilispepper.ttf"),
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BebasNeue_400Regular,
  });

  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrating = useAuthStore((s) => s.hydrating);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Gate the app until fonts + persisted session are ready. `index.tsx` then
  // routes the user to onboarding / login / home based on the hydrated state.
  if (!fontsLoaded || hydrating) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.light.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/verify-otp" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="post/compose" options={{ presentation: "modal" }} />
          <Stack.Screen name="study-groups/create" options={{ presentation: "modal" }} />
          <Stack.Screen name="events/create" options={{ presentation: "modal" }} />
          <Stack.Screen name="profile/edit" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
