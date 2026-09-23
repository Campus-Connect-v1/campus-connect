import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  Icon,
  InlineNotice,
  PressableScale,
  Text,
  type IconName,
} from "@/src/components/ui";
import {
  hidePost,
  reportPost,
  REPORT_REASONS,
  seeLessLikePost,
  type ReportReason,
} from "@/src/services/moderationServices";
import { deletePoll } from "@/src/services/pollServices";
import { deletePost, updatePost } from "@/src/services/socialServices";
import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export interface PostOptionsSheetProps {
  postId: string;
  authorName: string;
  /** Shows Edit and Delete instead of the moderation actions. */
  isOwnPost: boolean;
  /** The post's current text, so Edit can open pre-filled. */
  content?: string;
  /** Set when the post is a poll: deleting removes the poll and its post. */
  pollId?: string;
  /** Called after an edit, so the row can show the new text. */
  onEdited?: (postId: string, content: string) => void;
  saved: boolean;
  visible: boolean;
  onClose: () => void;
  /** Called once the post should leave the list (hidden or deleted). */
  onRemoved: (postId: string) => void;
  onToggleSave: (postId: string) => void;
}

function Row({
  icon,
  label,
  detail,
  destructive,
  onPress,
}: {
  icon: IconName;
  label: string;
  detail?: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tint = destructive ? colors.destructive : colors.textPrimary;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 60,
        paddingHorizontal: spacing.lg,
      }}
    >
      <Icon name={icon} size={20} color={tint} />
      <View style={{ flex: 1 }}>
        <Text variant="body" style={{ color: tint }}>
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" color="textMuted">
            {detail}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

/**
 * The menu behind a post's overflow button.
 *
 * It is a route-less modal rather than a pushed screen because it is a choice
 * about the row you are looking at: pushing a screen would take the post off
 * screen, which is exactly the context the choice depends on.
 */
export function PostOptionsSheet({
  postId,
  authorName,
  isOwnPost,
  content,
  pollId,
  visible,
  saved,
  onClose,
  onRemoved,
  onEdited,
  onToggleSave,
}: PostOptionsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [reporting, setReporting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const close = () => {
    setReporting(false);
    setEditing(false);
    setError(null);
    setDone(null);
    onClose();
  };

  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>,
    options: { removes?: boolean; confirmation?: string } = {}
  ) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);

    if (!result.success) {
      setError(result.error ?? "That did not work. Try again.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (options.removes) {
      onRemoved(postId);
      close();
      return;
    }
    setDone(options.confirmation ?? null);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(120)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityLabel="Close options"
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,18,25,0.5)" }]}
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(220)}
        exiting={SlideOutDown.duration(180)}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "80%",
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + spacing.md,
        }}
      >
        <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: radius.full,
              backgroundColor: colors.borderStrong,
            }}
          />
        </View>

        {error ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            <InlineNotice message={error} />
          </View>
        ) : null}
        {done ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            <InlineNotice tone="success" message={done} />
          </View>
        ) : null}

        <ScrollView keyboardShouldPersistTaps="handled">
          {editing ? (
            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
              <Text variant="micro" color="textMuted">
                EDIT YOUR POST
              </Text>
              <TextInput
                accessibilityLabel="Post text"
                multiline
                autoFocus
                autoCapitalize="sentences"
                value={draft}
                onChangeText={setDraft}
                placeholderTextColor={colors.textMuted}
                style={[
                  inputTextStyle(true),
                  {
                    minHeight: 120,
                    borderRadius: radius.sm,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    padding: spacing.md,
                    textAlignVertical: "top",
                  },
                ]}
              />
              <View style={{ flexDirection: "row", gap: spacing.sm, paddingBottom: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Button label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label="Save"
                    loading={busy}
                    disabled={!draft.trim() || draft.trim() === (content ?? "").trim()}
                    onPress={async () => {
                      const next = draft.trim();
                      setBusy(true);
                      const result = await updatePost(postId, next);
                      setBusy(false);

                      if (!result.success) {
                        setError(result.error);
                        return;
                      }
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      onEdited?.(postId, next);
                      close();
                    }}
                  />
                </View>
              </View>
            </View>
          ) : reporting ? (
            <>
              <Text
                variant="micro"
                color="textMuted"
                style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}
              >
                WHY ARE YOU REPORTING THIS?
              </Text>
              {REPORT_REASONS.map((reason) => (
                <Row
                  key={reason.value}
                  icon="alert"
                  label={reason.label}
                  onPress={() =>
                    run(() => reportPost(postId, reason.value as ReportReason), {
                      confirmation: "Reported. Our team will take a look.",
                    })
                  }
                />
              ))}
              <Row icon="back" label="Back" onPress={() => setReporting(false)} />
            </>
          ) : (
            <>
              <Row
                icon="save"
                label={saved ? "Remove from saved" : "Save post"}
                onPress={() => {
                  onToggleSave(postId);
                  close();
                }}
              />
              <Row
                icon="send"
                label="Share to your story"
                detail="Repost it for 24 hours"
                onPress={() => {
                  close();
                  router.push(`/stories/compose?repost=${postId}`);
                }}
              />

              {isOwnPost ? (
                <>
                  {/* A poll's options and votes are fixed once it is live, so
                      only a plain post offers Edit. */}
                  {!pollId ? (
                    <Row
                      icon="edit"
                      label="Edit post"
                      onPress={() => {
                        setDraft(content ?? "");
                        setEditing(true);
                      }}
                    />
                  ) : null}

                  <Row
                    icon="alert"
                    label={pollId ? "Delete poll" : "Delete post"}
                    detail={pollId ? "Removes the poll and every vote" : "This cannot be undone"}
                    destructive
                    onPress={() =>
                      run(() => (pollId ? deletePoll(pollId) : deletePost(postId)), {
                        removes: true,
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <Row
                    icon="hidden"
                    label="Hide this post"
                    detail="You will stop seeing it"
                    onPress={() => run(() => hidePost(postId), { removes: true })}
                  />
                  <Row
                    icon="trending"
                    label="See less like this"
                    detail={`Fewer posts like ${authorName}'s`}
                    onPress={() =>
                      run(() => seeLessLikePost(postId), {
                        confirmation: "Noted. You will see fewer posts like this.",
                      })
                    }
                  />
                  <Row
                    icon="alert"
                    label="Report post"
                    detail="Tell us what is wrong with it"
                    destructive
                    onPress={() => {
                      setError(null);
                      setDone(null);
                      setReporting(true);
                    }}
                  />
                </>
              )}
            </>
          )}
        </ScrollView>

        {busy ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.08)" }]}
          />
        ) : null}
      </Animated.View>
    </Modal>
  );
}
