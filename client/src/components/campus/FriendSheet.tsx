import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Avatar, Icon, PressableScale, Text } from "@/src/components/ui";
import { since } from "@/src/features/map/presence";
import { useCampusLookup } from "@/src/hooks/useCampusRing";
import {
  createConversation,
  fetchConversationWith,
} from "@/src/services/conversationServices";
import type { FriendLocation } from "@/src/services/friendMapServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const PRECISION_LABEL: Record<string, string> = {
  exact: "",
  area: "Somewhere around here",
  city: "Somewhere in the area",
};

function Action({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: "message" | "profile" | "play";
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  const { colors } = useTheme();

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 46,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing["2xs"],
        borderRadius: radius.full,
        backgroundColor: tint ?? "rgba(255,255,255,0.14)",
      }}
    >
      <Icon name={icon} size={16} color={tint ? culture.ink : colors.onMedia} />
      <Text variant="label" style={tint ? { color: culture.ink } : undefined} onMedia={!tint}>
        {label}
      </Text>
    </PressableScale>
  );
}

/**
 * The card that rises when a friend's marker is tapped.
 *
 * Deliberately does NOT show a street address or coordinates, even when the
 * position is exact — the map already shows where they are, and spelling it out
 * turns a glance into a record worth screenshotting.
 */
export function FriendSheet({
  friend,
  bottom,
  onClose,
}: {
  friend: FriendLocation;
  bottom: number;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const campusOf = useCampusLookup();
  const campus = campusOf(friend.universityId);

  const ago = since(friend.lastSeen);
  const place =
    friend.placeLabel ?? (friend.precision === "exact" ? null : PRECISION_LABEL[friend.precision]);

  const openChat = async () => {
    const existing = await fetchConversationWith(friend.userId);
    const conversation = existing.success ? existing : await createConversation(friend.userId);
    if (!conversation.success) return;

    onClose();
    router.push({
      pathname: "/messages/[id]",
      params: {
        id: conversation.data._id,
        participantId: friend.userId,
        name: friend.name,
      },
    });
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      style={{
        position: "absolute",
        left: spacing.lg,
        right: spacing.lg,
        bottom,
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.16)",
      }}
    >
      <BlurView
        intensity={70}
        tint="dark"
        style={{ padding: spacing.sm, gap: spacing.sm, backgroundColor: "rgba(11,14,18,0.55)" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Avatar
            uri={friend.avatar ?? undefined}
            size={54}
            ring
            ringColor={friend.hasStory ? culture.pink : campus?.color}
            ringWidth={friend.hasStory ? 3 : 2}
          />

          <View style={{ flex: 1 }}>
            <Text variant="heading" onMedia numberOfLines={1}>
              {friend.name}
            </Text>
            <Text variant="caption" onMedia style={{ opacity: 0.8 }} numberOfLines={1}>
              {[campus?.label, place].filter(Boolean).join(" · ") || "On the map"}
            </Text>
            <Text variant="caption" onMedia style={{ opacity: 0.6 }}>
              {friend.isOnline ? "Active now" : ago ? `Last seen ${ago} ago` : "Location is old"}
            </Text>
          </View>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Close ${friend.name}`}
            onPress={onClose}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={18} color={colors.onMedia} />
          </PressableScale>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {friend.hasStory ? (
            <Action
              icon="play"
              label="Story"
              tint={culture.pink}
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/stories/[userId]",
                  params: { userId: friend.userId },
                });
              }}
            />
          ) : null}

          <Action icon="message" label="Message" onPress={openChat} />

          <Action
            icon="profile"
            label="Profile"
            onPress={() => {
              onClose();
              router.push({ pathname: "/person/[id]", params: { id: friend.userId } });
            }}
          />
        </View>
      </BlurView>
    </Animated.View>
  );
}
