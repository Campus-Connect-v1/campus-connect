import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, Loader, Media, PressableScale, Tag, Text, Icon } from "@/src/components/ui";
import { adaptPublicUser } from "@/src/features/profile/adapt";
import { useAsync } from "@/src/hooks/useAsync";
import { createConversation, fetchConversationWith } from "@/src/services/conversationServices";
import { useSession } from "@/src/services/SessionContext";
import {
  fetchUserById,
  respondToConnection,
  sendConnectionRequest,
  type ApiConnectionSummary,
} from "@/src/services/userServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const INTEREST_STYLES = [
  { background: culture.pink, foreground: culture.ink },
  { background: culture.yellow, foreground: culture.ink },
  { background: culture.lime, foreground: culture.ink },
  { background: culture.violet, foreground: culture.warmWhite },
];

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

  const remote = useAsync(
    useCallback(() => fetchUserById(id), [id]),
    [id]
  );

  const person = useMemo(() => (remote.data ? adaptPublicUser(remote.data) : null), [remote.data]);

  useEffect(() => {
    setConnection(remote.data?.connection ?? null);
  }, [remote.data]);

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
      >
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}>
                    <Icon name="campus" size={13} color={colors.onMedia} />
                    <Text variant="caption" onMedia>
                      {person.university}
                    </Text>
                  </View>
                ) : null}
                {person.year ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing["2xs"] }}>
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
      </ScrollView>

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
