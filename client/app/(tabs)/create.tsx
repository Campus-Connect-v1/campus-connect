import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import {
  GraphicOverlay,
  Icon,
  PressableScale,
  Screen,
  Sticker,
  Text,
  type IconName,
} from "@/src/components/ui";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const ACTIONS: {
  title: string;
  description: string;
  icon: IconName;
  color: string;
  route: string;
}[] = [
  {
    title: "Share a post",
    description: "A thought, photo or campus moment.",
    icon: "edit",
    color: culture.violet,
    route: "/compose/post",
  },
  {
    title: "Add to your story",
    description: "Text, a photo or a video. Gone in 24 hours.",
    icon: "camera",
    color: culture.pink,
    route: "/stories/compose",
  },
  {
    title: "Run a poll",
    description: "Ask campus a question and count the answers.",
    icon: "trending",
    color: culture.violet,
    route: "/compose/poll",
  },
  {
    title: "Create an event",
    description: "Put something on the campus calendar.",
    icon: "events",
    color: culture.yellow,
    route: "/compose/event",
  },
  {
    title: "Start a group",
    description: "Build a recurring space around an interest.",
    icon: "connect",
    color: culture.lime,
    route: "/compose/group",
  },
  {
    title: "Ask anonymously",
    description: "Start an honest campus conversation.",
    icon: "message",
    color: culture.violet,
    route: "/compose/anonymous",
  },
];

export default function CreateScreen() {
  const { colors } = useTheme();

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
      >
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xl }}>
          <View style={{ gap: spacing.sm }}>
            <Sticker label="MAKE IT HAPPEN" backgroundColor={culture.lime} />
            <Text variant="posterCompact">PUT SOMETHING{"\n"}ON CAMPUS.</Text>
            <Text variant="body" color="textSecondary">
              Post the thing people will be talking about between lectures.
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {ACTIONS.map((action, index) => {
              const violet = action.color === culture.violet;
              const foreground = violet ? culture.warmWhite : culture.ink;
              return (
                <PressableScale
                  key={action.title}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(action.route as never);
                  }}
                  style={{
                    minHeight: index === 0 ? 156 : 112,
                    borderRadius: radius.lg,
                    overflow: "hidden",
                    padding: spacing.lg,
                    backgroundColor: action.color,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                  }}
                >
                  <GraphicOverlay
                    color={foreground}
                    pattern={index % 2 ? "dots" : "orbit"}
                    opacity={violet ? 0.12 : 0.1}
                  />
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.full,
                      backgroundColor: violet ? "rgba(255,255,255,0.16)" : "rgba(22,22,22,0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={action.icon} size={24} color={foreground} />
                  </View>
                  <View style={{ flex: 1, gap: spacing["2xs"] }}>
                    <Text variant={index === 0 ? "title" : "heading"} style={{ color: foreground }}>
                      {action.title}
                    </Text>
                    <Text variant="caption" style={{ color: foreground, opacity: 0.78 }}>
                      {action.description}
                    </Text>
                  </View>
                  <Icon name="forward" size={18} color={foreground} />
                </PressableScale>
              );
            })}
          </View>

          <View
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.surface,
            }}
          >
            <Text variant="caption" color="textSecondary">
              Campus Connect keeps promotional areas expressive, but posting remains fast and
              focused.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
