import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerPushToken, unregisterPushToken, type PushPlatform } from "./notificationServices";

const STORED_TOKEN_KEY = "expoPushToken";

const PLATFORM: PushPlatform =
  Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

/**
 * Foreground behaviour: still show an alert and increment the badge, rather
 * than swallowing notifications that arrive while the app is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Requests notification permission and returns a fresh Expo push token, or
 * null if permission was denied or no EAS project is linked yet.
 *
 * `getExpoPushTokenAsync` needs `extra.eas.projectId` in app.json/app.config,
 * which only exists once the project has been linked with `eas init`. Until
 * then this resolves to null and the caller should treat push as unavailable
 * — in-app notifications still work regardless, since those don't depend on
 * a device token at all.
 */
async function getExpoPushToken(): Promise<string | null> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      "[notifications] No EAS projectId configured (app.json extra.eas.projectId). " +
        "Run `eas init` to link the project before push tokens can be issued."
    );
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/**
 * Call once the user is signed in (e.g. from SessionContext once `user` is
 * set). Idempotent: safe to call on every app foreground, not just once —
 * re-registering the same token is a cheap upsert on the server.
 */
export async function registerForPushNotificationsAsync(): Promise<void> {
  try {
    await ensureAndroidChannel();

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") return;

    const token = await getExpoPushToken();
    if (!token) return;

    const result = await registerPushToken(token, PLATFORM);
    if (result.success) {
      await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
    }
  } catch (error) {
    // Never let push setup block or crash the session it is attached to.
    console.warn("[notifications] registration failed:", (error as Error).message);
  }
}

/** Call on sign-out, so a shared device stops receiving the old account's pushes. */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
    if (!token) return;
    await unregisterPushToken(token);
    await AsyncStorage.removeItem(STORED_TOKEN_KEY);
  } catch (error) {
    console.warn("[notifications] unregister failed:", (error as Error).message);
  }
}

export type NotificationDestination = { resourceType: string | null; resourceId: string | null };

/**
 * Subscribes to notification taps (app opened from a push, background or
 * killed). Returns the unsubscribe function; call it from a `useEffect`
 * cleanup. Kept generic — routing decisions stay with the caller, which
 * already has `destinationFor` in app/notifications.tsx for this shape.
 */
export function addNotificationResponseListener(
  handler: (destination: NotificationDestination) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as
      | { resource_type?: string; resource_id?: string }
      | undefined;
    handler({
      resourceType: data?.resource_type ?? null,
      resourceId: data?.resource_id ?? null,
    });
  });
  return () => subscription.remove();
}
