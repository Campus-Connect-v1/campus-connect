import { Image } from "expo-image";
import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { Avatar, Text } from "@/src/components/ui";
import { CAMPUS_CENTER, DARK_MAP_STYLE, type CampusPin } from "@/src/features/campus/types";
import type { NearbyProfile } from "@/src/services/geolocation";
import { SECTION_HUE, culture, radius, spacing } from "@/src/styles/theme";

interface Props {
  pins: CampusPin[];
  selectedId?: string | null;
  onSelect: (pin: CampusPin) => void;
  people?: NearbyProfile[];
  onSelectPerson?: (person: NearbyProfile) => void;
  hue?: string;
  /**
   * Pans the camera to this pin when it changes. Used by search, where the
   * chosen building is usually off screen.
   */
  focusId?: string | null;
}

const KIND_HUE: Record<CampusPin["kind"], string> = {
  hall: culture.pink,
  study: culture.violet,
  social: culture.lime,
  event: culture.yellow,
};

/** Smallest region containing every pin, with a margin so none sit on the edge. */
function regionFor(pins: CampusPin[], people: NearbyProfile[]) {
  const points = [
    ...pins.map((pin) => ({ latitude: pin.latitude, longitude: pin.longitude })),
    ...people.flatMap((person) =>
      person.latitude != null && person.longitude != null
        ? [{ latitude: person.latitude, longitude: person.longitude }]
        : []
    ),
  ];
  if (points.length === 0) return CAMPUS_CENTER;

  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    // The floor keeps a single-building campus from opening zoomed to street
    // level, where one marker fills the screen and nothing reads as a map.
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, 0.006),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, 0.006),
  };
}

/**
 * Campus map with photo pins, in the style of the reference: a dark map that
 * recedes, and round avatar markers that carry the actual information.
 *
 * Provider is left at the platform default — Apple Maps on iOS, Google on
 * Android — because forcing PROVIDER_GOOGLE on iOS needs a Google Maps API key
 * and nothing here requires Google specifically. The two platforms go dark by
 * different means, hence the split below.
 */
export function CampusMap({
  pins,
  selectedId,
  onSelect,
  people = [],
  onSelectPerson,
  hue = SECTION_HUE.connect,
  focusId,
}: Props) {
  const mapRef = useRef<MapView>(null);
  // `initialRegion` is read once on mount, so the region is keyed on the pins:
  // buildings arrive asynchronously and a map already mounted on the fallback
  // would otherwise stay in Legon for the rest of the session.
  const locatedPeople = useMemo(
    () =>
      people.filter(
        (person) =>
          person.latitude != null &&
          person.longitude != null &&
          Number.isFinite(person.latitude) &&
          Number.isFinite(person.longitude)
      ),
    [people]
  );
  const region = useMemo(() => regionFor(pins, locatedPeople), [pins, locatedPeople]);

  useEffect(() => {
    if (!focusId) return;
    const target = pins.find((pin) => pin.id === focusId);
    if (!target) return;

    // Zoomed in past the whole-campus region, because the point of focusing is
    // to see which building it is rather than where the campus is.
    mapRef.current?.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      420
    );
  }, [focusId, pins]);

  return (
    <MapView
      ref={mapRef}
      key={pins.length || locatedPeople.length ? "located" : "fallback"}
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFill}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      userInterfaceStyle="dark"
      customMapStyle={Platform.OS === "android" ? DARK_MAP_STYLE : undefined}
    >
      {pins.map((pin) => {
        const selected = pin.id === selectedId;
        const tint = selected ? hue : KIND_HUE[pin.kind];

        return (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => onSelect(pin)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{ alignItems: "center", width: 96 }}>
              <View
                style={{
                  width: selected ? 60 : 50,
                  height: selected ? 60 : 50,
                  borderRadius: radius.full,
                  borderWidth: 2.5,
                  borderColor: tint,
                  padding: 2,
                  backgroundColor: "#0B0E12",
                }}
              >
                <Image
                  source={pin.image}
                  contentFit="cover"
                  style={{ flex: 1, borderRadius: radius.full }}
                />
              </View>

              <View
                style={{
                  marginTop: spacing["2xs"],
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                  backgroundColor: "rgba(11,14,18,0.82)",
                }}
              >
                <Text variant="caption" onMedia numberOfLines={1}>
                  {pin.label}
                </Text>
              </View>
            </View>
          </Marker>
        );
      })}

      {locatedPeople.map((person) => {
        const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
        return (
          <Marker
            key={`person-${person.user_id}`}
            coordinate={{ latitude: person.latitude!, longitude: person.longitude! }}
            onPress={() => onSelectPerson?.(person)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{ alignItems: "center", width: 104 }}>
              <Avatar uri={person.profile_picture ?? undefined} size={48} ring={person.is_online} />
              <View
                style={{
                  marginTop: spacing["2xs"],
                  maxWidth: 104,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                  backgroundColor: "rgba(11,14,18,0.88)",
                }}
              >
                <Text variant="caption" onMedia numberOfLines={1}>
                  {name || "Someone nearby"}
                </Text>
              </View>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}
