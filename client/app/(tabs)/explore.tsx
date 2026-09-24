import { router } from "expo-router";
import { ScrollView, View, useWindowDimensions } from "react-native";

import {
  Icon,
  GraphicOverlay,
  Media,
  PressableScale,
  Screen,
  Sticker,
  Text,
  type IconName,
} from "@/src/components/ui";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

type Destination = {
  title: string;
  kicker: string;
  icon: IconName;
  color: string;
  image: string;
  route?: "/(tabs)/events" | "/(tabs)/connect" | "/(tabs)/campus";
  tall?: boolean;
};

const DESTINATIONS: Destination[] = [
  {
    title: "Events",
    kicker: "TONIGHT",
    icon: "events",
    color: culture.yellow,
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&q=75&auto=format&fit=crop",
    route: "/(tabs)/events",
    tall: true,
  },
  {
    title: "People",
    kicker: "NEAR YOU",
    icon: "connect",
    color: culture.pink,
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=75&auto=format&fit=crop",
    route: "/(tabs)/connect",
  },
  {
    title: "Clubs",
    kicker: "FIND YOUR PEOPLE",
    icon: "connect",
    color: culture.lime,
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&q=75&auto=format&fit=crop",
    route: "/(tabs)/events",
  },
  {
    title: "Sports",
    kicker: "GAME DAY",
    icon: "sports",
    color: culture.violet,
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=75&auto=format&fit=crop",
    tall: true,
  },
  {
    title: "Food",
    kicker: "AROUND RMU",
    icon: "food",
    color: culture.yellow,
    image:
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=900&q=75&auto=format&fit=crop",
  },
  {
    title: "Opportunities",
    kicker: "BUILD YOUR NEXT",
    icon: "course",
    color: culture.lime,
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=75&auto=format&fit=crop",
  },
  {
    title: "Marketplace",
    kicker: "STUDENT DEALS",
    icon: "save",
    color: culture.pink,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=75&auto=format&fit=crop",
  },
  {
    title: "Campus News",
    kicker: "JUST IN",
    icon: "message",
    color: culture.violet,
    image:
      "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=900&q=75&auto=format&fit=crop",
    route: "/(tabs)/campus",
  },
];

export default function ExploreScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const gap = spacing.sm;
  const tileWidth = (width - spacing.lg * 2 - gap) / 2;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md }}>
          <Text variant="title">Explore</Text>
          <PressableScale
            accessibilityRole="search"
            accessibilityLabel="Search for people"
            onPress={() => router.push("/search")}
            style={{
              minHeight: 50,
              borderRadius: radius.full,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
            }}
          >
            <Icon name="search" size={20} color={colors.textMuted} />
            <Text variant="body" color="textMuted">
              Search for people
            </Text>
          </PressableScale>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap,
            paddingHorizontal: spacing.lg,
          }}
        >
          {[0, 1].map((column) => (
            <View key={column} style={{ width: tileWidth, gap }}>
              {DESTINATIONS.filter((_, index) => index % 2 === column).map((item) => (
                <PressableScale
                  key={item.title}
                  accessibilityRole="button"
                  accessibilityLabel={`Explore ${item.title}`}
                  onPress={() => item.route && router.push(item.route)}
                >
                  <Media
                    source={item.image}
                    scrim="full"
                    rounded="md"
                    style={{ height: item.tall ? 250 : 190 }}
                  >
                    <GraphicOverlay
                      color={culture.warmWhite}
                      pattern={column ? "dots" : "rays"}
                      opacity={0.08}
                    />
                    <View style={{ flex: 1, justifyContent: "space-between", padding: spacing.sm }}>
                      <Sticker
                        label={item.kicker}
                        backgroundColor={item.color}
                        rotation={column ? 2 : -2}
                      />
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                        <Icon name={item.icon} size={20} color={colors.onMedia} />
                        <Text variant="heading" onMedia>
                          {item.title}
                        </Text>
                      </View>
                    </View>
                  </Media>
                </PressableScale>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
