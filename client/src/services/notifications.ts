import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerPushToken, unregisterPushToken, type PushPlatform } from "./notificationServices";

const STORED_TOKEN_KEY = "expoPushToken";
const STATUS_KEY = "cc.pushStatus";

/**
 * Why push is or is not working on this device.
 *
 * Registration deliberately never throws -- push setup must not break the
 * session it is attached to -- but that meant every failure vanished into a
 * console warning nobody sees on a phone. Recording the outcome turns "is push
 * broken?" into something the settings screen can answer.
 */
export type PushStatus =
  | "active"
  | "denied"
  | "unsupported_device"
  | "no_project"
  | "server_rejected"
  | "error"
  | "unknown";

export const PUSH_STATUS_COPY: Record<PushStatus, string> = {
  active: "Push notifications are on for this device.",
  denied: "Notifications are turned off for Campus Connect in your device settings.",
  unsupported_device:
    "Push needs a real device. Simulators and emulators cannot receive them.",
  no_project: "This build is not linked to an Expo project, so no token can be issued.",
  server_rejected: "The device registered, but the server did not accept the token.",
  error: "Push setup failed. Reopen the app to try again.",
  unknown: "Push has not been set up yet on this device.",
};

const recordStatus = async (status: PushStatus) => {
  try {
    await AsyncStorage.setItem(STATUS_KEY, status);
  } catch {
    // Diagnostics must never be the thing that breaks.
  }
};

/** The last known push outcome, for the settings screen to display. */
export async function getPushStatus(): Promise<PushStatus> {
  try {
    return ((await AsyncStorage.getItem(STATUS_KEY)) as PushStatus | null) ?? "unknown";
  } catch {
    return "unknown";
  }
}

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

    if (!Device.isDevice) {
      // Expo will not issue a token to a simulator, so this is the single most
      // likely reason push "does not work" during development.
      await recordStatus("unsupported_device");
      return;
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== "granted") {
      await recordStatus("denied");
      return;
    }

    const token = await getExpoPushToken();
    if (!token) {
      await recordStatus("no_project");
      return;
    }

    const result = await registerPushToken(token, PLATFORM);
    if (result.success) {
      await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
      await recordStatus("active");
    } else {
      await recordStatus("server_rejected");
    }
  } catch (error) {
    // Never let push setup block or crash the session it is attached to.
    await recordStatus("error");
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

/**
 * Mirror the app icon badge to the unread count.
 *
 * setNotificationHandler already asks for shouldSetBadge, but that only lets
 * an incoming push increment it -- nothing ever set it from the real count or
 * cleared it on read, so the number drifted from the app and stayed there
 * after everything had been seen. The unread count is the single source of
 * truth; this just reflects it.
 *
 * Failures are swallowed: Android launchers vary in whether they support
 * badges at all, and a missing badge must not surface as an error.
 */
export async function syncBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // Not supported here; nothing to do.
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
