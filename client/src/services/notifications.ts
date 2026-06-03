import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Push + local notifications (expo-notifications).
 *
 * NOTE (server gap): there is no endpoint to register an Expo push token, so
 * the server can't yet *deliver* remote pushes. `registerForPushNotifications`
 * returns the token so it's ready to POST once the backend adds a token route.
 * Local/scheduled notifications work today.
 */

// Show notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === "granted";
}

/**
 * Ask for permission and return the Expo push token (or null). Wrapped in
 * try/catch because it needs an EAS projectId, which may be absent in dev.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const granted = await requestNotificationPermissions();
  if (!granted) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
    // TODO: POST `data` to the server once a push-token endpoint exists.
  } catch {
    return null;
  }
}

/** Fire a local notification immediately (handy for in-app events/testing). */
export async function notifyLocal(title: string, body?: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
