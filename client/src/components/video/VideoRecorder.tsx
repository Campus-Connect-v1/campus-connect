import { Linking, View } from "react-native";

import { Button, Text } from "@/src/components/ui";
import { spacing } from "@/src/styles/theme";

interface VideoRecorderProps {
  canAskAgain: boolean;
}

/**
 * Recovery UI for a denied camera/microphone permission.
 *
 * There is no dedicated in-app recording screen to render here: the actual
 * capture UI is the OS camera sheet, opened by
 * `services/video/videoRecorder.ts`'s `recordVideo()` (which wraps
 * `expo-image-picker`'s `launchCameraAsync` -- see that file's doc comment
 * for why no separate `expo-camera` dependency is needed). This component's
 * job starts where that call can't proceed on its own: when permission was
 * refused.
 */
export function VideoRecorder({ canAskAgain }: VideoRecorderProps) {
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="body" color="textMuted">
        {canAskAgain
          ? "Campus Connect needs access to your camera to record a video."
          : "Camera access is switched off for Campus Connect in your device settings."}
      </Text>
      {canAskAgain ? null : (
        <Button label="Open settings" variant="secondary" onPress={() => Linking.openSettings()} />
      )}
    </View>
  );
}
