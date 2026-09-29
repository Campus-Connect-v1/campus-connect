import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, View } from "react-native";

import { MediaAttachment } from "@/src/components/compose/MediaAttachment";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, Icon, InlineNotice, PressableScale, Text } from "@/src/components/ui";
import { useUploadsEnabled } from "@/src/hooks/useUploadsEnabled";
import {
  captureWithCamera,
  pickFromLibrary,
  type PickedMedia,
  type PickResult,
} from "@/src/services/media";
import { createStory, type StoryVisibility } from "@/src/services/storyServices";
import { useUploadQueue } from "@/src/services/UploadQueueContext";
import { culture, foregroundOn, inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

type Mode = "text" | "media";

/** The backgrounds a text story can use. Hex, because the API validates hex. */
const BACKGROUNDS = [culture.violet, culture.pink, culture.yellow, culture.lime, culture.ink];

const VISIBILITIES: { value: StoryVisibility; label: string; detail: string }[] = [
  { value: "connections", label: "Connections", detail: "People you are connected with" },
  { value: "university", label: "Campus", detail: "Anyone at your university" },
  { value: "public", label: "Everyone", detail: "Any Campus Connect user" },
];

export default function StoryComposeScreen() {
  const { colors } = useTheme();
  const { repost } = useLocalSearchParams<{ repost?: string }>();
  const canUpload = useUploadsEnabled();

  const [mode, setMode] = useState<Mode>(repost ? "text" : "text");
  const [text, setText] = useState("");
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [visibility, setVisibility] = useState<StoryVisibility>("connections");
  const [error, setError] = useState<string | null>(null);
  const { enqueue } = useUploadQueue();
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const isRepost = Boolean(repost);

  const handlePick = async (pick: () => Promise<PickResult>) => {
    setError(null);
    const result = await pick();

    if (result.status === "denied") {
      setPermissionBlocked(!result.canAskAgain);
      setError(
        result.canAskAgain
          ? "Campus Connect needs access to your photos to post a story."
          : "Photo access is switched off for Campus Connect in your device settings."
      );
      return;
    }
    if (result.status === "picked") {
      Haptics.selectionAsync();
      setMedia(result.media);
      setMode("media");
    }
  };

  const canPost = isRepost || (mode === "text" ? text.trim().length > 0 : Boolean(media));

  /**
   * Queues the story and leaves at once, the same as the post composer.
   *
   * A story is the case this matters most for: it is usually a photo or a
   * video, taken seconds ago and not compressed, so the upload is the longest
   * part and holding the screen for it is the difference between posting one
   * and giving up.
   *
   * Everything checkable before leaving is still checked here -- media
   * hosting, an empty story -- because those cannot be fixed from a toast.
   */
  const post = () => {
    if (!canPost) return;

    if (!isRepost && mode === "media") {
      if (!media) return;
      if (!canUpload) {
        setError("Media hosting is not configured on the server, so this cannot post.");
        return;
      }
    }

    setError(null);

    const caption = text.trim();
    // Text and repost stories have nothing to upload, so they go straight to
    // the commit step and the bar is only ever briefly on screen.
    const attachment = !isRepost && mode === "media" ? media : null;

    enqueue({
      label: "Story",
      kind: "posts",
      media: attachment,
      commit: async (mediaUrl: string | null) => {
        const result = isRepost
          ? await createStory({
              story_type: "repost",
              repost_post_id: repost,
              content: caption || undefined,
              visibility,
            })
          : mode === "text"
            ? await createStory({
                story_type: "text",
                content: caption,
                background_color: background,
                visibility,
              })
            : await createStory({
                // The picker's guess, since the queue reports the URL but not
                // what Cloudinary decided the file was.
                story_type: media?.kind === "video" ? "video" : "image",
                media_url: mediaUrl ?? undefined,
                content: caption || undefined,
                visibility,
              });

        return result.success ? { ok: true } : { ok: false, error: `Story failed: ${result.error}` };
      },
    });

    router.replace("/(tabs)/home");
  };

  return (
    <SettingsShell title={isRepost ? "Share to story" : "New story"}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          {isRepost ? (
            <InlineNotice tone="success" message="This will share the post to your story." />
          ) : null}

          {!isRepost ? (
            <View
              style={{
                flexDirection: "row",
                padding: spacing["3xs"] + 2,
                borderRadius: radius.full,
                backgroundColor: colors.surface,
              }}
            >
              {(["text", "media"] as Mode[]).map((value) => {
                const active = mode === value;
                return (
                  <PressableScale
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMode(value);
                    }}
                    style={{
                      flex: 1,
                      minHeight: 42,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: radius.full,
                      backgroundColor: active ? culture.lime : "transparent",
                    }}
                  >
                    <Text
                      variant="label"
                      style={active ? { color: culture.ink } : undefined}
                      color={active ? undefined : "textSecondary"}
                    >
                      {value === "text" ? "Text" : "Photo or video"}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          ) : null}

          {mode === "text" && !isRepost ? (
            <>
              {/* The composer previews the real thing: same background, same
                  centring, so what you type is what gets posted. */}
              <View
                style={{
                  minHeight: 300,
                  borderRadius: radius.lg,
                  backgroundColor: background,
                  alignItems: "center",
                  justifyContent: "center",
                  padding: spacing.xl,
                }}
              >
                <TextInput
                  accessibilityLabel="Story text"
                  placeholder="Say something"
                  placeholderTextColor={`${foregroundOn(background)}99`}
                  multiline
                  autoCapitalize="sentences"
                  value={text}
                  onChangeText={setText}
                  style={{
                    width: "100%",
                    color: foregroundOn(background),
                    fontFamily: "Gilroy-SemiBold",
                    fontSize: 26,
                    lineHeight: 34,
                    textAlign: "center",
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                {BACKGROUNDS.map((hue) => (
                  <PressableScale
                    key={hue}
                    accessibilityRole="button"
                    accessibilityLabel={`Background ${hue}`}
                    accessibilityState={{ selected: hue === background }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setBackground(hue);
                    }}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: radius.md,
                      backgroundColor: hue,
                      borderWidth: hue === background ? 3 : 1,
                      borderColor: hue === background ? colors.textPrimary : colors.border,
                    }}
                  />
                ))}
              </View>
            </>
          ) : null}

          {mode === "media" && !isRepost ? (
            media ? (
              <MediaAttachment media={media} onRemove={() => setMedia(null)} />
            ) : (
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Attach
                  icon="photo"
                  label="Photo"
                  onPress={() => handlePick(() => pickFromLibrary("image"))}
                />
                <Attach
                  icon="video"
                  label="Video"
                  onPress={() => handlePick(() => pickFromLibrary("video"))}
                />
                <Attach
                  icon="camera"
                  label="Camera"
                  onPress={() => handlePick(() => captureWithCamera("image"))}
                />
              </View>
            )
          ) : null}

          {(mode === "media" && media) || isRepost ? (
            <TextInput
              accessibilityLabel="Add a caption"
              placeholder="Add a caption (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              autoCapitalize="sentences"
              value={text}
              onChangeText={setText}
              style={{
                minHeight: 80,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                ...inputTextStyle(true),
                padding: spacing.md,
                textAlignVertical: "top",
              }}
            />
          ) : null}

          <View style={{ gap: spacing.xs }}>
            <Text variant="micro" color="textMuted">
              WHO CAN SEE THIS
            </Text>
            {VISIBILITIES.map((option) => {
              const active = option.value === visibility;
              return (
                <PressableScale
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${option.label}. ${option.detail}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setVisibility(option.value);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    minHeight: 56,
                    paddingHorizontal: spacing.md,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: active ? colors.textPrimary : colors.border,
                    backgroundColor: active ? colors.surface : "transparent",
                  }}
                >
                  <Icon
                    name={active ? "check" : "visible"}
                    size={18}
                    color={active ? colors.textPrimary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="body">{option.label}</Text>
                    <Text variant="caption" color="textMuted">
                      {option.detail}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>

          {error ? <InlineNotice message={error} /> : null}
          {permissionBlocked ? (
            <Button
              label="Open settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          ) : null}

          <Button
            // No loading state: nothing is awaited here any more. Progress
            // lives on the bar at the top of the window.
            label="Share to story"
            disabled={!canPost}
            onPress={post}
          />

          <Text variant="caption" color="textMuted">
            Stories disappear after 24 hours.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}

function Attach({
  icon,
  label,
  onPress,
}: {
  icon: "photo" | "video" | "camera";
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Add ${label.toLowerCase()}`}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 88,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing["2xs"],
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Icon name={icon} size={22} color={colors.textSecondary} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </PressableScale>
  );
}
