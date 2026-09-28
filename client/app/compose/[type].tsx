import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, View } from "react-native";

import { MediaAttachment } from "@/src/components/compose/MediaAttachment";
import { COMPOSER_TOPICS } from "@/src/features/feed/topics";
import { useUploadQueue } from "@/src/services/UploadQueueContext";
import { MentionSuggestions } from "@/src/components/social/MentionSuggestions";
import { useMentionAutocomplete } from "@/src/features/mentions/useMentionAutocomplete";
import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, Icon, InlineNotice, PressableScale, Sticker, Text } from "@/src/components/ui";
import { useUploadsEnabled } from "@/src/hooks/useUploadsEnabled";
import {
  captureWithCamera,
  pickFromLibrary,
  type PickedMedia,
  type PickResult,
} from "@/src/services/media";
import { createPost } from "@/src/services/socialServices";
import { culture, foregroundOn, inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const COPY = {
  post: {
    title: "New post",
    sticker: "SAY SOMETHING",
    prompt: "What is happening on campus?",
    action: "Share post",
  },
  anonymous: {
    title: "Anonymous",
    sticker: "NO NAMES",
    prompt: "What do you want campus to talk about?",
    action: "Post anonymously",
  },
} as const;

export default function ComposeScreen() {
  const { colors } = useTheme();
  const { type } = useLocalSearchParams<{ type: string }>();
  const kind = type && type in COPY ? (type as keyof typeof COPY) : "post";
  const copy = COPY[kind];

  const [text, setText] = useState("");
  /**
   * Optional, and null by default.
   *
   * A required picker would be a tax on every post to serve the rail, and a
   * pre-selected one would file posts under a category the writer never chose.
   * An untagged post still reaches the main feed; it just does not appear
   * under a chip.
   */
  const [topic, setTopic] = useState<string | null>(null);
  const { enqueue } = useUploadQueue();
  const mentions = useMentionAutocomplete({
    text,
    onChange: (next) => {
      setText(next);
      setError(null);
    },
  });
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const canUpload = useUploadsEnabled();

  const stickerColor = useMemo(
    () => ({ post: culture.violet, anonymous: culture.pink })[kind],
    [kind]
  );

  const handlePick = async (pick: () => Promise<PickResult>) => {
    setError(null);
    const result = await pick();

    if (result.status === "denied") {
      setPermissionBlocked(!result.canAskAgain);
      setError(
        result.canAskAgain
          ? "Campus Connect needs access to your photos to attach media."
          : "Photo access is switched off for Campus Connect in your device settings."
      );
      return;
    }
    if (result.status === "picked") {
      Haptics.selectionAsync();
      setMedia(result.media);
    }
  };

  /**
   * Hands the work to the upload queue and leaves immediately.
   *
   * This used to hold the composer open until Cloudinary had the whole file,
   * which on a campus connection is a long time to stare at a spinner for
   * something the user has already decided to do. The screen closes now and
   * the upload finishes behind whatever they do next; the bar at the top of
   * the window reports it, and a toast plus a haptic confirm it.
   *
   * The cost is that a failure surfaces after the composer has gone, which is
   * why the toast names what failed rather than just saying something went
   * wrong. Errors that can be caught BEFORE leaving -- empty text -- are still
   * caught here.
   */
  const publish = () => {
    // Plain `@handle` while composing; markers only at the point of storing.
    const content = mentions.serialize(text).trim();
    if (!content) return;

    setError(null);

    const attachment = media && canUpload ? media : null;
    const label = copy.sticker || "Post";

    enqueue({
      label,
      kind: "posts",
      media: attachment,
      commit: async (mediaUrl) => {
        const result = await createPost(content, mediaUrl ?? undefined, "public", topic);
        return result.success
          ? { ok: true }
          : { ok: false, error: `${label} failed: ${result.error}` };
      },
    });

    setText("");
    setMedia(null);
    router.replace("/(tabs)/home");
  };

  return (
    <SettingsShell title={copy.title}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        >
          <Sticker label={copy.sticker} backgroundColor={stickerColor} />

          {kind === "anonymous" ? (
            <InlineNotice message="Anonymous posting is not available yet. This will publish under your name." />
          ) : null}

          <TextInput
            accessibilityLabel={copy.prompt}
            placeholder={copy.prompt}
            placeholderTextColor={colors.textMuted}
            multiline
            autoCapitalize="sentences"
            autoCorrect
            value={text}
            onChangeText={mentions.handleChangeText}
            onSelectionChange={mentions.onSelectionChange}
            // Controlled only for the render that follows an insert, so the
            // caret lands past the marker rather than past the visible label.
            selection={mentions.selection}
            style={{
              minHeight: media ? 110 : 180,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              ...inputTextStyle(true),
              fontSize: 18,
              lineHeight: 26,
              padding: spacing.lg,
              textAlignVertical: "top",
            }}
          />

          <MentionSuggestions
            open={mentions.open}
            query={mentions.query}
            loading={mentions.loading}
            people={mentions.suggestions}
            onSelect={mentions.select}
          />

          {kind === "post" ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="micro" color="textMuted">
                ADD A CATEGORY (OPTIONAL)
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {COMPOSER_TOPICS.map((option) => {
                  const selected = option.topic === topic;
                  return (
                    <PressableScale
                      key={option.topic}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Category ${option.label}`}
                      // Tapping the selected chip clears it: with no "none"
                      // option, choosing a category by accident would
                      // otherwise be permanent for that post.
                      onPress={() => setTopic(selected ? null : option.topic)}
                      style={{
                        minHeight: 40,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        borderRadius: radius.full,
                        backgroundColor: selected ? option.color : colors.surface,
                        borderWidth: 1,
                        borderColor: selected ? option.color : colors.border,
                      }}
                    >
                      <Icon
                        name={option.icon}
                        size={15}
                        color={selected ? foregroundOn(option.color) : colors.textSecondary}
                      />
                      <Text
                        variant="label"
                        style={{
                          color: selected ? foregroundOn(option.color) : colors.textSecondary,
                        }}
                      >
                        {option.label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ) : null}

          {media ? (
            <>
              <MediaAttachment media={media} onRemove={() => setMedia(null)} />
              {canUpload === false ? (
                <InlineNotice message="Media hosting is not configured on the server, so only your text will be posted." />
              ) : null}
            </>
          ) : null}

          {error ? <InlineNotice message={error} /> : null}

          {permissionBlocked ? (
            <Button
              label="Open settings"
              variant="secondary"
              onPress={() => Linking.openSettings()}
            />
          ) : null}

          {!media && canUpload !== false ? (
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <AttachButton
                icon="photo"
                label="Photo"
                onPress={() => handlePick(() => pickFromLibrary("image"))}
              />
              <AttachButton
                icon="video"
                label="Video"
                onPress={() => handlePick(() => pickFromLibrary("video"))}
              />
              <AttachButton
                icon="camera"
                label="Camera"
                onPress={() => handlePick(() => captureWithCamera("image"))}
              />
            </View>
          ) : null}

          <Button
            // No loading state: the button does not wait for anything any
            // more. The bar at the top of the window owns progress now.
            label={copy.action}
            disabled={!text.trim()}
            onPress={publish}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SettingsShell>
  );
}

function AttachButton({
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
      accessibilityLabel={`Attach ${label.toLowerCase()}`}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing["2xs"],
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Icon name={icon} size={18} color={colors.textSecondary} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </PressableScale>
  );
}
