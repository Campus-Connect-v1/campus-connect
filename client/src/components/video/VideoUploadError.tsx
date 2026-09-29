import { View } from "react-native";

import { Button, InlineNotice } from "@/src/components/ui";
import { spacing } from "@/src/styles/theme";

interface VideoUploadErrorProps {
  message: string;
  onRetry: () => void;
  onCancel: () => void;
}

/**
 * The only place an upload failure is shown -- `useVideoUpload` catches
 * every error (network, storage rejection, cancellation-during-flight) and
 * routes it here with an already-user-facing message; raw technical errors
 * never reach this component. See `videoUpload.ts` for where messages are
 * produced.
 */
export function VideoUploadError({ message, onRetry, onCancel }: VideoUploadErrorProps) {
  return (
    <View style={{ gap: spacing.md }}>
      <InlineNotice message={message} />
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
        <Button label="Retry" onPress={onRetry} style={{ flex: 1 }} />
      </View>
    </View>
  );
}
