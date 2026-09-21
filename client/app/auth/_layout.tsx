import { Stack } from "expo-router";

import { ThemeScheme } from "@/src/styles/ThemeScheme";

/**
 * The whole auth flow is dark, system scheme notwithstanding. Declaring it once
 * here means no individual auth screen has to remember to.
 */
export default function AuthLayout() {
  return (
    <ThemeScheme scheme="dark">
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
    </ThemeScheme>
  );
}
