import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, ScrollView, TextInput, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { EmptyState, Icon, Loader, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  fetchFacilitiesByType,
  fetchReservableFacilities,
  searchBuildings,
  searchFacilities,
  type ApiBuilding,
  type ApiFacility,
} from "@/src/services/campusServices";
import { useSession } from "@/src/services/SessionContext";
import { culture, radius, spacing, inputTextStyle } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

/**
 * Categories, each backed by exactly one endpoint.
 *
 * There is deliberately no "All": the API has no route that lists every
 * facility for a university. `GET /facilities/search` REQUIRES a term and
 * answers 400 without one, and building everything from the per-building route
 * would be one request per building. Search covers the "show me anything"
 * case instead.
 */
const CATEGORIES = [
  { value: "study_room", label: "Study rooms" },
  { value: "library", label: "Libraries" },
  { value: "lab", label: "Labs" },
  { value: "classroom", label: "Classrooms" },
  { value: "cafe", label: "Cafes" },
  { value: "lounge", label: "Lounges" },
  { value: "gym", label: "Gyms" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];
type Filter = Category | "bookable";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "bookable", label: "Bookable" },
  ...CATEGORIES,
];

const TYPE_LABEL: Record<string, string> = {
  classroom: "Classroom",
  lab: "Lab",
  study_room: "Study room",
  office: "Office",
  cafe: "Cafe",
  lounge: "Lounge",
  library: "Library",
  gym: "Gym",
  other: "Facility",
};

const MIN_SEARCH = 2;

function Row({ facility, onPress }: { facility: ApiFacility; onPress: () => void }) {
  const { colors } = useTheme();
  const where = [
    facility.building_name,
    facility.room_number ? `Room ${facility.room_number}` : null,
    facility.floor ? `Floor ${facility.floor}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${facility.facility_name}. Show on the campus map`}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={1}>
          {facility.facility_name}
        </Text>
        {where ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {where}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          <Text variant="caption" color="textSecondary">
            {TYPE_LABEL[facility.facility_type] ?? "Facility"}
          </Text>
          {facility.capacity ? (
            <Text variant="caption" color="textMuted">
              · seats {facility.capacity}
            </Text>
          ) : null}
        </View>
      </View>

      {Number(facility.is_reservable) ? (
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: radius.full,
            backgroundColor: culture.lime,
          }}
        >
          <Text variant="caption" style={{ color: culture.ink }}>
            Bookable
          </Text>
        </View>
      ) : null}

      <Icon name="map" size={17} color={colors.textMuted} />
    </PressableScale>
  );
}

