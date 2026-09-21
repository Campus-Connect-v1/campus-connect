/**
 * Fallback map region, used only until real buildings load.
 *
 * Coordinates are University of Ghana, Legon. Pins themselves come from
 * GET /api/university/:university_id/buildings; `CampusMap` recenters on them
 * as soon as they arrive, so this is a first-frame placeholder, not the map.
 */
export const CAMPUS_CENTER = {
  latitude: 5.6508,
  longitude: -0.1869,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export interface CampusPin {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  image: string;
  /**
   * How many students are checked in here right now.
   *
   * Always 0 for a building from the API: no endpoint reports presence per
   * building, so nothing may render this as a live count.
   */
  count: number;
  kind: "hall" | "study" | "social" | "event";
  /** From the buildings API, for the detail sheet. */
  code?: string | null;
  address?: string | null;
  description?: string | null;
  buildingType?: string | null;
}

/**
 * Dark map style for Android (Google Maps). iOS uses Apple Maps, which ignores
 * `customMapStyle` entirely and is told to go dark via `userInterfaceStyle`.
 */
export const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0B0E12" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8A847A" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0E12" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1C222A" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0B0E12" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2A323C" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#05070A" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#11151A" }] },
];
