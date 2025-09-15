import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import SplashScreenComponent from "./SplashScreen";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SplashScreenComponent
      onFinish={async () => {
        await AsyncStorage.setItem("hasSeenOnboarding", "false");
        router.replace("/auth/login"); // go to login after onboarding
      }}
    />
  );
}
