import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { FlatList, View, useWindowDimensions, type ViewToken } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Media, PressableScale, Text, Icon } from "@/src/components/ui";
import { radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * Value-first onboarding: three full-bleed photographs of the thing the app is
 * actually for, each with one claim. No illustrated mascots, no feature tour,
 * no exclamation marks, and no permission requests — those are primed later, at
 * the moment of intent.
 */
const SLIDES = [
  {
    id: "s1",
    title: "Everything happening\non campus",
    body: "One feed for your hall, your department and the people you actually see every day.",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=75&auto=format&fit=crop",
  },
  {
    id: "s2",
    title: "Find the people\nin your lecture",
    body: "Verified university emails only, so the person in your study group is in your study group.",
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=75&auto=format&fit=crop",
  },
  {
    id: "s3",
    title: "Know what's on\nbefore it starts",
    body: "Events, revision sessions and night market runs, from the people already there.",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=75&auto=format&fit=crop",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/auth");
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      Haptics.selectionAsync();
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    finish();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.index;
    if (typeof first === "number") setIndex(first);
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <Media
            source={item.image}
            scrim="full"
            rounded="none"
            style={{ width, flex: 1 }}
            accessibilityIgnoresInvertColors
          >
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                padding: spacing.xl,
                paddingBottom: 200,
                gap: spacing.sm,
              }}
            >
              <Animated.View entering={FadeInDown.springify().damping(20)}>
                <Text variant="wordmark" onMedia>
                  {item.title}
                </Text>
              </Animated.View>
              <Animated.View entering={FadeIn.delay(120)}>
                <Text variant="body" onMedia style={{ opacity: 0.85 }}>
                  {item.body}
                </Text>
              </Animated.View>
            </View>
          </Media>
        )}
      />

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          gap: spacing.lg,
        }}
      >
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              style={{
                height: 3,
                flex: 1,
                borderRadius: radius.full,
                backgroundColor: i === index ? colors.onMedia : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </View>

        <Button
          label={index === SLIDES.length - 1 ? "Get started" : "Next"}
          onPress={next}
          icon={<Icon name="forward" size={17} color={colors.accentFg} />}
        />

        <PressableScale
          accessibilityRole="button"
          onPress={finish}
          style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}
        >
          <Text variant="caption" onMedia style={{ opacity: 0.8, textDecorationLine: "underline" }}>
            Skip
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}
