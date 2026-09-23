import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Icon, Loader, PressableScale, Text } from "@/src/components/ui";
import type { CampusPin } from "@/src/features/campus/types";
import { useAsync } from "@/src/hooks/useAsync";
import { fetchBuildingFacilities, type ApiFacility } from "@/src/services/campusServices";
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
  academic: "Academic",
  administrative: "Administrative",
  residential: "Hall of residence",
  recreational: "Recreational",
  dining: "Dining",
  library: "Library",
  sports: "Sports",
};

function FacilityRow({ facility }: { facility: ApiFacility }) {
  const detail = [
    TYPE_LABEL[facility.facility_type] ?? "Facility",
    facility.room_number ? `Room ${facility.room_number}` : null,
    facility.floor ? `Floor ${facility.floor}` : null,
    facility.capacity ? `seats ${facility.capacity}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xs,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="label" onMedia numberOfLines={1}>
          {facility.facility_name}
        </Text>
        <Text variant="caption" onMedia style={{ opacity: 0.75 }} numberOfLines={1}>
          {detail}
        </Text>
      </View>

      {Number(facility.is_reservable) ? (
        <View
          style={{
            paddingHorizontal: spacing.xs,
            paddingVertical: 3,
            borderRadius: radius.full,
            backgroundColor: culture.lime,
          }}
        >
          <Text variant="caption" style={{ color: culture.ink, fontSize: 11 }}>
            Bookable
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The card that rises when a building pin is tapped.
 *
 * Facilities have no coordinates of their own — `campus_facilities` stores a
 * `building_id`, a floor and a room number — so they cannot be pins. They are
 * reached by drilling into the building that contains them, which is also how
 * someone actually looks for a room.
 */
export function BuildingSheet({
  pin,
  bottom,
  onClose,
}: {
  pin: CampusPin;
  bottom: number;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  const facilities = useAsync(
    useCallback(() => fetchBuildingFacilities(pin.id), [pin.id]),
    [pin.id]
  );

  const rooms = facilities.data ?? [];
  const bookable = rooms.filter((room) => Number(room.is_reservable)).length;
  // The sheet stays a glance; the full list lives on the building screen.
  const shown = rooms.slice(0, 3);

  const summary = facilities.loading
    ? "Looking for rooms"
    : rooms.length === 0
      ? (BUILDING_LABEL[pin.buildingType ?? ""] ?? "No rooms listed")
      : `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}` +
        (bookable ? ` · ${bookable} bookable` : "");

  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      style={{
        position: "absolute",
        left: spacing.lg,
        right: spacing.lg,
        bottom,
        maxHeight: 420,
        borderRadius: radius.lg,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.16)",
      }}
    >
      <BlurView
        intensity={70}
        tint="dark"
        style={{ padding: spacing.sm, backgroundColor: "rgba(11,14,18,0.55)" }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
          <Image
            source={pin.image}
            contentFit="cover"
            style={{ width: 60, height: 60, borderRadius: radius.md }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="heading" onMedia numberOfLines={1}>
              {pin.label}
            </Text>
            <Text variant="caption" onMedia style={{ opacity: 0.8 }} numberOfLines={1}>
              {pin.code ? `${pin.code} · ` : ""}
              {summary}
            </Text>
            {pin.address ? (
              <Text variant="caption" onMedia style={{ opacity: 0.6 }} numberOfLines={1}>
                {pin.address}
              </Text>
            ) : null}
          </View>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Close ${pin.label}`}
            onPress={onClose}
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="close" size={18} color={colors.onMedia} />
          </PressableScale>
        </View>

        {facilities.loading ? (
          <View style={{ paddingVertical: spacing.md, alignItems: "center" }}>
            <Loader color={colors.onMedia} />
          </View>
        ) : rooms.length ? (
          <>
            <View
              style={{
                height: 1,
                marginVertical: spacing.xs,
                backgroundColor: "rgba(255,255,255,0.14)",
              }}
            />
            <View>
              {shown.map((room) => (
                <FacilityRow key={room.facility_id} facility={room} />
              ))}
            </View>

            {rooms.length > 3 ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`Open ${pin.label}`}
                onPress={() => router.push({ pathname: "/building/[id]", params: { id: pin.id } })}
                style={{
                  minHeight: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: spacing["2xs"],
                }}
              >
                <Text variant="label" onMedia>
                  {`All ${rooms.length} rooms`}
                </Text>
                <Icon name="forward" size={14} color={colors.onMedia} />
              </PressableScale>
            ) : null}
          </>
        ) : null}
      </BlurView>
    </Animated.View>
  );
}
