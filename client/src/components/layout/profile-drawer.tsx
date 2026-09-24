import * as Haptics from "expo-haptics";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { SlideInLeft, SlideOutLeft, FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, PressableScale, Text, Icon, type IconName } from "@/src/components/ui";
import { useAttention } from "@/src/services/AttentionContext";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export interface ProfileDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  user: { name: string; username: string; avatar: string };
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

const MENU: { id: string; title: string; icon: IconName }[] = [
  { id: "home", title: "Home", icon: "home" },
  { id: "explore", title: "Explore", icon: "compass" },
  { id: "create", title: "Create", icon: "create" },
  { id: "campus", title: "Campus", icon: "campus" },
  { id: "profile", title: "Your profile", icon: "profile" },
  { id: "messages", title: "Messages", icon: "message" },
  { id: "connections", title: "Connections", icon: "connectAdd" },
  { id: "saved", title: "Saved posts", icon: "save" },
  { id: "groups", title: "Study groups", icon: "connect" },
  { id: "events", title: "Events", icon: "events" },
  { id: "settings", title: "Settings", icon: "settings" },
  { id: "help", title: "Help", icon: "help" },
];

export default function ProfileDrawer({
  isVisible,
  onClose,
  user,
  onNavigate,
  onLogout,
}: ProfileDrawerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const attention = useAttention();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(320, width * 0.82);

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(140)}
        style={StyleSheet.absoluteFill}
      >
        <Pressable
          accessibilityLabel="Close menu"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(7,18,25,0.45)" }]}
        />
      </Animated.View>

      <Animated.View
        entering={SlideInLeft.duration(220)}
        exiting={SlideOutLeft.duration(180)}
        style={{
          width: panelWidth,
          height: "100%",
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: colors.border,
        }}
      >
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg }}>
          <Avatar uri={user.avatar} size={56} />
          <View>
            <Text variant="heading">{user.name}</Text>
            <Text variant="caption" color="textMuted">
              {user.username}
            </Text>
          </View>
        </View>

        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: spacing.xs }}
          showsVerticalScrollIndicator={false}
        >
          {MENU.map((item) => {
            // The count appears here rather than on the avatar: this is the
            // row that leads to the thing, so it is where the number is worth
            // reading.
            const waiting = item.id === "connections" ? attention.connectionRequests : 0;

            return (
              <PressableScale
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={waiting ? `${item.title}, ${waiting} waiting` : item.title}
                onPress={() => {
                  Haptics.selectionAsync();
                  onNavigate(item.id);
                  onClose();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                  paddingHorizontal: spacing.lg,
                  minHeight: 48,
                }}
              >
                <Icon name={item.icon} size={19} color={colors.textSecondary} />
                <Text variant="body" style={{ flex: 1 }}>
                  {item.title}
                </Text>

                {waiting ? (
                  <View
                    style={{
                      minWidth: 22,
                      height: 22,
                      paddingHorizontal: 6,
                      borderRadius: radius.full,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: culture.pink,
                    }}
                  >
                    <Text variant="caption" style={{ color: culture.warmWhite, fontSize: 11 }}>
                      {waiting > 9 ? "9+" : waiting}
                    </Text>
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </ScrollView>

        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />

        <PressableScale
          accessibilityRole="button"
          onPress={() => {
            onLogout();
            onClose();
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.md,
            paddingHorizontal: spacing.lg,
            minHeight: 48,
            marginTop: spacing.xs,
          }}
        >
          <Icon name="logout" size={19} color={colors.destructive} />
          <Text variant="body" color="destructive">
            Log out
          </Text>
        </PressableScale>
      </Animated.View>
    </Modal>
  );
}
