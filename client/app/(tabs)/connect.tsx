import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BuildingSheet } from "@/src/components/campus/BuildingSheet";
import { CampusMap } from "@/src/components/campus/CampusMap";
import { MapSearch } from "@/src/components/campus/MapSearch";
import { PeopleGrid } from "@/src/components/connect/PeopleGrid";
import { RadarView } from "@/src/components/nearby/RadarView";
import {
  Button,
  EmptyState,
  OfflineBanner,
  PeopleSkeleton,
  PressableScale,
  Screen,
  Text,
  Icon,
} from "@/src/components/ui";
import { adaptBuilding } from "@/src/features/campus/adapt";
import { type CampusPin } from "@/src/features/campus/types";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchBuildings } from "@/src/services/campusServices";
import {
  fetchNearby,
  getPermissionStatus,
  publishCurrentLocation,
  requestLocationPermission,
  setIncognito,
  type NearbyProfile,
} from "@/src/services/geolocation";
import { useSession } from "@/src/services/SessionContext";
import { TAB_BAR_CLEARANCE } from "@/src/styles/layout";
import { culture, SECTION_HUE, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

const RANGES = [100, 500, 2000];
type Mode = "people" | "map" | "radar";

const HUE = SECTION_HUE.connect;

function label(metres: number) {
  return metres >= 1000 ? `${metres / 1000} km` : `${metres} m`;
}

export default function ConnectScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user, profile } = useSession();
  const params = useLocalSearchParams<{ building?: string }>();

  const [granted, setGranted] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [mode, setMode] = useState<Mode>("people");
  const [pin, setPin] = useState<CampusPin | null>(null);
  const [range, setRange] = useState(500);
  const [people, setPeople] = useState<NearbyProfile[]>([]);
  // Distinct from `refreshing`: this is the first load, and without it the
  // screen claims "Nobody within 500 m" before the request has even returned.
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const universityId = profile?.university_id ?? user?.university_id;

  // Real buildings for the map. The pin list is empty until they load, which
  // is correct: a map of another campus is worse than a map with no pins.
  const buildings = useAsync(
    useCallback(
      () =>
        universityId
          ? fetchBuildings(universityId)
          : Promise.resolve({ success: true as const, data: [] }),
      [universityId]
    ),
    [universityId]
  );

  const pins = useMemo(
    () => (buildings.data ?? []).map(adaptBuilding).filter(Boolean) as CampusPin[],
    [buildings.data]
  );

  // Opened from Facilities with a building in hand: land on the map with that
  // building already selected, rather than on the people list.
  const requestedBuilding = params.building;
  useEffect(() => {
    if (!requestedBuilding || pins.length === 0) return;
    const target = pins.find((p) => p.id === requestedBuilding);
    if (!target) return;
    setMode("map");
    setPin(target);
  }, [requestedBuilding, pins]);

  // Reads the status only. The prompt itself sits behind the button below, so
  // nobody is asked for their location before they know what it buys them.
  useEffect(() => {
    getPermissionStatus().then(setGranted);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      await publishCurrentLocation();
    } catch {
      // A location write failing should not stop us showing the last known
      // set of people — it only means this refresh is slightly stale.
    }
    const result = await fetchNearby(range);
    if (result.success) setPeople(result.data);
    else setError(result.error);
    setLoadingPeople(false);
  }, [range]);

  useEffect(() => {
    if (!granted) return;
    setLoadingPeople(true);
    load();
  }, [granted, range, load]);

  const enableLocation = async () => {
    setBusy(true);
    const result = await requestLocationPermission();
    setBusy(false);
    if (result.granted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGranted(true);
      return;
    }
    setBlocked(!result.canAskAgain);
    setGranted(false);
  };

  if (granted === null) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      </Screen>
    );
  }

  if (!granted) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.md }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: radius.full,
              backgroundColor: HUE,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="location" size={26} color={culture.ink} />
          </View>
          <Text variant="title">Find your people{"\n"}on campus</Text>
          <Text variant="body" color="textSecondary">
            Campus Connect uses your location to show students near you right now, only while the
            app is open. You can go invisible whenever you want.
          </Text>

          {blocked ? (
            <>
              <Text variant="caption" color="destructive">
                Location is switched off for Campus Connect in your device settings.
              </Text>
              <Button label="Open settings" onPress={() => Linking.openSettings()} />
            </>
          ) : (
            <Button label="Turn on location" loading={busy} onPress={enableLocation} />
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={mode === "map" ? { top: false } : undefined}>
      {mode !== "map" ? <OfflineBanner /> : null}
      {mode !== "map" ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            gap: spacing.md,
          }}
        >
          <Text variant="title" style={{ flex: 1 }}>
            Connect
          </Text>
          <PressableScale
            accessibilityRole="switch"
            accessibilityState={{ checked: hidden }}
            accessibilityLabel={
              hidden ? "You are hidden. Become visible" : "You are visible. Go invisible"
            }
            onPress={async () => {
              Haptics.selectionAsync();
              const next = !hidden;
              setHidden(next);
              await setIncognito(next).catch(() => {});
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing["2xs"],
              paddingHorizontal: spacing.sm,
              minHeight: 44,
              borderRadius: radius.full,
              backgroundColor: hidden ? colors.surface : "transparent",
              borderWidth: 1,
              borderColor: hidden ? colors.borderStrong : colors.border,
            }}
          >
            <Icon name={hidden ? "hidden" : "visible"} size={15} color={colors.textPrimary} />
            <Text variant="caption">{hidden ? "Hidden" : "Visible"}</Text>
          </PressableScale>
        </View>
      ) : null}

      {/* Segmented control, the pattern from the reference: one surface, the
          active segment filled with the section hue. */}
      {mode !== "map" ? (
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            padding: spacing["3xs"] + 2,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
          }}
        >
          {(["people", "map", "radar"] as Mode[]).map((value) => {
            const active = mode === value;
            return (
              <PressableScale
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode(value);
                }}
                style={{
                  flex: 1,
                  minHeight: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: radius.full,
                  backgroundColor: active ? HUE : "transparent",
                }}
              >
                <Text
                  variant="label"
                  style={active ? { color: culture.ink } : undefined}
                  color={active ? undefined : "textSecondary"}
                >
                  {value === "people" ? "People" : value === "map" ? "Map" : "Radar"}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      ) : null}

      {mode === "map" ? (
        <View style={{ flex: 1 }}>
          <CampusMap
            pins={pins}
            selectedId={pin?.id}
            focusId={pin?.id}
            onSelect={setPin}
            hue={HUE}
          />

          <MapSearch
            universityId={universityId}
            pins={pins}
            top={insets.top + spacing.xs}
            onSelect={setPin}
          />

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Return to people"
            onPress={() => setMode("people")}
            style={{
              position: "absolute",
              top: insets.top + spacing.xs + 60,
              left: spacing.lg,
              // Below the search results, which drop down over this row.
              zIndex: 1,
              elevation: 1,
              minHeight: 44,
              paddingHorizontal: spacing.md,
              borderRadius: radius.full,
              backgroundColor: culture.lime,
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.xs,
            }}
          >
            <Icon name="back" size={17} color={culture.ink} />
            <Text variant="label" style={{ color: culture.ink }}>
              People
            </Text>
          </PressableScale>

          {pin ? (
            <BuildingSheet
              pin={pin}
              bottom={TAB_BAR_CLEARANCE - spacing.xl}
              onClose={() => setPin(null)}
            />
          ) : null}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.textMuted}
              colors={[HUE]}
            />
          }
        >
          <View
            style={{
              flexDirection: "row",
              gap: spacing.xs,
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
            }}
          >
            {RANGES.map((value) => {
              const active = value === range;
              return (
                <PressableScale
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRange(value);
                  }}
                  style={{
                    flex: 1,
                    minHeight: 40,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: active ? colors.textPrimary : colors.border,
                    backgroundColor: active ? colors.textPrimary : "transparent",
                  }}
                >
                  <Text variant="caption" color={active ? "background" : "textSecondary"}>
                    {label(value)}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {loadingPeople ? (
            <PeopleSkeleton />
          ) : error ? (
            <EmptyState
              tone="error"
              title="Could not find anyone"
              body={error}
              actionLabel="Try again"
              onAction={load}
            />
          ) : people.length === 0 ? (
            <EmptyState
              title={`Nobody within ${label(range)}`}
              body="Widen the range, or check back when lectures let out."
            />
          ) : mode === "people" ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <PeopleGrid
                people={people}
                onSelect={(person) => router.push(`/person/${person.user_id}`)}
              />
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(220)}
              style={{ alignItems: "center", paddingVertical: spacing.md }}
            >
              <RadarView
                profiles={people}
                range={range}
                size={Math.min(width - spacing.xl * 2, 320)}
                onSelect={(person) => router.push(`/person/${person.user_id}`)}
              />
            </Animated.View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
