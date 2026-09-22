import { router } from "expo-router";
import { FlatList, Pressable, View } from "react-native";

import { Avatar, Icon, PressableScale, Text } from "@/src/components/ui";
import type { ApiStoryGroup } from "@/src/services/storyServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const RING_HUES = [culture.violet, culture.pink, culture.yellow, culture.lime];

/**
 * The row of story rings.
 *
 * An unseen ring is coloured and a fully-viewed one is a flat hairline, which
 * is the whole information design of a story rail: the colour is not
 * decoration, it is the unread state.
 */
export function StoryRail({
  groups,
  ownAvatar,
}: {
  groups: ApiStoryGroup[];
  ownAvatar?: string | null;
}) {
  const { colors } = useTheme();

  // The user's own stories always lead, so "add" and "yours" are one place.
  const own = groups.find((group) => group.is_own);
  const others = groups.filter((group) => !group.is_own);

  return (
    <FlatList
      horizontal
      data={others}
      keyExtractor={(item) => item.author.user_id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
      ListHeaderComponent={
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={own ? "Your story" : "Add to your story"}
          onPress={() =>
            own ? router.push(`/stories/${own.author.user_id}`) : router.push("/stories/compose")
          }
          style={{ alignItems: "center", width: 64, gap: spacing["2xs"] }}
        >
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: radius.full,
              borderWidth: own && !own.all_viewed ? 2 : 1.5,
              borderStyle: own ? "solid" : "dashed",
              borderColor: own && !own.all_viewed ? culture.lime : colors.borderStrong,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {ownAvatar || own ? (
              <Avatar uri={ownAvatar ?? own?.author.profile_picture_url ?? undefined} size={54} />
            ) : (
              <Icon name="add" size={22} color={colors.textSecondary} />
            )}
          </View>

          {/* The add badge stays available even when you already have a story,
              because posting a second one is the common case. Its own
              Pressable, hitSlop-padded, so it reaches compose even though the
              circle beneath it opens your existing story. */}
          {own ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add to your story"
              onPress={() => router.push("/stories/compose")}
              hitSlop={10}
              style={{
                position: "absolute",
                right: 2,
                top: 40,
                width: 22,
                height: 22,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accent,
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <Icon name="add" size={11} color={colors.accentFg} />
            </Pressable>
          ) : null}

          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {own ? "You" : "Add"}
          </Text>
        </PressableScale>
      }
      renderItem={({ item, index }) => (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={
            `${item.author.first_name}'s story, ` +
            (item.all_viewed ? "all seen" : `${item.unseen_count} new`)
          }
          onPress={() => router.push(`/stories/${item.author.user_id}`)}
          style={{ alignItems: "center", width: 64, gap: spacing["2xs"] }}
        >
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: radius.full,
              borderWidth: item.all_viewed ? 1 : 2,
              borderColor: item.all_viewed ? colors.border : RING_HUES[index % RING_HUES.length],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar uri={item.author.profile_picture_url ?? undefined} size={54} />
          </View>
          <Text
            variant="caption"
            color={item.all_viewed ? "textMuted" : "textSecondary"}
            numberOfLines={1}
          >
            {item.author.first_name}
          </Text>
        </PressableScale>
      )}
    />
  );
}
