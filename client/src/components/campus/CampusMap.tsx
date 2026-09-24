import { Image } from "expo-image";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { Avatar, Text } from "@/src/components/ui";
import { useCampusLookup } from "@/src/hooks/useCampusRing";
import { CAMPUS_CENTER, DARK_MAP_STYLE, type CampusPin } from "@/src/features/campus/types";
import { freshnessOpacity, isTooOld, PRECISION_RADIUS, since } from "@/src/features/map/presence";
import type { FriendLocation } from "@/src/services/friendMapServices";
import type { NearbyProfile } from "@/src/services/geolocation";
import { SECTION_HUE, culture, foregroundOn, radius, spacing } from "@/src/styles/theme";

interface Props {
  pins: CampusPin[];
  selectedId?: string | null;
  onSelect: (pin: CampusPin) => void;
  people?: NearbyProfile[];
  onSelectPerson?: (person: NearbyProfile) => void;
  /** Accepted connections at any distance. Rendered above nearby strangers. */
  friends?: FriendLocation[];
  onSelectFriend?: (friend: FriendLocation) => void;
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
  friends = [],
  onSelectFriend,
  hue = SECTION_HUE.connect,
  focusId,
}: Props) {
  const mapRef = useRef<MapView>(null);
  const campusOf = useCampusLookup();
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
  const visibleFriends = useMemo(
    () => friends.filter((friend) => !isTooOld(friend.lastSeen)),
    [friends]
  );

  // A friend who is also within the nearby radius arrives from both reads. The
  // friend marker wins: it carries the relationship and the story ring.
  const friendIds = useMemo(
    () => new Set(visibleFriends.map((friend) => friend.userId)),
    [visibleFriends]
  );
  const strangers = useMemo(
    () => locatedPeople.filter((person) => !friendIds.has(person.user_id)),
    [locatedPeople, friendIds]
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

      {strangers.map((person) => {
        const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
        const campus = campusOf(person.universityId);
        // Own campus stays quiet; a visitor from another university gets a
        // heavier ring and their campus named, because on a map full of your
        // own classmates the outsider is the thing worth spotting.
        const away = campus && !campus.isOwn;

        return (
          <Marker
            key={`person-${person.user_id}`}
            coordinate={{ latitude: person.latitude!, longitude: person.longitude! }}
            onPress={() => onSelectPerson?.(person)}
            // Re-rasterises when the ring colour arrives: the university list
            // loads after first paint, so a marker frozen at mount would keep
            // the default ring forever.
            tracksViewChanges={!campus}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{ alignItems: "center", width: 104 }}>
              <View>
                <Avatar
                  uri={person.profile_picture ?? undefined}
                  size={48}
                  ring={Boolean(campus) || person.is_online}
                  ringColor={campus?.color}
                  ringWidth={away ? 3 : 2}
                />
                {person.is_online ? (
                  <View
                    style={{
                      position: "absolute",
                      right: 0,
                      bottom: 0,
                      width: 12,
                      height: 12,
                      borderRadius: radius.full,
                      backgroundColor: culture.lime,
                      borderWidth: 2,
                      borderColor: "rgba(11,14,18,0.88)",
                    }}
                  />
                ) : null}
              </View>

              <View
                style={{
                  marginTop: spacing["2xs"],
                  maxWidth: 104,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                  borderRadius: radius.full,
                  backgroundColor: away ? campus.color : "rgba(11,14,18,0.88)",
                }}
              >
                <Text
                  variant="caption"
                  numberOfLines={1}
                  onMedia={!away}
                  style={away ? { color: foregroundOn(campus.color) } : undefined}
                >
                  {name || "Someone nearby"}
                </Text>
              </View>

              {away ? (
                <Text
                  variant="caption"
                  numberOfLines={1}
                  style={{ marginTop: 1, fontSize: 10, color: campus.color }}
                >
                  {campus.label}
                </Text>
              ) : null}
            </View>
          </Marker>
        );
      })}

      {/* Friends last, so they draw above buildings and strangers. */}
      {visibleFriends.map((friend) => {
        const campus = campusOf(friend.universityId);
        const away = campus && !campus.isOwn;
        const opacity = freshnessOpacity(friend.lastSeen);
        const ago = since(friend.lastSeen);
        const haloRadius = PRECISION_RADIUS[friend.precision] ?? 0;
        const ringColor = friend.hasStory ? culture.pink : (campus?.color ?? hue);

        return (
          <Fragment key={`friend-${friend.userId}`}>
            {/* A coarse position is drawn as the area it actually means. A
                precise-looking pin for a city-level fix would be a lie. */}
            {haloRadius > 0 ? (
              <Circle
                center={{ latitude: friend.latitude, longitude: friend.longitude }}
                radius={haloRadius}
                strokeWidth={1}
                strokeColor={`${ringColor}55`}
                fillColor={`${ringColor}1A`}
              />
            ) : null}

            <Marker
              coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
              onPress={() => onSelectFriend?.(friend)}
              tracksViewChanges={!campus}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{ alignItems: "center", width: 112, opacity }}>
                <View>
                  <Avatar
                    uri={friend.avatar ?? undefined}
                    size={52}
                    ring
                    ringColor={ringColor}
                    ringWidth={friend.hasStory ? 3 : away ? 3 : 2}
                  />
                  {friend.isOnline ? (
                    <View
                      style={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                        width: 13,
                        height: 13,
                        borderRadius: radius.full,
                        backgroundColor: culture.lime,
                        borderWidth: 2,
                        borderColor: "rgba(11,14,18,0.88)",
                      }}
                    />
                  ) : null}
                </View>

                <View
                  style={{
                    marginTop: spacing["2xs"],
                    maxWidth: 112,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: 2,
                    borderRadius: radius.full,
                    backgroundColor: "rgba(11,14,18,0.88)",
                  }}
                >
                  <Text variant="caption" onMedia numberOfLines={1}>
                    {friend.name}
                  </Text>
                </View>

                {/* The age is shown on every friend, not just stale ones: a
                    map that only timestamps old pins implies the rest are live. */}
                {ago ? (
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    style={{ marginTop: 1, fontSize: 10, color: culture.warmWhite, opacity: 0.75 }}
                  >
                    {friend.placeLabel ? `${friend.placeLabel} · ${ago}` : ago}
                  </Text>
                ) : null}
              </View>
            </Marker>
          </Fragment>
        );
      })}
    </MapView>
  );
}
