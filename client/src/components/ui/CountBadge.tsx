import { View, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { culture, foregroundOn, radius } from "@/src/styles/theme";

interface CountBadgeProps {
  count: number;
  /** Diameter of the pill. It grows wider for two or more digits, never taller. */
  size?: number;
  background?: string;
  color?: string;
  /** Above this, the count is shown as "N+". */
  max?: number;
  style?: ViewStyle;
}

/**
 * The little count pill: unread messages, waiting requests, filter totals.
 *
 * It exists because the five hand-rolled copies had drifted. One of them --
 * the connections filter -- had no height and no alignment at all, so the
 * number sat against the leading edge of a pill whose height was whatever the
 * text's line box happened to be.
 *
 * The other four centred the box correctly and still looked a little low,
 * because they set fontSize on a Text whose variant carries its own
 * lineHeight. Overriding one without the other leaves the glyph sitting off
 * centre INSIDE a line box that is itself perfectly centred -- which is the
 * hardest version of this to see and to fix by eye.
 *
 * So both are set here, together, once.
 */
export function CountBadge({
  count,
  size = 20,
  background = culture.pink,
  color,
  max = 99,
  style,
}: CountBadgeProps) {
  if (!count || count < 1) return null;

  const label = count > max ? `${max}+` : String(count);
  // Comfortably inside the pill at every size used in the app.
  const fontSize = Math.round(size * 0.55);

  return (
    <View
      style={[
        {
          minWidth: size,
          height: size,
          paddingHorizontal: Math.round(size * 0.25),
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Text
        variant="micro"
        // lineHeight is set WITH fontSize, never without: the variant's own
        // lineHeight is sized for body copy and drops the glyph low here.
        style={{
          fontSize,
          lineHeight: fontSize + 1,
          color: color ?? foregroundOn(background),
        }}
        // A count must not reflow into two lines at large text sizes.
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
