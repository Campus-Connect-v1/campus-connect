import { Modal, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InlineNotice, PressableScale, Text, Icon } from "@/src/components/ui";
import type { UseVideoUploadReturn } from "@/src/hooks/useVideoUpload";
import { spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { VideoEditor } from "./VideoEditor";
import { VideoPicker } from "./VideoPicker";
import { VideoPreview } from "./VideoPreview";
import { VideoRecorder } from "./VideoRecorder";
import { VideoUploadError } from "./VideoUploadError";
import { VideoUploadProgress } from "./VideoUploadProgress";

/**
 * The one piece of UI a consuming screen mounts for `useVideoUpload` to have
 * anywhere to render. It reads every screen (picker, preview, editor,
 * progress, error) off the hook's `state` and calls back into the hook's
 * actions -- a consuming screen never needs to know these sub-screens
 * exist, only that this component exists and that `video.open()` resolves
 * when the user is done.
 */
export function VideoUploadFlow({
  video,
  submitLabel,
}: {
  video: UseVideoUploadReturn;
  /** Forwarded to `VideoEditor`'s final action button. */
  submitLabel?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = video;

  if (state.phase === "closed") return null;

  return (
    <Modal visible animationType="slide" onRequestClose={video.cancel} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.md }}>
        {state.phase === "picking" ? (
          state.permissionDenied ? (
            <VideoRecorder canAskAgain={state.permissionDenied.canAskAgain} />
          ) : (
            <View style={{ gap: spacing.lg }}>
              <Header title="New video" onClose={video.cancel} colors={colors} />
              {state.pickerError ? <InlineNotice message={state.pickerError} /> : null}
              <VideoPicker
                onSelectGallery={video.selectFromGallery}
                onSelectFiles={video.selectFromFiles}
                onRecord={video.record}
              />
            </View>
          )
        ) : null}

        {state.phase === "preview" && state.source && state.validationError ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <VideoPreview
              video={state.source}
              error={state.validationError}
              onDiscard={video.discardPreview}
            />
          </ScrollView>
        ) : null}

        {state.phase === "editing" && state.source && state.editorState ? (
          <VideoEditor
            source={state.source}
            thumbnailUri={state.thumbnailUri}
            initialState={state.editorState}
            submitLabel={submitLabel}
            onCancel={video.cancelEditing}
            onContinue={video.startUpload}
          />
        ) : null}

        {state.phase === "uploading" ? (
          <View style={{ flex: 1, justifyContent: "center", gap: spacing.lg }}>
            <Text variant="title">
              {state.uploadStage === "completed" ? "Done" : "Uploading"}
            </Text>
            {state.uploadErrorMessage ? (
              <VideoUploadError
                message={state.uploadErrorMessage}
                onRetry={video.retryUpload}
                onCancel={video.cancel}
              />
            ) : (
              <VideoUploadProgress
                stage={state.uploadStage}
                progress={state.uploadProgress}
                onCancel={video.cancel}
              />
            )}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function Header({ title, onClose, colors }: { title: string; onClose: () => void; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text variant="title">{title}</Text>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
      >
        <Icon name="close" size={19} color={colors.textPrimary} />
      </PressableScale>
    </View>
  );
}
