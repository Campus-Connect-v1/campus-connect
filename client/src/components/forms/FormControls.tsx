import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, ScrollView, TextInput, View, type TextInputProps } from "react-native";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { culture, inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * A labelled field. The label sits ABOVE the input, never inside it.
 *
 * Matches `ui/Field` in label treatment, height, radius and focus behaviour —
 * the two used to disagree, so the same form looked different depending on
 * which one a screen happened to reach for.
 */
export function FormField({
  label,
  hint,
  error,
  multiline,
  onFocus,
  onBlur,
  ...input
}: { label?: string; hint?: string; error?: string } & TextInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.accent : colors.border;

  return (
    <View style={{ gap: 6 }}>
      {/* Omitted where the field sits under a heading that already names it,
          such as a poll's numbered option rows. */}
      {label ? (
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      ) : null}

      <View
        style={{
          minHeight: multiline ? 108 : 56,
          borderRadius: radius.sm,
          borderWidth: focused || error ? 1.5 : 1,
          borderColor,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          justifyContent: multiline ? "flex-start" : "center",
        }}
      >
        <TextInput
          accessibilityLabel={label ?? input.placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          multiline={multiline}
          {...input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          // lineHeight is dropped for single-line inputs: iOS treats it as a
          // paragraph style and stops centring the text, which reads as the
          // text sliding down out of the control.
          style={[
            inputTextStyle(multiline),
            {
              color: colors.textPrimary,
              paddingVertical: multiline ? spacing.sm : 0,
              minHeight: multiline ? 92 : undefined,
              textAlignVertical: multiline ? "top" : "center",
            },
          ]}
        />
      </View>

      {error ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}>
          <Icon name="alert" size={14} color={colors.destructive} strokeWidth={2} />
          <Text variant="caption" color="destructive" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}

      {hint && !error ? (
        <Text variant="caption" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** A horizontal row of mutually exclusive choices. */
export function FormChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing["2xs"] }}>
      <Text variant="micro" color="textMuted">
        {label.toUpperCase()}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Pinned to its content: a horizontal ScrollView in a column parent
        // otherwise stretches to fill the space below it.
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: spacing.xs, alignItems: "center" }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={option.label}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(option.value);
              }}
              style={{
                minHeight: 44,
                paddingHorizontal: spacing.md,
                justifyContent: "center",
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: active ? culture.lime : colors.border,
                backgroundColor: active ? culture.lime : "transparent",
              }}
            >
              <Text variant="label" style={active ? { color: culture.ink } : undefined}>
                {option.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** An on/off row, for the booleans a form needs. */
export function FormSwitchRow({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={`${label}. ${detail}`}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 60,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        <Text variant="caption" color="textMuted">
          {detail}
        </Text>
      </View>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: value ? 0 : 1,
          borderColor: colors.borderStrong,
          backgroundColor: value ? culture.lime : "transparent",
        }}
      >
        {value ? <Icon name="check" size={15} color={culture.ink} /> : null}
      </View>
    </PressableScale>
  );
}

function format(date: Date, mode: "date" | "datetime") {
  return mode === "date"
    ? date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
    : date.toLocaleString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

/**
 * Date and time in one control.
 *
 * iOS gets a single inline datetime picker. Android has no combined mode, so
 * it runs the two dialogs in sequence — picking the date then immediately the
 * time — which is the platform's own pattern rather than two separate rows.
 */
export function FormDateTime({
  label,
  value,
  minimumDate,
  maximumDate,
  mode = "datetime",
  placeholder,
  onChange,
}: {
  label: string;
  /** null renders the placeholder, for a date that has never been set. */
  value: Date | null;
  minimumDate?: Date;
  maximumDate?: Date;
  /** "date" skips the time step entirely (birthdays, not events). */
  mode?: "date" | "datetime";
  placeholder?: string;
  onChange: (next: Date) => void;
}) {
  const { colors } = useTheme();
  const [showing, setShowing] = useState<"none" | "date" | "time">("none");

  const shown = value ? format(value, mode) : (placeholder ?? "Not set");

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}. Change`}
        onPress={() => setShowing("date")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          minHeight: 56,
          paddingHorizontal: spacing.md,
          borderRadius: radius.sm,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Icon name="events" size={18} color={colors.textMuted} />
        <Text variant="body" color={value ? undefined : "textMuted"} style={{ flex: 1 }}>
          {shown}
        </Text>
        <Icon name="forward" size={16} color={colors.textMuted} />
      </PressableScale>

      {showing !== "none" ? (
        <DateTimePicker
          // Falls back to a sensible starting point when nothing is set yet.
          value={value ?? maximumDate ?? new Date()}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          mode={Platform.OS === "ios" ? mode : showing}
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selected) => {
            if (Platform.OS === "ios") {
              if (selected) onChange(selected);
              if (event.type === "dismissed") setShowing("none");
              return;
            }

            if (event.type === "dismissed") {
              setShowing("none");
              return;
            }
            if (selected) onChange(selected);
            // Android has no combined picker, so datetime runs the two dialogs
            // back to back. A date-only field stops after the first.
            setShowing(mode === "date" ? "none" : showing === "date" ? "time" : "none");
          }}
        />
      ) : null}

      {Platform.OS === "ios" && showing !== "none" ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Done choosing"
          onPress={() => setShowing("none")}
          style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center" }}
        >
          <Text variant="label">Done</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
