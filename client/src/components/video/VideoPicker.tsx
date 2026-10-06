import { View } from "react-native";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface VideoPickerProps {
  onSelectGallery: () => void;
  onSelectFiles: () => void;
  onRecord: () => void;
  disabled?: boolean;
}

/** The entry chooser: gallery, a file, or record. Owns no picker/camera
 * logic itself -- each button calls back into
 * `services/video/videoPicker.ts` / `videoRecorder.ts` via whatever the
 * parent flow wires up, keeping this component pure UI. */
export function VideoPicker({ onSelectGallery, onSelectFiles, onRecord, disabled }: VideoPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: spacing.md }}>
      <Option
        icon="photo"
        label="Select from Gallery"
        onPress={onSelectGallery}
        disabled={disabled}
        colors={colors}
      />
      <Option
        icon="video"
        label="Choose a file"
        onPress={onSelectFiles}
        disabled={disabled}
        colors={colors}
      />
      <Option icon="camera" label="Record Video" onPress={onRecord} disabled={disabled} colors={colors} />
    </View>
  );
}

function Option({
  icon,
  label,
  onPress,
  disabled,
  colors,
}: {
  icon: "photo" | "camera" | "video";
  label: string;
  onPress: () => void;
  disabled?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        minHeight: 64,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceSunken,
        }}
      >
        <Icon name={icon} size={19} color={colors.textPrimary} />
      </View>
      <Text variant="body">{label}</Text>
    </PressableScale>
  );
}
