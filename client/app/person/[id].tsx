import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PostCard } from "@/src/components/feed/PostCard";
import { PostOptionsSheet } from "@/src/components/feed/PostOptionsSheet";
import {
  EmptyState,
  Loader,
  Media,
  PressableScale,
  SkeletonList,
  Tag,
  Text,
  Icon,
} from "@/src/components/ui";
import { adaptPost } from "@/src/features/feed/adapt";
import { type FeedPost } from "@/src/features/feed/types";
import { adaptPublicUser } from "@/src/features/profile/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { useFeedRealtime } from "@/src/hooks/useFeedRealtime";
import { createConversation, fetchConversationWith } from "@/src/services/conversationServices";
import { useSavedPosts } from "@/src/services/SavedPostsContext";
import { useSession } from "@/src/services/SessionContext";
import { fetchPostsByAuthor, likePost, unlikePost } from "@/src/services/socialServices";
import { fetchUserStories } from "@/src/services/storyServices";
import {
  fetchUserById,
  respondToConnection,
  sendConnectionRequest,
  followUser,
  unfollowUser,
  fetchFollowStats,
  type ApiConnectionSummary,
  type FollowStats,
} from "@/src/services/userServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const INTEREST_STYLES = [
  { background: culture.pink, foreground: culture.ink },
  { background: culture.yellow, foreground: culture.ink },
  { background: culture.lime, foreground: culture.ink },
  { background: culture.violet, foreground: culture.warmWhite },
];

/**
 * One tab today ("Posts"), but takes a list so Media/Likes can be added later
 * without touching how the profile screen is structured — just another entry
 * here and a branch on `active` in the screen below.
 */
