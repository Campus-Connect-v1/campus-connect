import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, PressableScale, Text, Icon, Loader } from "@/src/components/ui";
import type { UniversityOption } from "@/src/services/universityServices";
import { inputTextStyle, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface Props {
  universities: UniversityOption[];
  loading: boolean;
  /** Set when the list could not be used at all; shown instead of the control. */
  unavailableReason: string | null;
  value: string;
  onChange: (universityId: string) => void;
  onRetry?: () => void;
  error?: string;
}

/**
 * Supplies the `university_id` that POST /auth/register requires.
 *
 * The register screen fills this in automatically from the email domain when it
 * can; this control exists for the cases it cannot — a personal address, a
 * campus with several domains, or a domain not yet in the table.
 */
export function UniversityPicker({
  universities,
  loading,
  unavailableReason,
  value,
  onChange,
  onRetry,
  error,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = universities.find((uni) => uni.university_id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(
      (uni) => uni.label.toLowerCase().includes(q) || uni.value.toLowerCase().includes(q)
    );
  }, [query, universities]);

  if (unavailableReason) {
    return (
      <View style={{ gap: 6 }}>
        <Text variant="label" color="textSecondary">
          University
        </Text>
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.destructive,
            padding: spacing.md,
            gap: spacing["2xs"],
          }}
        >
          <Text variant="caption" color="destructive">
            {unavailableReason}
          </Text>
          <Text variant="caption" color="textMuted">
            Registration needs a verified university from the API before it can continue.
          </Text>
          {onRetry ? (
            <Button label="Try again" fullWidth={false} variant="secondary" onPress={onRetry} />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      <Text variant="label" color="textSecondary">
        University
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected ? `University: ${selected.label}` : "Choose your university"}
        onPress={() => setOpen(true)}
        disabled={loading}
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 60,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        }}
      >
        {loading ? <Loader color={colors.textMuted} /> : null}
        {!loading ? <Icon name="campus" size={20} color={colors.textMuted} /> : null}
        <Text
          variant="body"
          color={selected ? "textPrimary" : "textMuted"}
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {loading ? "Loading universities" : (selected?.label ?? "Choose your university")}
        </Text>
        <Icon name="forward" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}>
          <Icon name="alert" size={14} color={colors.destructive} strokeWidth={2} />
          <Text variant="caption" color="destructive" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
              gap: spacing.md,
            }}
          >
            <Text variant="heading" style={{ flex: 1 }}>
              Your university
            </Text>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setOpen(false)}
            >
              <Icon name="close" size={22} color={colors.textPrimary} />
            </PressableScale>
          </View>

          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
            <View
              style={{
                minHeight: 56,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.md,
              }}
            >
              <Icon name="search" size={20} color={colors.textMuted} />
              <TextInput
                placeholder="Search universities"
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.accent}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                style={[
                  inputTextStyle(),
                  { flex: 1, paddingVertical: 0, color: colors.textPrimary },
                ]}
              />
            </View>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.university_id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
            ListEmptyComponent={
              <Text variant="body" color="textMuted" style={{ padding: spacing.lg }}>
                No university matches that.
              </Text>
            }
            renderItem={({ item }) => (
              <PressableScale
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(item.university_id);
                  setOpen(false);
                }}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  minHeight: 56,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="body">{item.label}</Text>
                  <Text variant="caption" color="textMuted">
                    {[item.value, item.location].filter(Boolean).join(" · ")}
                  </Text>
                </View>
                {item.university_id === value ? (
                  <Icon name="check" size={18} color={colors.accent} />
                ) : null}
              </PressableScale>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
