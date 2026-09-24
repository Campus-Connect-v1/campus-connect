import { router } from "expo-router";
import { useCallback } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, EmptyState, Icon, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { since } from "@/src/features/map/presence";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchStoryViewers } from "@/src/services/storyServices";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * Who has seen one of your stories.
 *
 * Only ever opened on your OWN story — the viewer list of someone else's is
 * not yours to see, and the server enforces that too.
 */
export function StoryViewers({
  storyId,
  visible,
  onClose,
}: {
  storyId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const viewers = useAsync(
    useCallback(
      () =>
        visible
          ? fetchStoryViewers(storyId)
          : Promise.resolve({ success: true as const, data: [] }),
      [storyId, visible]
    ),
    [storyId, visible]
  );

  const count = (viewers.data ?? []).length;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(120)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityLabel="Close viewers"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,18,25,0.6)" }]}
        />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(220)}
        exiting={SlideOutDown.duration(180)}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "70%",
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + spacing.md,
        }}
      >
        <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: radius.full,
              backgroundColor: colors.borderStrong,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.sm,
          }}
        >
          <Text variant="heading" style={{ flex: 1 }}>
            {viewers.loading ? "Views" : count === 1 ? "1 view" : `${count} views`}
          </Text>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={18} color={colors.textMuted} />
          </PressableScale>
        </View>

        <FlatList
          data={viewers.data ?? []}
          keyExtractor={(item) => item.user_id}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          ListEmptyComponent={
            viewers.loading ? (
              <SkeletonList count={3} />
            ) : viewers.error ? (
              <EmptyState
                tone="error"
                compact
                title="Could not load views"
                body={viewers.error}
                actionLabel="Try again"
                onAction={viewers.reload}
              />
            ) : (
              <EmptyState
                compact
                title="No views yet"
                body="People who watch this story will be listed here."
              />
            )
          }
          renderItem={({ item }) => {
            const name = [item.first_name, item.last_name].filter(Boolean).join(" ").trim();
            return (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`${name}, viewed ${since(item.viewed_at) ?? "recently"} ago`}
                onPress={() => {
                  onClose();
                  router.push({ pathname: "/person/[id]", params: { id: item.user_id } });
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  minHeight: 60,
                }}
              >
                <Avatar uri={item.profile_picture_url ?? undefined} size={42} />
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {name || "Someone"}
                </Text>
                <Text variant="caption" color="textMuted">
                  {since(item.viewed_at)}
                </Text>
              </PressableScale>
            );
          }}
        />
      </Animated.View>
    </Modal>
  );
}
