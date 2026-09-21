import { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface FieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  /** Renders the show/hide toggle and starts obscured. */
  secure?: boolean;
  /** Optional leading Hugeicon. */
  icon?: IconName;
}

/**
 * One text field for the whole app. The label sits above the input rather than
 * as a placeholder, so it does not vanish once the user types — placeholder-only
 * labelling is the most common accessibility regression in sign-up forms.
 *
 * Errors are inline, never an Alert.
 */
export function Field({ label, error, secure, icon, onFocus, onBlur, ...rest }: FieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.accent : colors.border;

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 56,
          borderRadius: radius.sm,
          borderWidth: focused || error ? 1.5 : 1,
          borderColor,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        }}
      >
        {icon ? (
          <Icon
            name={icon}
            size={20}
            color={focused ? colors.accent : colors.textMuted}
            strokeWidth={focused ? 2 : 1.8}
          />
        ) : null}

        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          secureTextEntry={secure && !revealed}
          {...rest}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          // `inputTextStyle()` drops lineHeight for a single-line input: with it,
          // iOS stops centring the text and the glyphs sit low in the field.
          style={[
            inputTextStyle(rest.multiline),
            {
              flex: 1,
              paddingVertical: 0,
              color: colors.textPrimary,
              // No minHeight: the row already sets the height and centres on
              // the cross axis. A near-equal minHeight on the input fought it.
            },
          ]}
        />

        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? `Hide ${label}` : `Show ${label}`}
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            style={{ width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" }}
          >
            <Icon name={revealed ? "hidden" : "visible"} size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}>
          <Icon name="alert" size={14} color={colors.destructive} strokeWidth={2} />
          <Text variant="caption" color="destructive" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
