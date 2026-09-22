import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PostCard } from "@/src/components/feed/PostCard";
import { PostOptionsSheet } from "@/src/components/feed/PostOptionsSheet";
import { StoryRail } from "@/src/components/stories/StoryRail";
import ProfileDrawer from "@/src/components/layout/profile-drawer";
import {
  Avatar,
  EmptyState,
  Icon,
  OfflineBanner,
  SkeletonList,
  Media,
  PressableScale,
  Screen,
  SectionHeader,
  Sticker,
  Text,
  type IconName,
} from "@/src/components/ui";
import { adaptEvent } from "@/src/features/events/adapt";
import { type CampusEvent } from "@/src/features/events/types";
import { adaptPost } from "@/src/features/feed/adapt";
import { type FeedPost } from "@/src/features/feed/types";
import { adaptProfile } from "@/src/features/profile/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchEvents } from "@/src/services/eventServices";
import { useSavedPosts } from "@/src/services/SavedPostsContext";
import { useSession } from "@/src/services/SessionContext";
import { fetchFeed, likePost, unlikePost } from "@/src/services/socialServices";
import { fetchUniversityById } from "@/src/services/universityServices";
import { fetchUnreadCount } from "@/src/services/notificationServices";
import { fetchStoryFeed } from "@/src/services/storyServices";
import { fetchRecommendations, type ApiUserCard } from "@/src/services/userServices";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, foregroundOn, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const CATEGORIES: { label: string; icon: IconName; color: string; route?: "/(tabs)/events" }[] = [
  { label: "Trending", icon: "trending", color: culture.pink },
  { label: "Events", icon: "events", color: culture.yellow, route: "/(tabs)/events" },
  { label: "Sports", icon: "sports", color: culture.lime },
  { label: "Academic", icon: "academic", color: culture.violet },
  { label: "Music", icon: "entertainment", color: culture.pink },
  { label: "Food", icon: "food", color: culture.yellow },
];

