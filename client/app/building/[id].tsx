import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, ScrollView, View } from "react-native";

import { SettingsShell } from "@/src/components/settings/SettingsPrimitives";
import { Button, EmptyState, Icon, PressableScale, SkeletonList, Text } from "@/src/components/ui";
import { useAsync } from "@/src/hooks/useAsync";
import {
  fetchBuilding,
  fetchBuildingFacilities,
  type ApiFacility,
} from "@/src/services/campusServices";
import { culture, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

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

const BUILDING_LABEL: Record<string, string> = {
  academic: "Academic building",
  administrative: "Administrative building",
  residential: "Hall of residence",
  recreational: "Recreational building",
  dining: "Dining",
  library: "Library",
  sports: "Sports facility",
};

export default function BuildingScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [filter, setFilter] = useState<string | null>(null);

  const building = useAsync(
    useCallback(() => fetchBuilding(id), [id]),
    [id]
  );

  const facilities = useAsync(
    useCallback(() => fetchBuildingFacilities(id), [id]),
    [id]
  );

  // Memoised because it feeds a dependency array; a fresh [] each render
  // would rebuild the type list on every frame.
  const rooms = useMemo(() => facilities.data ?? [], [facilities.data]);

  // Only the types this building actually has, so the filter never offers a
  // category that leads to an empty list.
  const types = useMemo(() => {
    const present = new Set(rooms.map((room) => room.facility_type));
    return [...present];
  }, [rooms]);

  const visible = filter ? rooms.filter((room) => room.facility_type === filter) : rooms;
  const bookable = rooms.filter((room) => Number(room.is_reservable)).length;

  if (building.loading) {
    return (
      <SettingsShell title="Building">
        <EmptyState.Loading />
      </SettingsShell>
    );
  }

  const data = building.data;

  if (!data) {
    return (
      <SettingsShell title="Building">
        <EmptyState
          tone="error"
          title="Could not load this building"
          body={building.error ?? "It may no longer be listed."}
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SettingsShell>
    );
  }

  const hasCoords =
    Number.isFinite(Number(data.latitude)) && Number.isFinite(Number(data.longitude));

  return (
    <SettingsShell title={data.building_code || "Building"}>
      <FlatList
        data={visible}
        keyExtractor={(item: ApiFacility) => item.facility_id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, marginLeft: spacing.lg, backgroundColor: colors.border }} />
        )}
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <View style={{ gap: spacing["2xs"] }}>
              <Text variant="title">{data.building_name}</Text>
              <Text variant="caption" color="textMuted">
                {[BUILDING_LABEL[data.building_type] ?? "Building", data.address]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            {data.description ? (
              <Text variant="body" color="textSecondary">
                {data.description}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.lg }}>
              <View>
                <Text variant="heading">{rooms.length}</Text>
                <Text variant="micro" color="textMuted">
                  ROOMS
                </Text>
              </View>
              {bookable > 0 ? (
                <View>
                  <Text variant="heading">{bookable}</Text>
                  <Text variant="micro" color="textMuted">
                    BOOKABLE
                  </Text>
                </View>
              ) : null}
            </View>

            {hasCoords ? (
              <Button
                label="Show on the campus map"
                variant="secondary"
                icon={<Icon name="map" size={17} color={colors.textPrimary} />}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/connect",
                    params: { building: data.building_id },
                  })
                }
              />
            ) : null}

            {types.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0 }}
                contentContainerStyle={{ gap: spacing.xs, alignItems: "center" }}
              >
                {[null, ...types].map((value) => {
                  const active = value === filter;
                  return (
                    <PressableScale
                      key={value ?? "all"}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={value ? TYPE_LABEL[value] : "All rooms"}
                      onPress={() => setFilter(value)}
                      style={{
                        minHeight: 36,
                        paddingHorizontal: spacing.md,
                        justifyContent: "center",
                        borderRadius: radius.full,
                        borderWidth: 1,
                        borderColor: active ? colors.textPrimary : colors.border,
                        backgroundColor: active ? colors.textPrimary : "transparent",
                      }}
                    >
                      <Text variant="caption" color={active ? "background" : "textSecondary"}>
                        {value ? TYPE_LABEL[value] : "All"}
                      </Text>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          facilities.loading ? (
            <SkeletonList count={3} />
          ) : (
            <EmptyState
              compact
              title="No rooms listed"
              body="This building has no facilities recorded yet."
            />
          )
        }
        renderItem={({ item }) => {
          const detail = [
            TYPE_LABEL[item.facility_type] ?? "Facility",
            item.room_number ? `Room ${item.room_number}` : null,
            item.floor ? `Floor ${item.floor}` : null,
            item.capacity ? `seats ${item.capacity}` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <View
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
                  {item.facility_name}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {detail}
                </Text>
                {item.operating_hours ? (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {item.operating_hours}
                  </Text>
                ) : null}
              </View>

              {Number(item.is_reservable) ? (
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
            </View>
          );
        }}
      />
    </SettingsShell>
  );
}
