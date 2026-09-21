import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Linking, ScrollView, View } from "react-native";

import { SettingsRow, SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import {
  Avatar,
  Button,
  EmptyState,
  Icon,
  InlineNotice,
  Loader,
  PressableScale,
  Text,
} from "@/src/components/ui";
import { adaptProfile } from "@/src/features/profile/adapt";
import { useUploadsEnabled } from "@/src/hooks/useUploadsEnabled";
import {
  captureWithCamera,
  pickFromLibrary,
  type PickedMedia,
  type PickResult,
} from "@/src/services/media";
import { useSession } from "@/src/services/SessionContext";
import { uploadMedia } from "@/src/services/uploadServices";
import { updateProfile } from "@/src/services/userServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export default function AccountSettingsScreen() {
  const { colors } = useTheme();
  const { profile, university, loadingProfile, profileError, refresh } = useSession();

  const display = useMemo(() => (profile ? adaptProfile(profile) : null), [profile]);

  const [picked, setPicked] = useState<PickedMedia | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canUpload = useUploadsEnabled();

  // Picks up whatever the edit screen saved on the way back.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const choosePhoto = async (pick: () => Promise<PickResult>) => {
    setError(null);
    const result = await pick();

    if (result.status === "denied") {
      setPermissionBlocked(!result.canAskAgain);
      setError(
        result.canAskAgain
          ? "Campus Connect needs access to your photos to change your picture."
          : "Photo access is switched off for Campus Connect in your device settings."
      );
      return;
    }
    if (result.status !== "picked") return;

    Haptics.selectionAsync();
    setPicked(result.media);
    setNotice(null);

    if (!canUpload) {
      setError("Media hosting is not configured on the server, so this cannot be saved yet.");
      return;
    }

    // Uploaded and saved in one go. A picture that only previews until you
    // navigate away is the kind of control that looks like it worked.
    setUploadingPhoto(true);
    const uploaded = await uploadMedia(result.media, "avatars");

    if (!uploaded.success) {
      setUploadingPhoto(false);
      setPicked(null);
      setError(uploaded.error);
      return;
    }

    const saved = await updateProfile({ profile_picture_url: uploaded.url });
    setUploadingPhoto(false);

    if (!saved.success) {
      setPicked(null);
      setError(saved.error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotice("Profile picture updated.");
    await refresh();
    setPicked(null);
  };

  if (loadingProfile && !display) {
    return (
      <SettingsShell title="Account">
        <EmptyState.Loading />
      </SettingsShell>
    );
  }

  if (!display) {
    return (
      <SettingsShell title="Account">
        <EmptyState
          tone="error"
          title="Could not load your account"
          body={profileError ?? "Check your connection and try again."}
          actionLabel="Try again"
          onAction={refresh}
        />
      </SettingsShell>
    );
  }

  // Headline, LinkedIn and website are deliberately not shown here:
  // GET /user/profile does not return them, so every row would read "Not set".
  // The edit screen reads them from GET /user/:userId instead.
  const row = profile as { graduation_year?: number | null };

  return (
    <SettingsShell title="Account">
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <View style={{ alignItems: "center", gap: spacing.sm }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={uploadingPhoto ? "Uploading picture" : "Change profile picture"}
            disabled={uploadingPhoto}
            onPress={() => choosePhoto(() => pickFromLibrary("image"))}
            onLongPress={() => choosePhoto(() => captureWithCamera("image"))}
            style={{ alignSelf: "center" }}
          >
            <Avatar uri={picked?.uri ?? display.avatar ?? undefined} size={88} />
            {uploadingPhoto ? (
              <View
                style={{
                  position: "absolute",
                  width: 88,
                  height: 88,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(7,18,25,0.5)",
                }}
              >
                <Loader color={colors.onMedia} />
              </View>
            ) : null}
            {/* The badge is what makes the avatar read as tappable; an avatar
                with no affordance is just a picture. */}
            <View
              style={{
                position: "absolute",
                right: -2,
                bottom: -2,
                width: 32,
                height: 32,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <Icon name="camera" size={15} color={colors.accentFg} />
            </View>
          </PressableScale>

          <Text variant="heading">{display.name}</Text>
          <Text variant="caption" color="textMuted">
            @{display.handle}
            {university ? ` · ${university.label}` : ""}
          </Text>

          <Button
            label="Edit profile"
            fullWidth={false}
            icon={<Icon name="edit" size={17} color={colors.accentFg} />}
            onPress={() => router.push("/settings/edit-profile")}
            style={{ alignSelf: "center" }}
          />
        </View>

        {notice ? <InlineNotice tone="success" message={notice} /> : null}
        {error ? <InlineNotice message={error} /> : null}
        {permissionBlocked ? (
          <Button
            label="Open settings"
            variant="secondary"
            onPress={() => Linking.openSettings()}
          />
        ) : null}

        <View
          style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
        >
          <SettingsRow title="Campus email" detail={display.email ?? "Not set"} icon="message" />
          <SettingsRow
            title="Programme"
            detail={[display.programme, display.year].filter(Boolean).join(" · ") || "Not set"}
            icon="course"
            onPress={() => router.push("/settings/edit-profile")}
          />
          <SettingsRow
            title="Graduating"
            detail={row?.graduation_year ? String(row.graduation_year) : "Not set"}
            icon="academic"
            onPress={() => router.push("/settings/edit-profile")}
          />
          <SettingsRow
            title="University"
            detail={university?.label ?? display.university ?? "Not set"}
            icon="campus"
          />
        </View>

        <View
          style={{ borderRadius: radius.md, backgroundColor: colors.surface, overflow: "hidden" }}
        >
          <SettingsRow
            title="Delete account"
            detail="Permanently remove your data"
            icon="alert"
            destructive
            onPress={() => router.push("/settings/delete-account")}
          />
        </View>
      </ScrollView>
    </SettingsShell>
  );
}