function CategoryRail({ active, onChange }: { active: string; onChange: (label: string) => void }) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        gap: spacing.xs,
        alignItems: "center",
      }}
    >
      {CATEGORIES.map((category) => {
        const selected = category.label === active;
        return (
          <PressableScale
            key={category.label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Show ${category.label}`}
            onPress={() => {
              onChange(category.label);
              if (category.route) router.push(category.route);
            }}
            style={{
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
              paddingHorizontal: spacing.sm,
              borderRadius: radius.full,
              backgroundColor: selected ? category.color : colors.surface,
              borderWidth: 1,
              borderColor: selected ? category.color : colors.border,
            }}
          >
            <Icon
              name={category.icon}
              size={17}
              color={selected ? culture.ink : colors.textSecondary}
            />
            <Text variant="label" style={{ color: selected ? culture.ink : colors.textSecondary }}>
              {category.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

function FeaturedEvent({ event }: { event: CampusEvent }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
      onPress={() => router.push({ pathname: "/event/[id]", params: { id: event.event_id } })}
      style={{ marginHorizontal: spacing.lg }}
    >
      <Media source={event.image} scrim="full" rounded="lg" style={{ height: 340 }}>
        <View style={{ flex: 1, justifyContent: "space-between", padding: spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Sticker label={event.day.toUpperCase()} backgroundColor={culture.yellow} />
            <Sticker label="ON CAMPUS" backgroundColor={culture.lime} rotation={3} />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text variant="poster" onMedia style={{ maxWidth: 290 }} numberOfLines={2}>
              {event.title.toUpperCase()}
            </Text>
            <Text variant="label" onMedia>
              {event.starts_at} · {event.location}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
              <View
                style={{
                  minHeight: 44,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.full,
                  backgroundColor: culture.yellow,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text variant="label" style={{ color: culture.ink }}>
                  See details
                </Text>
              </View>
              <Text variant="caption" onMedia>
                {event.host}
              </Text>
            </View>
          </View>
        </View>
      </Media>
    </PressableScale>
  );
}

function PeopleStrip({ people }: { people: ApiUserCard[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(154, width * 0.39);

  const matchColor = (percentage: number) => {
    if (percentage >= 75) return culture.lime;
    if (percentage >= 40) return culture.yellow;
    return culture.pink;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
    >
      {people.slice(0, 5).map((person) => (
        <PressableScale
          key={person.user_id}
          accessibilityRole="button"
          accessibilityLabel={[
            `View ${person.first_name} ${person.last_name ?? ""}`.trim(),
            typeof person.match_percentage === "number"
              ? `${person.match_percentage}% match`
              : null,
          ]
            .filter(Boolean)
            .join(", ")}
          onPress={() => router.push(`/person/${person.user_id}`)}
          style={{ width: cardWidth }}
        >
          <Media
            source={person.profile_picture_url ?? undefined}
            scrim
            rounded="md"
            style={{ height: 190 }}
          >
            <View style={{ flex: 1, justifyContent: "space-between", padding: spacing.sm }}>
              {typeof person.match_percentage === "number" ? (
                <Sticker
                  label={`${person.match_percentage}% MATCH`}
                  backgroundColor={matchColor(person.match_percentage)}
                />
              ) : (
                <View />
              )}
              <View>
                <Text variant="label" onMedia numberOfLines={1}>
                  {[person.first_name, person.last_name].filter(Boolean).join(" ")}
                </Text>
                <Text variant="caption" onMedia style={{ opacity: 0.82 }} numberOfLines={1}>
                  {person.program ?? person.profile_headline ?? "On campus"}
                </Text>
              </View>
            </View>
          </Media>
        </PressableScale>
      ))}
    </ScrollView>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, profile, signOut } = useSession();
  const saved = useSavedPosts();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [options, setOptions] = useState<FeedPost | null>(null);
  const [category, setCategory] = useState("Trending");
  const [campus, setCampus] = useState<string | null>(null);

  const display = useMemo(() => (profile ? adaptProfile(profile) : null), [profile]);
  const firstName = (display?.name || user?.name || "").split(" ")[0];

  const feed = useAsync(
    useCallback(() => fetchFeed(20, 0), []),
    []
  );

  const people = useAsync(
    useCallback(() => fetchRecommendations(10), []),
    []
  );

  const stories = useAsync(
    useCallback(() => fetchStoryFeed(20, 0), []),
    []
  );

  const unread = useAsync(
    useCallback(() => fetchUnreadCount(), []),
    []
  );

  const universityId = profile?.university_id ?? user?.university_id;
  const events = useAsync(
    useCallback(
      () => fetchEvents(universityId ? { university_id: universityId, limit: 10 } : { limit: 10 }),
      [universityId]
    ),
    [universityId]
  );

  useEffect(() => {
    if (!universityId) return;
    fetchUniversityById(universityId).then((uni) =>
      setCampus(uni ? [uni.label, uni.location].filter(Boolean).join(" · ") : null)
    );
  }, [universityId]);

  // The header event is whichever upcoming one starts soonest, so the slot is
  // never empty while events exist and never shows something already over.
  const featured = useMemo(() => {
    const upcoming = (events.data ?? [])
      .filter((event) => new Date(event.start_time).getTime() > Date.now() - 3600_000)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return upcoming.length ? adaptEvent(upcoming[0]) : null;
  }, [events.data]);

  // Local copy so a like reflects on the row immediately; the server is told
  // after.
  const [posts, setPosts] = useState<FeedPost[]>([]);
  useEffect(() => {
    if (feed.data) setPosts(feed.data.map(adaptPost));
  }, [feed.data]);

  const toggleLike = useCallback((id: string) => {
    let wasLiked = false;
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== id) return post;
        wasLiked = post.liked;
        return { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) };
      })
    );
    // Optimistic: the row is already updated. A failed write is corrected by
    // the next refresh, which beats blocking the tap on a round trip.
    (wasLiked ? unlikePost : likePost)(id);
  }, []);

  const toggleSave = saved.toggle;

  // Hidden and deleted posts leave the list immediately; both are irreversible
  // from here, so waiting for the next refresh would just look broken.
  const removePost = useCallback((id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id));
  }, []);

  const recommendations = people.data ?? [];

  return (
    <Screen>
      <OfflineBanner />
      <ProfileDrawer
        isVisible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={{
          name: display?.name || user?.name || "You",
          username: display ? `@${display.handle}` : "",
          avatar: display?.avatar ?? "",
        }}
        onNavigate={(screen) => {
          const routes: Record<string, string> = {
            home: "/(tabs)/home",
            explore: "/(tabs)/explore",
            create: "/(tabs)/create",
            campus: "/(tabs)/campus",
            profile: "/(tabs)/profile",
            messages: "/messages",
            saved: "/saved",
            groups: "/(tabs)/events?section=groups",
            events: "/(tabs)/events",
            settings: "/settings",
            help: "/settings/help",
          };
          const route = routes[screen];
          if (route) router.push(route as never);
        }}
        onLogout={signOut}
      />

      {options ? (
        <PostOptionsSheet
          postId={options.id}
          authorName={options.author.name}
          isOwnPost={options.author.id === user?.id}
          saved={saved.isSaved(options.id)}
          visible
          onClose={() => setOptions(null)}
          onRemoved={removePost}
          onToggleSave={saved.toggle}
        />
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={() => {
              feed.refresh();
              people.refresh();
              events.refresh();
              stories.refresh();
              unread.refresh();
            }}
            tintColor={colors.textMuted}
            colors={[culture.violet]}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.xl, paddingBottom: spacing.lg }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.lg,
                // The two icon buttons read as one control group, so the gap
                // between them is tighter than the gap to the campus name.
                gap: spacing["3xs"],
              }}
            >
              <View style={{ flex: 1, marginRight: spacing.xs }}>
                <Text variant="micro" color="textMuted">
                  CAMPUS CONNECT
                </Text>
                <Text variant="label" numberOfLines={1}>
                  {campus ?? "Your campus"}
                </Text>
              </View>
              {/* Create left the tab bar (it is an action, not a
                  destination), so this is its primary entry point. */}
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Create a post, event or group"
                onPress={() => router.push("/(tabs)/create")}
                style={{ width: 40, height: 44, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="create" size={22} color={colors.textPrimary} />
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={
                  unread.data ? `Notifications, ${unread.data} unread` : "Notifications"
                }
                onPress={() => router.push("/notifications")}
                style={{ width: 40, height: 44, alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="notification" size={21} color={colors.textPrimary} />
                {unread.data ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 6,
                      minWidth: 16,
                      height: 16,
                      paddingHorizontal: 4,
                      borderRadius: radius.full,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: culture.pink,
                      borderWidth: 1.5,
                      borderColor: colors.background,
                    }}
                  >
                    <Text
                      variant="micro"
                      style={{
                        color: foregroundOn(culture.pink),
                        fontSize: 9,
                        lineHeight: 11,
                      }}
                    >
                      {unread.data > 9 ? "9+" : unread.data}
                    </Text>
                  </View>
                ) : null}
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Open profile menu"
                onPress={() => setDrawerOpen(true)}
              >
                <Avatar uri={display?.avatar ?? undefined} size={42} />
              </PressableScale>
            </View>

            <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}>
              <Text variant="title">
                {firstName ? `WHAT'S GOOD, ${firstName.toUpperCase()}?` : "WHAT'S GOOD?"}
              </Text>
            </View>

            <StoryRail groups={stories.data ?? []} ownAvatar={display?.avatar} />

            <CategoryRail active={category} onChange={setCategory} />

            {featured ? (
              <>
                <View style={{ paddingHorizontal: spacing.lg }}>
                  <SectionHeader
                    eyebrow="HAPPENING SOON"
                    title="Don't miss this"
                    actionLabel="All events"
                    onAction={() => router.push("/(tabs)/events")}
                  />
                </View>
                <FeaturedEvent event={featured} />
              </>
            ) : null}

            {recommendations.length ? (
              <>
                <View style={{ paddingHorizontal: spacing.lg }}>
                  <SectionHeader
                    eyebrow="AROUND CAMPUS"
                    title="People you might know"
                    actionLabel="Explore"
                    onAction={() => router.push("/(tabs)/connect")}
                  />
                </View>
                <PeopleStrip people={recommendations} />
              </>
            ) : null}

            <View style={{ paddingHorizontal: spacing.lg }}>
              <SectionHeader eyebrow="FOR YOU" title="From your campus" />
            </View>
          </View>
        }
        ListEmptyComponent={
          feed.loading ? (
            <SkeletonList count={3} />
          ) : feed.error ? (
            <EmptyState
              tone="error"
              title="Could not load the feed"
              body={feed.error}
              actionLabel="Try again"
              onAction={feed.reload}
            />
          ) : (
            <EmptyState
              title="Nothing here yet"
              body="Follow a few people from your hall, or post the first thing anyone sees today."
              actionLabel="Write a post"
              onAction={() => router.push("/compose/post")}
            />
          )
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={index < 4 ? FadeIn.delay(index * 45).duration(200) : undefined}>
            <PostCard
              post={{ ...item, saved: saved.isSaved(item.id) }}
              onToggleLike={toggleLike}
              onToggleSave={toggleSave}
              onOpenOptions={setOptions}
            />
          </Animated.View>
        )}
      />
    </Screen>
  );
}
