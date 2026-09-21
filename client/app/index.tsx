import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Loader } from "@/src/components/ui";
import { BYPASS_AUTH } from "@/src/constants/env";
import { useSession } from "@/src/services/SessionContext";
import { useTheme } from "@/src/styles/useTheme";

import "./globals.css";

type Destination = "/onboarding" | "/auth" | "/(tabs)/home";

export default function Index() {
  const { colors } = useTheme();
  const { user, booting } = useSession();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding").then((value) => setSeenOnboarding(!!value));
  }, []);

  useEffect(() => {
    if (BYPASS_AUTH) console.warn("EXPO_PUBLIC_BYPASS_AUTH is on: skipping onboarding and auth.");
  }, []);

  // The provider owns restoreSession(), so this waits on `booting` rather than
  // restoring a second time — two restores race, and the loser can leave the
  // axios interceptor reading a token the UI has already replaced.
  if (!BYPASS_AUTH && (booting || seenOnboarding === null)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Loader color={colors.textMuted} size={26} />
      </View>
    );
  }

  const destination: Destination = BYPASS_AUTH
    ? "/(tabs)/home"
    : user
      ? "/(tabs)/home"
      : seenOnboarding
        ? "/auth"
        : "/onboarding";

  return <Redirect href={destination} />;
}
