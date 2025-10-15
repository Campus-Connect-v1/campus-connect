// app/index.tsx
import { Redirect } from "expo-router";
import './globals.css'

export default function Index() {
  // For now, always go to onboarding
  return <Redirect href="/onboarding" />;
}
