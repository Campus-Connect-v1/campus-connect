import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { ActivityIndicator, Keyboard, ScrollView, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Icon, PressableScale, Text } from "@/src/components/ui";
import type { CampusPin } from "@/src/features/campus/types";
import { searchFacilities, type ApiFacility } from "@/src/services/campusServices";
import { radius, spacing, inputTextStyle } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface Result {
  key: string;
  title: string;
  detail: string;
  /** The building to select on the map. */
  buildingId: string;
}

/**
 * Search over buildings AND the rooms inside them.
 *
 * A room has no coordinates, so choosing one selects the building that contains
 * it. That is the honest mapping, and it is also what someone searching for
 * "Balme basement" actually wants: take me to the building.
 */
export function MapSearch({
  universityId,
  pins,
  top,
  onSelect,
}: {
  universityId?: string;
  pins: CampusPin[];
  top: number;
  onSelect: (pin: CampusPin) => void;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [rooms, setRooms] = useState<ApiFacility[]>([]);
  const [searching, setSearching] = useState(false);

  const term = query.trim().toLowerCase();

  useEffect(() => {
    if (!universityId || term.length < 2) {
      setRooms([]);
      return;
    }

    // Debounced: the search route hits the database on every call, and a
    // request per keystroke is both wasteful and out of order on arrival.
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const result = await searchFacilities(universityId, term);
      if (cancelled) return;
      setRooms(result.success ? result.data : []);
      setSearching(false);
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [universityId, term]);

  const buildingMatches: Result[] = term
    ? pins
        .filter(
          (pin) =>
            pin.label.toLowerCase().includes(term) || (pin.code ?? "").toLowerCase().includes(term)
        )
        .map((pin) => ({
          key: `b-${pin.id}`,
          title: pin.label,
          detail: pin.code ? `Building · ${pin.code}` : "Building",
          buildingId: pin.id,
        }))
    : [];

  const roomMatches: Result[] = rooms
    // A room in a building with no coordinates cannot be shown, so it is left
    // out rather than offered as a result that goes nowhere.
    .filter((room) => pins.some((pin) => pin.id === room.building_id))
    .map((room) => ({
      key: `f-${room.facility_id}`,
      title: room.facility_name,
      detail: [room.building_name, room.room_number ? `Room ${room.room_number}` : null]
        .filter(Boolean)
        .join(" · "),
      buildingId: room.building_id,
    }));

  const results = [...buildingMatches, ...roomMatches].slice(0, 12);
  const open = focused && term.length > 0;

  const choose = (result: Result) => {
    const pin = pins.find((p) => p.id === result.buildingId);
    if (!pin) return;
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setFocused(false);
    setQuery("");
    onSelect(pin);
  };

  return (
    <View
      style={{
        position: "absolute",
        top,
        left: spacing.lg,
        right: spacing.lg,
        // The results list overlaps the map controls beneath it. zIndex orders
        // it on iOS; Android needs elevation, which is the property it actually
        // stacks by.
        zIndex: 10,
        elevation: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          minHeight: 48,
          paddingHorizontal: spacing.md,
          borderRadius: radius.full,
          backgroundColor: colors.background,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel="Search buildings and rooms"
          placeholder="Search buildings and rooms"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[inputTextStyle(), { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
        />
        {searching ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
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

      {open ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          style={{
            marginTop: spacing.xs,
            maxHeight: 280,
            borderRadius: radius.md,
            overflow: "hidden",
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            zIndex: 10,
            elevation: 10,
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {results.length === 0 ? (
              <View style={{ padding: spacing.md }}>
                <Text variant="caption" color="textMuted">
                  {searching ? "Searching…" : "Nothing matches that."}
                </Text>
              </View>
            ) : (
              results.map((result) => (
                <PressableScale
                  key={result.key}
                  accessibilityRole="button"
                  accessibilityLabel={`${result.title}, ${result.detail}`}
                  onPress={() => choose(result)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    minHeight: 54,
                    paddingHorizontal: spacing.md,
                  }}
                >
                  <Icon
                    name={result.key.startsWith("b-") ? "campus" : "course"}
                    size={17}
                    color={colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" numberOfLines={1}>
                      {result.title}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1}>
                      {result.detail}
                    </Text>
                  </View>
                </PressableScale>
              ))
            )}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
}
