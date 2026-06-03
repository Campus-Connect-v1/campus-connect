// app/index.tsx — entry router. Sends the user to onboarding, login, or the
// app based on persisted state (hydrated in the root layout before this renders).
import { useAuthStore } from "@/src/store/authStore";
import { Redirect } from "expo-router";
import "./globals.css";

export default function Index() {
  const hydrating = useAuthStore((s) => s.hydrating);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const status = useAuthStore((s) => s.status);

  if (hydrating) return null; // root layout shows a spinner during hydration

  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (status === "authenticated") return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/auth/login" />;
}
