import { router } from "expo-router";
import { useMemo } from "react";

import { Text } from "@/src/components/ui";
import { type TextProps } from "@/src/components/ui/Text";
import { parseMentions } from "@/src/features/mentions/parse";
import { useTheme } from "@/src/styles/useTheme";

export interface MentionTextProps extends TextProps {
  content: string | null | undefined;
}

/**
 * Post and comment text with `@[label](user_id)` markers rendered as tappable
 * names.
 *
 * The mentions are NESTED Text nodes, not Pressables. React Native lays a
 * Pressable out as a block, so wrapping one round a name would break the line
 * it sits in -- the text would stop wrapping around it and the mention would
 * jump onto its own line. A nested Text with onPress stays part of the
 * paragraph, which is the only reason this reads as a sentence.
 *
 * Falls through to a plain Text when there is nothing to linkify, so the
 * overwhelmingly common case costs one regex test and no extra nodes.
 */
export function MentionText({ content, ...textProps }: MentionTextProps) {
  const { colors } = useTheme();
  const segments = useMemo(() => parseMentions(content), [content]);

  if (segments.length === 0) return null;
  if (segments.length === 1 && segments[0].type === "text") {
    return <Text {...textProps}>{segments[0].text}</Text>;
  }

  return (
    <Text {...textProps}>
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          segment.text
        ) : (
          <Text
            // Index is a stable key here: the list is derived from the content
            // string and is rebuilt whenever it changes.
            key={`${segment.userId}-${index}`}
            accessibilityRole="link"
            accessibilityLabel={`${segment.label}, open profile`}
            // Weight does the work on photography and colour does it
            // everywhere else: over an arbitrary photo the accent has no
            // reliable contrast, so a mention there is distinguished by
            // weight alone rather than by a colour that might vanish.
            style={
              textProps.onMedia
                ? { fontWeight: "600" }
                : { color: colors.accent, fontWeight: "600" }
            }
            onPress={() =>
              router.push({ pathname: "/person/[id]", params: { id: segment.userId } })
            }
          >
            @{segment.label}
          </Text>
        )
      )}
    </Text>
  );
}