export default function FacilitiesScreen() {
  const { colors } = useTheme();
  const { user, profile } = useSession();
  const universityId = profile?.university_id ?? user?.university_id;

  const [filter, setFilter] = useState<Filter>("bookable");
  const [query, setQuery] = useState("");

  const term = query.trim();
  const searching = term.length >= MIN_SEARCH;

  /**
   * The category fetch. It does NOT depend on `query`: these endpoints take no
   * search term, so refetching as the user types would be one request per
   * keystroke for a result that cannot change.
   */
  const byFilter = useAsync(
    useCallback(() => {
      if (!universityId) return Promise.resolve({ success: true as const, data: [] });
      return filter === "bookable"
        ? fetchReservableFacilities(universityId)
        : fetchFacilitiesByType(universityId, filter);
    }, [universityId, filter]),
    [universityId, filter]
  );

  // Search runs on its own, debounced, and takes over the list while active.
  const [results, setResults] = useState<ApiFacility[]>([]);
  // Buildings are searched alongside rooms: somebody looking for "Balme" wants
  // the building, and a rooms-only search finds nothing for it.
  const [buildings, setBuildings] = useState<ApiBuilding[]>([]);
  const [busy, setBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!universityId || !searching) {
      setResults([]);
      setBuildings([]);
      setSearchError(null);
      setBusy(false);
      return;
    }

    let cancelled = false;
    setBusy(true);

    const timer = setTimeout(async () => {
      const [rooms, places] = await Promise.all([
        searchFacilities(universityId, term),
        searchBuildings(universityId, term),
      ]);
      if (cancelled) return;

      // A term that matches nothing comes back successful with no `data`, which
      // the service already normalises to [].
      setResults(rooms.success ? rooms.data : []);
      setBuildings(places.success ? places.data : []);
      // Only a rooms failure is worth reporting: buildings are the secondary
      // result, and a screen that errors because the lesser half failed is
      // hiding the half that worked.
      setSearchError(rooms.success ? null : rooms.error);
      setBusy(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [universityId, term, searching]);

  const list = searching ? results : (byFilter.data ?? []);
  const loading = searching ? busy : byFilter.loading;
  const error = searching ? searchError : byFilter.error;
  const activeLabel = FILTERS.find((f) => f.value === filter)?.label ?? "";

  const openOnMap = (facility: ApiFacility) =>
    router.push({
      pathname: "/(tabs)/connect",
      params: { building: facility.building_id },
    });

  return (
    <SettingsShell title="Facilities">
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            minHeight: 50,
            paddingHorizontal: spacing.md,
            borderRadius: radius.full,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Icon name="search" size={19} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Search every room and building"
            placeholder="Search every room"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[inputTextStyle(), { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
          />
          {busy ? <Loader size={18} color={colors.textMuted} /> : null}
          {query ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery("")}
              style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="close" size={16} color={colors.textMuted} />
            </PressableScale>
          ) : null}
        </View>
      </View>

      {/* Hidden while searching: search spans every category, so leaving the
          chips visible would imply one of them still applies. */}
      {!searching ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          // A horizontal ScrollView has no intrinsic height, so in a column
          // parent it stretches to fill whatever is left. This pins it to its
          // content and lets the list below own the remaining space.
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
            gap: spacing.xs,
            alignItems: "center",
          }}
        >
          {FILTERS.map((option) => {
            const active = option.value === filter;
            return (
              <PressableScale
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilter(option.value);
                }}
                style={{
                  minHeight: 40,
                  paddingHorizontal: spacing.md,
                  justifyContent: "center",
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: active ? colors.textPrimary : colors.border,
                  backgroundColor: active ? colors.textPrimary : "transparent",
                }}
              >
                <Text variant="caption" color={active ? "background" : "textSecondary"}>
                  {option.label}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Text variant="caption" color="textMuted">
            {busy ? "Searching every room…" : `${list.length} matching “${term}”`}
          </Text>
        </View>
      )}

      <FlatList
        data={list}
        keyExtractor={(item) => item.facility_id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, marginLeft: spacing.lg, backgroundColor: colors.border }} />
        )}
        ListHeaderComponent={
          searching && buildings.length > 0 ? (
            <View style={{ paddingBottom: spacing.xs }}>
              <Text
                variant="micro"
                color="textMuted"
                style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xs }}
              >
                BUILDINGS
              </Text>
              {buildings.map((place) => (
                <PressableScale
                  key={place.building_id}
                  accessibilityRole="button"
                  accessibilityLabel={`${place.building_name}. Open building`}
                  onPress={() =>
                    router.push({
                      pathname: "/building/[id]",
                      params: { id: place.building_id },
                    })
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.md,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Icon name="campus" size={19} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" numberOfLines={1}>
                      {place.building_name}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {[place.building_code, place.address].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Icon name="forward" size={16} color={colors.textMuted} />
                </PressableScale>
              ))}
              {results.length > 0 ? (
                <Text
                  variant="micro"
                  color="textMuted"
                  style={{
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.md,
                    paddingBottom: spacing.xs,
                  }}
                >
                  ROOMS
                </Text>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <SkeletonList count={4} />
          ) : error ? (
            <EmptyState
              tone="error"
              title="Could not load facilities"
              body={error}
              actionLabel="Try again"
              onAction={searching ? () => setQuery(query) : byFilter.reload}
            />
          ) : searching ? (
            buildings.length > 0 ? null : (
              <EmptyState
                title="Nothing matches that"
                body="Try part of a room name, or a building name."
              />
            )
          ) : (
            <EmptyState
              title={`No ${activeLabel.toLowerCase()} listed`}
              body="Your campus has not added these yet. Try another category, or search every room."
            />
          )
        }
        renderItem={({ item }) => <Row facility={item} onPress={() => openOnMap(item)} />}
      />
    </SettingsShell>
  );
}
