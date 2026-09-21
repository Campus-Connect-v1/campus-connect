import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useTheme } from "@/src/styles/useTheme";
import { type ColorToken, type TypeVariant, type as typeScale } from "@/src/styles/theme";

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  /** Semantic colour token. Defaults to the primary ink for the active mode. */
  color?: ColorToken;
  /** For text sitting on top of photography. Ignores the colour scheme. */
  onMedia?: boolean;
}

/**
 * The only Text in the app. Screens choose a scale token, never a fontSize.
 *
 * Dynamic Type bounds ride along with the variant: chrome (display, title,
 * label, micro) is capped so custom containers cannot be burst, while body and
 * caption scale without limit.
 */
export function Text({ variant = "body", color, onMedia, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const token = typeScale[variant];
  const resolved = onMedia ? colors.onMedia : colors[color ?? "textPrimary"];

  return (
    <RNText
      maxFontSizeMultiplier={
        "maxFontSizeMultiplier" in token ? token.maxFontSizeMultiplier : undefined
      }
      {...rest}
      style={[token.style, { color: resolved }, style]}
    />
  );
}
