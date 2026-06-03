import { useRouter } from "expo-router";
import SplashScreenComponent from "./SplashScreen";
import { useAuthStore } from "@/src/store/authStore";

export default function OnboardingScreen() {
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  return (
    <SplashScreenComponent
      onFinish={async () => {
        await completeOnboarding();
        router.replace("/auth/login"); // go to login after onboarding
      }}
    />
  );
}
