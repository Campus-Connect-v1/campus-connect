import * as Haptics from "expo-haptics";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { sendMessage } from "@/src/services/socket";
import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * One tap each. Kept short deliberately: a row you have to read is slower than
 * typing, which defeats the point of a reaction.
 */
const REACTIONS = ["❤️", "🔥", "😂", "👏", "😮"] as const;

interface Props {
  /** Whose story this is -- the message goes to them as an ordinary chat. */
  authorId: string;
  storyId: string;
  authorName: string;
  /** Pauses the story while the keyboard is up, so it cannot advance away. */
  onFocusChange: (focused: boolean) => void;
}

/**
 * Reactions and a reply box under a story.
 *
 * A reply is a normal direct message carrying a reference to the story, not a
 * new kind of object: it lands in the existing conversation, so the thread
 * stays in one place and everything already built for chat -- history, unread
 * counts, realtime -- works on it without changes.
 *
 * Only the id is sent. The quoted preview the recipient sees is read from the
 * story row on the server, because a preview the sender controls is one the
 * sender can forge.
 */
export function StoryReplyBar({ authorId, storyId, authorName, onFocusChange }: Props) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const deliver = (content: string) => {
    const body = content.trim();
    if (!body) return;

    const ok = sendMessage(authorId, body, { kind: "story", refId: storyId });
    if (!ok) {
      setSent("Not connected — try again");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDraft("");
    setSent("Sent");
    // Long enough to register, short enough not to sit over the next story.
    setTimeout(() => setSent(null), 1600);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      {sent ? (
        <Text variant="caption" onMedia style={{ textAlign: "center", opacity: 0.9 }}>
          {sent}
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "center", gap: spacing.sm }}>
        {REACTIONS.map((emoji) => (
          <PressableScale
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`React with ${emoji}`}
            onPress={() => deliver(emoji)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: radius.full,
              // Legible over whatever the story happens to be.
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            <Text variant="body" style={{ fontSize: 22, lineHeight: 26 }}>
              {emoji}
            </Text>
          </PressableScale>
        ))}
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: spacing.sm }}>
        <TextInput
          accessibilityLabel={`Reply to ${authorName}`}
          placeholder={`Reply to ${authorName}…`}
          placeholderTextColor="rgba(255,255,255,0.7)"
          multiline
          value={draft}
          onChangeText={setDraft}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          style={{
            flex: 1,
            maxHeight: 96,
            minHeight: 44,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.45)",
            backgroundColor: "rgba(0,0,0,0.35)",
            color: colors.onMedia,
            ...inputTextStyle(true),
            paddingHorizontal: spacing.md,
            paddingTop: spacing.xs + 2,
            paddingBottom: spacing.xs + 2,
          }}
        />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Send reply"
          accessibilityState={{ disabled: !draft.trim() }}
          disabled={!draft.trim()}
          onPress={() => deliver(draft)}
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: draft.trim() ? colors.accent : "rgba(0,0,0,0.35)",
          }}
        >
          <Icon name="send" size={18} color={draft.trim() ? colors.accentFg : colors.onMedia} />
        </PressableScale>
      </View>
    </View>
  );
}
