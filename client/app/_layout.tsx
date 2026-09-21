import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NetworkProvider } from "@/src/services/NetworkContext";
import { PreferencesProvider, usePreferences } from "@/src/services/PreferencesContext";
import { SavedPostsProvider } from "@/src/services/SavedPostsContext";
import { SessionProvider } from "@/src/services/SessionContext";
import { ThemeScheme } from "@/src/styles/ThemeScheme";

import "./globals.css";

SplashScreen.preventAutoHideAsync();

/**
 * Applies the stored appearance preference to everything below it.
 *
 * It sits inside the provider rather than beside it because it has to read the
 * preference; `ThemeScheme` with a null scheme is a no-op pass-through, which
 * is what "System" means.
 */
function Themed({ children }: { children: React.ReactNode }) {
  const { forcedScheme } = usePreferences();
  return <ThemeScheme scheme={forcedScheme}>{children}</ThemeScheme>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Gilroy-Regular": require("../assets/fonts/Gilroy-Regular.ttf"),
    "Gilroy-Medium": require("../assets/fonts/Gilroy-Medium.ttf"),
    "Gilroy-SemiBold": require("../assets/fonts/Gilroy-SemiBold.ttf"),
    // Temporary brand display face. UI/body copy remains on Gilroy until the
    // final typography set is ready.
    Blackbold: require("../assets/fonts/Blackbold/Blackbold.ttf"),
  });

  useEffect(() => {
    // Hide on font ERROR too, otherwise a missing font file leaves the user
    // staring at the native splash screen forever.
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/*
          SessionProvider sits above the navigator so the signed-in user
          survives navigation, and a 401 anywhere can clear it once.

          Route gating still lives in app/index.tsx, not here. Driving
          `initialRouteName` from async state re-mounts the navigator once the
          state resolves, which drops any deep link the app was opened with.
        */}
        <PreferencesProvider>
          <NetworkProvider>
            <SessionProvider>
              <SavedPostsProvider>
                <Themed>
                  <Stack screenOptions={{ headerShown: false }} />
                </Themed>
              </SavedPostsProvider>
            </SessionProvider>
          </NetworkProvider>
        </PreferencesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