function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        gap: spacing.xl,
        paddingHorizontal: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <PressableScale
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            onPress={() => onChange(tab.key)}
            style={{
              paddingVertical: spacing.sm,
              borderBottomWidth: 2,
              borderBottomColor: isActive ? culture.violet : "transparent",
            }}
          >
            <Text variant="label" color={isActive ? "textPrimary" : "textMuted"}>
              {tab.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const PROFILE_TABS = [{ key: "posts", label: "Posts" }];

export default function PersonScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();

  const [connection, setConnection] = useState<ApiConnectionSummary | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const saved = useSavedPosts();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [options, setOptions] = useState<FeedPost | null>(null);

  // Whether this person has an unexpired story, so the profile can offer it.
  // The story feed does not necessarily carry them, hence the direct read.
  const stories = useAsync(
    useCallback(() => fetchUserStories(id), [id]),
    [id]
  );
  const hasStory = (stories.data ?? []).length > 0;

  /**
   * Follow state.
   *
   * Separate from connections on purpose: a connection is mutual and needs
   * accepting, a follow is one-directional and instant. The feed reads the
   * follow graph, so without this control on a profile there was no way for a
   * user to build one -- every account stayed pinned to discovery mode while
   * the empty feed told them to "follow a few people".
   */
  const [follow, setFollow] = useState<FollowStats | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    // Compared directly rather than via isSelf, which is derived from the
    // fetched profile further down and is not in scope yet.
    if (!id || id === user?.id) return;
    let active = true;
    void fetchFollowStats(id).then((result) => {
      if (active && result.success) setFollow(result.data);
    });
    return () => {
      active = false;
    };
  }, [id, user?.id]);

  const toggleFollow = async () => {
    if (!follow || followBusy) return;

    const wasFollowing = follow.is_following;
    setFollowBusy(true);
    // Optimistic, so the button answers the tap immediately; reverted below if
    // the write fails, rather than left stating something untrue.
    setFollow({
      ...follow,
      is_following: !wasFollowing,
      follower_count: Math.max(0, follow.follower_count + (wasFollowing ? -1 : 1)),
    });
    Haptics.selectionAsync();

    const result = await (wasFollowing ? unfollowUser : followUser)(id);
    setFollowBusy(false);

    if (result.success) {
      // The server returns the authoritative counts; two devices acting at
      // once would otherwise each keep their own guess.
      setFollow({
        follower_count: result.data.follower_count,
        following_count: result.data.following_count,
        is_following: result.data.is_following,
        follows_you: result.data.follows_you,
      });
    } else {
      setFollow(follow);
      setRequestError(result.error);
    }
  };

  const remote = useAsync(
    useCallback(() => fetchUserById(id), [id]),
    [id]
  );

  const person = useMemo(() => (remote.data ? adaptPublicUser(remote.data) : null), [remote.data]);

  useEffect(() => {
    setConnection(remote.data?.connection ?? null);
  }, [remote.data]);

  // profile owner's id, never the viewer's — a profile always shows what ITS
  // owner posted, not whoever happens to be signed in.
  const profileUserId = person?.id;

  const loadPosts = async (mode: "initial" | "more") => {
    if (!profileUserId) return;
    if (mode === "more") {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    } else {
      setPostsLoading(true);
      setPostsError(null);
    }

    const result = await fetchPostsByAuthor(profileUserId, 20, mode === "more" ? cursor : null);

    if (result.success) {
      const page = result.data.posts.map(adaptPost);
      setPosts((current) => (mode === "more" ? [...current, ...page] : page));
      setCursor(result.data.nextCursor);
      setHasMore(result.data.hasMore);
    } else if (mode === "initial") {
      setPostsError(result.error);
    }

    if (mode === "more") setLoadingMore(false);
    else setPostsLoading(false);
  };

  // Reset and reload whenever the profile changes — navigating from one
  // person's profile to another pushes a new route with a new id, but this
  // also covers the same screen instance being reused for a different id.
  useEffect(() => {
    if (!profileUserId) return;
    setPosts([]);
    setCursor(null);
    setHasMore(false);
    loadPosts("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId]);

  const toggleLike = useCallback((postId: string) => {
    let wasLiked = false;
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        wasLiked = post.liked;
        return { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) };
      })
    );
    (wasLiked ? unlikePost : likePost)(postId);
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((current) => current.filter((post) => post.id !== postId));
  }, []);

  // Same realtime mechanism the main feed uses (src/hooks/useFeedRealtime):
  // a like made here shows the same count when the post is later seen in the
  // feed, and vice versa, because both screens listen to the same post rooms
  // rather than keeping independent copies of the state.
  useFeedRealtime(
    useMemo(() => posts.map((post) => post.id), [posts]),
    {
      onCounts: (postId, counts) =>
        setPosts((current) =>
          current.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likes: counts.like_count ?? post.likes,
                  comments: counts.comment_count ?? post.comments,
                }
              : post
          )
        ),
      onPostDeleted: removePost,
      onPostUpdated: (postId, content) =>
        setPosts((current) =>
          current.map((post) =>
            post.id === postId && content !== undefined ? { ...post, caption: content } : post
          )
        ),
    }
  );

  const connect = async () => {
    if (!person || connection || requesting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRequesting(true);
    setRequestError(null);

    const result = await sendConnectionRequest(person.id);
    setRequesting(false);

    if (result.success) {
      setConnection({
        connection_id: result.data.connection_id,
        status: "pending",
        your_role: "requester",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    // A request could have arrived since the profile loaded. Re-read the
    // relationship instead of turning that race into a false failure.
    if (result.status === 409) {
      await remote.refresh();
      return;
    }
    setRequestError(result.error);
  };

  const accept = async () => {
    if (!connection || connection.status !== "pending" || connection.your_role !== "receiver") {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRequesting(true);
    setRequestError(null);
    const result = await respondToConnection(connection.connection_id, "accept");
    setRequesting(false);

    if (result.success) {
      setConnection({ ...connection, status: "accepted" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    setRequestError(result.error);
  };

  const openChat = async () => {
    if (!person || opening) return;
    setOpening(true);
    setRequestError(null);

    // A 404 here just means they have never spoken, so the thread is created
    // on the spot rather than treated as a failure.
    const existing = await fetchConversationWith(person.id);
    const conversation = existing.success ? existing : await createConversation(person.id);
    setOpening(false);

    if (!conversation.success) {
      setRequestError(conversation.error);
      return;
    }

    router.push({
      pathname: "/messages/[id]",
      params: {
        id: conversation.data._id,
        participantId: person.id,
        name: person.name,
      },
    });
  };

  if (remote.loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <EmptyState.Loading />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center" }}>
        <EmptyState
          tone="error"
          title="Profile unavailable"
          body={remote.error ?? "This person may have left or made their profile private."}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const interests = person.interests.length
    ? person.interests
    : ([person.programme, person.university].filter(Boolean) as string[]);

  // The profile opens as a complete identity card. Extra bio content continues
  // below, but the first viewport is deliberately edge-to-edge photography.
  const heroHeight = height;
  const isSelf = person.id === user?.id;
  const isFriend = connection?.status === "accepted";
  const sentRequest = connection?.status === "pending" && connection.your_role === "requester";
  const receivedRequest = connection?.status === "pending" && connection.your_role === "receiver";
  const unavailable = connection?.status === "blocked" || connection?.status === "declined";
  const friendLabel = requesting
    ? receivedRequest
      ? "Accepting…"
      : "Sending…"
    : isFriend
      ? "Friends"
      : sentRequest
        ? "Request sent"
        : receivedRequest
          ? "Accept request"
          : unavailable
            ? "Unavailable"
            : "Add friend";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={activeTab === "posts" ? posts : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        onEndReachedThreshold={0.5}
        onEndReached={() => loadPosts("more")}
        renderItem={({ item }) => (
          <PostCard
            post={{ ...item, saved: saved.isSaved(item.id) }}
            onToggleLike={toggleLike}
            onToggleSave={saved.toggle}
            onOpenOptions={setOptions}
          />
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: spacing.lg, alignItems: "center" }}>
              <Loader size={20} color={colors.textPrimary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          postsLoading ? (
            <SkeletonList count={2} />
          ) : postsError ? (
            <EmptyState
              compact
              tone="error"
              title="Couldn't load posts"
              body={postsError}
              actionLabel="Retry"
              onAction={() => loadPosts("initial")}
            />
          ) : (
            <EmptyState
              compact
              title={isSelf ? "You haven't posted anything yet." : "No posts yet"}
              body={
                isSelf
                  ? undefined
                  : `When ${person.name.split(" ")[0]} shares something, you'll see it here.`
              }
            />
          )
        }
        ListHeaderComponent={
          <>
            <View style={{ height: heroHeight }}>
              <Media
                source={person.avatar ?? undefined}
                scrim="full"
                rounded="none"
                style={{ flex: 1 }}
                accessibilityIgnoresInvertColors
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "flex-end",
                    paddingHorizontal: spacing.xl,
                    paddingBottom: insets.bottom + 104,
                    gap: spacing.sm,
                  }}
                >
                  <Text variant="display" onMedia>
                    {person.name}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: spacing.md,
                    }}
                  >
                    {person.university ? (
                      <View
                        style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}
                      >
                        <Icon name="campus" size={13} color={colors.onMedia} />
                        <Text variant="caption" onMedia>
                          {person.university}
                        </Text>
                      </View>
                    ) : null}
                    {person.year ? (
                      <View
                        style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}
                      >
                        <Icon name="course" size={13} color={colors.onMedia} />
                        <Text variant="caption" onMedia>
                          {person.year}
                        </Text>
                      </View>
                    ) : null}
                    <Text variant="caption" onMedia>
                      {person.age ? `${person.age} · ` : ""}@{person.handle}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: spacing.xs,
                      marginTop: spacing["2xs"],
                    }}
                  >
                    {interests.map((interest, i) => {
                      const interestStyle = INTEREST_STYLES[i % INTEREST_STYLES.length];
                      return (
                        <View
                          key={interest}
                          style={{
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing["2xs"] + 2,
                            borderRadius: radius.full,
                            backgroundColor: interestStyle.background,
                          }}
                        >
                          <Text variant="caption" style={{ color: interestStyle.foreground }}>
                            #{interest}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Media>
            </View>

            <View style={{ padding: spacing.xl, gap: spacing.md }}>
              {/* Counts read from the follow state that is already loaded, so this
              adds no request. Both are tappable, because a number nobody can
              open is decoration. */}
              {hasStory ? (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`View ${person.name}'s story`}
                  onPress={() =>
                    router.push({ pathname: "/stories/[userId]", params: { userId: id } })
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.xs,
                    minHeight: 46,
                    borderRadius: radius.full,
                    borderWidth: 1.5,
                    borderColor: culture.pink,
                  }}
                >
                  <Icon name="play" size={15} color={culture.pink} />
                  <Text variant="label" style={{ color: culture.pink }}>
                    View story
                  </Text>
                </PressableScale>
              ) : null}

              {follow ? (
                <View style={{ flexDirection: "row", gap: spacing["2xl"] }}>
                  {[
                    { tab: "followers" as const, label: "FOLLOWERS", value: follow.follower_count },
                    {
                      tab: "following" as const,
                      label: "FOLLOWING",
                      value: follow.following_count,
                    },
                  ].map((entry) => (
                    <PressableScale
                      key={entry.tab}
                      accessibilityRole="button"
                      accessibilityLabel={`${entry.value} ${entry.label.toLowerCase()}`}
                      onPress={() =>
                        router.push({
                          pathname: "/person/[id]/follows",
                          params: { id, tab: entry.tab, name: person.name },
                        })
                      }
                      style={{ gap: 2 }}
                    >
                      <Text variant="heading">{entry.value.toLocaleString()}</Text>
                      <Text variant="micro" color="textMuted">
                        {entry.label}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              ) : null}

              {person.bio ? (
                <Text variant="body" color="textSecondary">
                  {person.bio}
                </Text>
              ) : null}

              {person.programme ? (
                <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
                  <Tag label={person.programme} />
                </View>
              ) : null}

              {requestError ? (
                <Text variant="caption" color="destructive">
                  {requestError}
                </Text>
              ) : null}
            </View>

            <ProfileTabs tabs={PROFILE_TABS} active={activeTab} onChange={setActiveTab} />

            {/* Breathing room between the tab underline and the first card —
                lives in the header so it applies identically whether the list
                below is populated, empty, loading, or erroring. */}
            <View style={{ height: spacing.md }} />
          </>
        }
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

      {/* Connect is the one thing this screen is for, so it stays reachable
          without scrolling back. */}
      <View
        style={{
          position: "absolute",
          left: spacing.xl,
          right: spacing.xl,
          bottom: insets.bottom + spacing.md,
        }}
      >
        {isSelf ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={() => router.push("/(tabs)/profile")}
            style={{
              height: 58,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: culture.yellow,
            }}
          >
            <Text variant="label" style={{ color: culture.ink }}>
              View your profile
            </Text>
          </PressableScale>
        ) : (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {follow ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityState={{ selected: follow.is_following, disabled: followBusy }}
                accessibilityLabel={
                  follow.is_following
                    ? `Unfollow ${person.name}`
                    : `Follow ${person.name}${follow.follows_you ? ", follows you" : ""}`
                }
                disabled={followBusy}
                onPress={toggleFollow}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  // Following reads as a settled state, not a call to action,
                  // so it loses the accent fill once it is on.
                  backgroundColor: follow.is_following ? colors.surface : culture.violet,
                  borderWidth: 1,
                  borderColor: follow.is_following ? colors.borderStrong : culture.violet,
                  opacity: followBusy ? 0.6 : 1,
                }}
              >
                {followBusy ? (
                  <Loader size={20} color={colors.textPrimary} />
                ) : (
                  <Icon
                    name={follow.is_following ? "check" : "connectAdd"}
                    size={20}
                    color={follow.is_following ? colors.textPrimary : culture.ink}
                  />
                )}
              </PressableScale>
            ) : null}

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Message ${person.name}`}
              disabled={opening}
              onPress={openChat}
              style={{
                width: 58,
                height: 58,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderStrong,
                opacity: opening ? 0.6 : 1,
              }}
            >
              {opening ? (
                <Loader size={20} color={colors.textPrimary} />
              ) : (
                <Icon name="message" size={20} color={colors.textPrimary} />
              )}
            </PressableScale>

            <PressableScale
              accessibilityRole="button"
              accessibilityState={{
                selected: isFriend,
                disabled: requesting || isFriend || sentRequest || unavailable,
              }}
              accessibilityLabel={`${friendLabel} ${person.name}`}
              disabled={requesting || isFriend || sentRequest || unavailable}
              onPress={receivedRequest ? accept : connect}
              style={{
                flex: 1,
                height: 58,
                borderRadius: radius.full,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                opacity: requesting || unavailable ? 0.6 : 1,
                backgroundColor:
                  isFriend || sentRequest || unavailable ? colors.surface : culture.yellow,
                borderWidth: isFriend || sentRequest || unavailable ? 1 : 0,
                borderColor: colors.borderStrong,
              }}
            >
              {requesting ? (
                <Loader size={19} color={receivedRequest ? culture.ink : colors.textPrimary} />
              ) : (
                <Icon
                  name={isFriend || sentRequest ? "check" : "connectAdd"}
                  size={19}
                  color={isFriend || sentRequest || unavailable ? colors.textPrimary : culture.ink}
                />
              )}
              <Text
                variant="label"
                style={isFriend || sentRequest || unavailable ? undefined : { color: culture.ink }}
              >
                {friendLabel}
              </Text>
            </PressableScale>
          </View>
        )}
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={{
          position: "absolute",
          top: insets.top + spacing.xs,
          left: spacing.lg,
          width: 40,
          height: 40,
          borderRadius: radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(20,16,12,0.45)",
        }}
      >
        <Icon name="back" size={20} color={colors.onMedia} />
      </PressableScale>

      <Text
        variant="heading"
        onMedia
        style={{ position: "absolute", top: insets.top + spacing.md, alignSelf: "center" }}
      >
        Profile
      </Text>
    </View>
  );
}
