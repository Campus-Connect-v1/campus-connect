import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, Text, type IconName } from "@/src/components/ui";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

import { PressableScale } from "@/src/components/ui";

/**
 * The five top-level destinations.
 *
 * Connect and Events hold slots because they are where the app's own data
 * lives: people nearby and what is happening. Create came out because it is an
 * action, not a destination (it now sits in the Home header and the drawer),
 * and Explore came out because it is a grid of links into these same tabs
 * rather than a place with content of its own.
 */
const TABS: Record<string, { icon: IconName; label: string }> = {
  home: { icon: "home", label: "Home" },
  connect: { icon: "connect", label: "Connect" },
  events: { icon: "events", label: "Events" },
  campus: { icon: "campus", label: "Campus" },
  profile: { icon: "profile", label: "You" },
};

/**
 * A single ink-dark capsule floating over the content. The active tab is a
 * filled pill in that section's hue with its label; the others are bare icons.
 *
 * The bar is glass: a blur over whatever is scrolling underneath, tinted dark
 * so the icons hold their contrast. Blur is confined to overlays like this one
 * and the map card — it is not used on cards or list rows, where it costs
 * compositing work and buys nothing.
 *
 * `overflow: hidden` on the wrapper is load-bearing: without it the BlurView
 * ignores the border radius on Android and renders a blurred rectangle.
 */
function TabBar({ state, navigation }: BottomTabBarProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const restingIcon = "rgba(255,255,255,0.65)";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, spacing.md),
        alignItems: "center",
      }}
    >
      <View
        style={{
          borderRadius: radius.full,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.14)",
          shadowColor: culture.ink,
          shadowOpacity: 0.28,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}
      >
        <BlurView
          intensity={isDark ? 60 : 40}
          tint="dark"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing["3xs"],
            padding: spacing["2xs"] + 2,
            // Android's blur is weaker, so it gets a scrim underneath to keep
            // the icons legible over a bright photo.
            backgroundColor: "rgba(11,14,18,0.42)",
          }}
        >
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const tab = TABS[route.name];
            if (!tab) return null;
            const foreground = culture.ink;

            return (
              // A duration, not a spring: a spring on the bar's own layout
              // overshoots and the whole row visibly bounces on every tab change.
              <Animated.View key={route.key} layout={LinearTransition.duration(200)}>
                <PressableScale
                  accessibilityRole="tab"
                  accessibilityState={{ selected: focused }}
                  accessibilityLabel={tab.label}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing["2xs"],
                    height: 48,
                    minWidth: 52,
                    justifyContent: "center",
                    paddingHorizontal: focused ? spacing.md : 0,
                    borderRadius: radius.full,
                    backgroundColor: focused ? culture.lime : "transparent",
                  }}
                >
                  <Icon
                    name={tab.icon}
                    size={21}
                    strokeWidth={focused ? 2 : 1.8}
                    color={focused ? foreground : restingIcon}
                  />
                  {focused ? (
                    <Text variant="label" style={{ color: foreground }}>
                      {tab.label}
                    </Text>
                  ) : null}
                </PressableScale>
              </Animated.View>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="connect" options={{ title: "Connect" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="campus" options={{ title: "Campus" }} />
      <Tabs.Screen name="profile" options={{ title: "You" }} />
      {/* Reachable from the Home header, Campus and the drawer, but not
          destinations in their own right. */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="create" options={{ href: null }} />
    </Tabs>
  );
}
