import { View } from "react-native";

import { PressableScale, Text } from "@/src/components/ui";
import { spacing } from "@/src/styles/theme";

/**
 * A fixed, curated emoji set rather than the device's full system emoji
 * keyboard: this project has no dependency that surfaces the native emoji
 * picker as a React Native component (it is normally reached through the
 * OS keyboard, not an in-app grid), and pulling in the full Unicode set
 * would be a picker of its own to build. This list covers what a campus
 * social app's videos actually use.
 */
const EMOJI = [
  "😀", "😂", "😍", "🥳", "😎", "🤔", "😴", "🥺",
  "🔥", "💯", "🎉", "👏", "🙌", "👍", "🤝", "✨",
  "❤️", "💜", "💛", "💚", "💙", "🖤", "🤍", "💔",
  "🎓", "📚", "⚽", "🏀", "🎮", "🎵", "☕", "🍕",
];

interface VideoEmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function VideoEmojiPicker({ onSelect }: VideoEmojiPickerProps) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {EMOJI.map((emoji) => (
        <PressableScale
          key={emoji}
          accessibilityRole="button"
          accessibilityLabel={`Add ${emoji} emoji`}
          onPress={() => onSelect(emoji)}
          style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 30, lineHeight: 36 }}>{emoji}</Text>
        </PressableScale>
      ))}
    </View>
  );
}
