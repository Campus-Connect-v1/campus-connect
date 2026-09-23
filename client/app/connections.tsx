import * as Haptics from "expo-haptics";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { UserRow } from "@/src/components/social/UserRow";
import {
  EmptyState,
  Icon,
  InlineNotice,
  PressableScale,
  SkeletonList,
  Text,
} from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  cancelConnectionRequest,
  fetchConnections,
  respondToConnection,
  type ApiConnection,
} from "@/src/services/userServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

type Tab = "requests" | "connections" | "sent";

export default function ConnectionsScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState<Tab>("requests");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Rows that have been actioned are dropped locally so the list responds
  // immediately; the next refresh is the source of truth.
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const connections = useAsync(
    useCallback(() => fetchConnections(), []),
    []
  );

  const { requests, accepted, sent } = useMemo(() => {
    const grouped = connections.data ?? {};
    const pending = (grouped.pending ?? []).filter((row) => !resolved.has(row.connection_id));

    return {
      // `is_pending_action` is true only for the side that did NOT send it,
      // which is exactly the set you can accept or decline.
      requests: pending.filter((row) => row.is_pending_action),
      sent: pending.filter((row) => !row.is_pending_action),
      accepted: (grouped.accepted ?? []).filter((row) => !resolved.has(row.connection_id)),
    };
  }, [connections.data, resolved]);

  const TABS: { value: Tab; label: string; count: number }[] = [
    { value: "requests", label: "Requests", count: requests.length },
    { value: "connections", label: "Connections", count: accepted.length },
    { value: "sent", label: "Sent", count: sent.length },
  ];

  const rows = tab === "requests" ? requests : tab === "sent" ? sent : accepted;

  const act = async (
    connectionId: string,
    run: () => Promise<{ success: boolean; error?: string }>
  ) => {
    setBusy(connectionId);
    setError(null);
    const result = await run();
    setBusy(null);

    if (!result.success) {
      setError(result.error ?? "That did not work. Try again.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setResolved((current) => new Set(current).add(connectionId));
  };

  const personFrom = (row: ApiConnection) => ({
    id: row.receiver.id,
    name: [row.receiver.first_name, row.receiver.last_name].filter(Boolean).join(" ").trim(),
    avatar: row.receiver.profile_picture_url,
    detail: row.receiver.profile_headline ?? row.receiver.program,
  });

  const trailingFor = (row: ApiConnection) => {
    const working = busy === row.connection_id;

    if (tab === "requests") {
      return (
        <View style={{ flexDirection: "row", gap: spacing.xs, opacity: working ? 0.5 : 1 }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Accept ${row.receiver.first_name}`}
            disabled={working}
            onPress={() =>
              act(row.connection_id, () => respondToConnection(row.connection_id, "accept"))
            }
            style={{
              minHeight: 38,
              paddingHorizontal: spacing.md,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: culture.lime,
            }}
          >
            <Text variant="label" style={{ color: culture.ink }}>
              Accept
            </Text>
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Decline ${row.receiver.first_name}`}
            disabled={working}
            onPress={() =>
              act(row.connection_id, () => respondToConnection(row.connection_id, "decline"))
            }
            style={{
              width: 38,
              height: 38,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Icon name="close" size={16} color={colors.textMuted} />
          </PressableScale>
        </View>
      );
    }

    if (tab === "sent") {
      return (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Cancel request to ${row.receiver.first_name}`}
          disabled={working}
          onPress={() => act(row.connection_id, () => cancelConnectionRequest(row.connection_id))}
          style={{
            minHeight: 38,
            paddingHorizontal: spacing.md,
            borderRadius: radius.full,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: colors.border,
            opacity: working ? 0.5 : 1,
          }}
        >
          <Text variant="caption" color="textSecondary">
            Cancel
          </Text>
        </PressableScale>
      );
    }

    return <Icon name="forward" size={16} color={colors.textMuted} />;
  };

  const emptyCopy: Record<Tab, { title: string; body: string }> = {
    requests: {
      title: "No requests",
      body: "When someone asks to connect, they show up here.",
    },
    connections: {
      title: "No connections yet",
      body: "Find people on Connect and send the first request.",
    },
    sent: {
      title: "Nothing sent",
      body: "Requests you send are listed here until they are answered.",
    },
  };

  return (
    <SettingsShell title="Connections">
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: spacing.lg,
          marginBottom: spacing.md,
          padding: 4,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
        }}
      >
        {TABS.map((option) => {
          const active = option.value === tab;
          return (
            <PressableScale
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${option.label}, ${option.count}`}
              onPress={() => {
                Haptics.selectionAsync();
                setTab(option.value);
              }}
              style={{
                flex: 1,
                minHeight: 40,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: spacing["2xs"],
                borderRadius: radius.full,
                backgroundColor: active ? colors.textPrimary : "transparent",
              }}
            >
              <Text variant="caption" color={active ? "background" : "textSecondary"}>
                {option.label}
              </Text>
              {option.count > 0 ? (
                <View
                  style={{
                    minWidth: 18,
                    paddingHorizontal: 5,
                    borderRadius: radius.full,
                    backgroundColor: active ? colors.background : culture.pink,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      fontSize: 10,
                      color: active ? colors.textPrimary : culture.warmWhite,
                    }}
                  >
                    {option.count}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          );
        })}
      </View>

      {error ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <InlineNotice message={error} />
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.connection_id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        refreshControl={
          <RefreshControl
            refreshing={connections.refreshing}
            onRefresh={() => {
              setResolved(new Set());
              connections.refresh();
            }}
            tintColor={colors.textMuted}
          />
        }
        ListEmptyComponent={
          connections.loading ? (
            <SkeletonList count={4} />
          ) : connections.error ? (
            <EmptyState
              tone="error"
              title="Could not load connections"
              body={connections.error}
              actionLabel="Try again"
              onAction={connections.reload}
            />
          ) : (
            <EmptyState title={emptyCopy[tab].title} body={emptyCopy[tab].body} />
          )
        }
        renderItem={({ item }) => (
          <UserRow person={personFrom(item)} trailing={trailingFor(item)} />
        )}
      />
    </SettingsShell>
  );
}
