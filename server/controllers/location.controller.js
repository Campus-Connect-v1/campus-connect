// controllers/locationController.js

import { getAcceptedConnectionProfiles } from "../models/user.model.js";
import { UserLocation } from "../models/location.js";
import { LocationService } from "../utils/locationService.js";
import { PrivacyService } from "../utils/privacyService.js";
import { ProfileService } from "../utils/profileService.js";

const locationService = new LocationService();
const privacyService = new PrivacyService();
const profileService = new ProfileService();

export const getNearbyProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    /**
     * Search radius in metres.
     *
     * Bounded on both sides. The ceiling is national rather than global:
     * 800km spans Ghana end to end, which is as wide as "nearby" can be and
     * still mean anything, while an unbounded value turns a geo query into a
     * full scan of every location in the collection.
     *
     * The floor stops a zero or negative radius silently returning nothing.
     */
    const MIN_RADIUS_M = 50;
    const MAX_RADIUS_M = 800_000;
    const requested = parseInt(req.query.radius, 10);
    const radius = Number.isFinite(requested)
      ? Math.min(Math.max(requested, MIN_RADIUS_M), MAX_RADIUS_M)
      : 500;

    // console.log(
    //   `📍 Finding nearby profiles for user ${userId} within ${radius}m`
    // );

    // Get nearby users
    const [nearbyUsers, viewerLocation] = await Promise.all([
      locationService.findNearbyUsers(userId, radius),
      locationService.getUserLocationWithFallback(userId),
    ]);

    // console.log(`👥 Found ${nearbyUsers.length} nearby users`);

    // Batch privacy check for all nearby users
    const nearbyUserIds = nearbyUsers.map((user) => user.user_id);
    const visibleProfiles = await profileService.batchGetFilteredProfiles(
      nearbyUserIds,
      userId
    );

    // console.log(
    //   `🔐 ${visibleProfiles.length} profiles visible after privacy check`
    // );

    // Enhance with distance and online status
    const enhancedProfiles = visibleProfiles.map((profile) => {
      const nearbyUser = nearbyUsers.find((u) => u.user_id === profile.user_id);
      return {
        ...profile,
        distance: nearbyUser?.distance || 0,
        accuracy: nearbyUser?.accuracy || 50,
        last_seen: profile.last_seen || nearbyUser?.last_seen || new Date(),
        coordinates: nearbyUser?.coordinates || null,
        // GeoJSON stores [longitude, latitude]. Prefer the named values from
        // the aggregation and only fall back to the correctly ordered tuple.
        latitude:
          nearbyUser?.latitude ?? nearbyUser?.coordinates?.[1] ?? null,
        longitude:
          nearbyUser?.longitude ?? nearbyUser?.coordinates?.[0] ?? null,
      };
    });

    if (enhancedProfiles.length === 0) {
      return res.status(200).json({
        user: userId,
        message: "No nearby profiles found",
        radius: parseInt(radius),
        suggestion: "Try increasing the search radius",
        profiles: [], // Explicitly return empty array, to be set so as when empty have an empty array msg
      });
    }

    res.json({
      message: "Nearby profiles retrieved successfully",
      count: enhancedProfiles.length,
      radius,
      profiles: enhancedProfiles,
    });
  } catch (error) {
    /**
     * Not having shared a location yet is the normal state of a new account,
     * not a server fault. locationService throws "User location not found"
     * for it, which was being caught below and returned as a 500 -- so the
     * Connect tab greeted every new user with an error instead of an empty
     * state, and the radius control looked broken before it had been used.
     */
    if (String(error.message).includes("location not found")) {
      return res.status(200).json({
        message: "Share your location to see who is nearby",
        count: 0,
        radius,
        needs_location: true,
        profiles: [],
      });
    }

    console.error("Get nearby profiles error:", error);
    res.status(500).json({
      message: "Failed to retrieve nearby profiles",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// New controller for incognito mode
export const toggleIncognitoMode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        message: "Enabled field must be a boolean",
      });
    }

    const result = await privacyService.toggleIncognitoMode(userId, enabled);

    res.json({
      message: `Incognito mode ${
        enabled ? "enabled" : "disabled"
      } successfully`,
      ...result,
    });
  } catch (error) {
    console.error("Toggle incognito mode error:", error);
    res.status(500).json({
      message: "Failed to update incognito mode",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getLocationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hours = 24 } = req.query;

    const history = await locationService.getLocationHistory(
      userId,
      parseInt(hours)
    );

    res.json({
      message: "Location history retrieved successfully",
      hours: parseInt(hours),
      locations: history,
    });
  } catch (error) {
    console.error("Get location history error:", error);
    res.status(500).json({
      message: "Failed to retrieve location history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getPrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await privacyService.getPrivacySettings(userId);

    res.json({
      message: "Privacy settings retrieved successfully",
      settings,
    });
  } catch (error) {
    console.error("Get privacy settings error:", error);
    res.status(500).json({
      message: "Failed to retrieve privacy settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const toggleLocationSharing = async (req, res) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        message: "Enabled field must be a boolean",
      });
    }

    // Update in MongoDB
    await locationService.toggleLocationSharing(userId, enabled);

    res.json({
      message: `Location sharing ${
        enabled ? "enabled" : "disabled"
      } successfully`,
      location_sharing_enabled: enabled,
    });
  } catch (error) {
    console.error("Toggle location sharing error:", error);
    res.status(500).json({
      message: "Failed to update location sharing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, accuracy = 50 } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    // Update location in MongoDB
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];
    const result = await locationService.updateUserLocation(
      userId,
      coordinates,
      parseFloat(accuracy)
    );

    res.json({
      message: "Location updated successfully",
      location: {
        coordinates: result.location.coordinates,
        accuracy: result.accuracy,
        last_updated: result.last_updated,
      },
    });
  } catch (error) {
    console.error("Update location error:", error);

    if (error.message.includes("too frequent")) {
      return res.status(429).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to update location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Validate settings
    privacyService.validatePrivacySettings(updateData);

    // Update in MySQL
    const settings = await privacyService.updatePrivacySettings(
      userId,
      updateData
    );

    res.json({
      message: "Privacy settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update privacy settings error:", error);

    if (
      error.message.includes("Invalid") ||
      error.message.includes("must be")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to update privacy settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ---------------------------------------------------------------------------
// Friend map
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6371000;

// Precision bands, in metres. `area` covers roughly a city; beyond that a
// position is only ever reported at city granularity.
const AREA_MAX_M = 25000;

// How much a coarse position is rounded, in degrees. ~0.005 is a few hundred
// metres; ~0.05 is a few kilometres. Rounding happens HERE, not on the client:
// sending an exact coordinate and asking the client to draw a blurry circle
// still hands out the exact coordinate.
const ROUNDING = { area: 0.005, city: 0.05 };

function metresBetween(a, b) {
  if (!a || !b) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

/**
 * Every accepted connection who is sharing location, at any distance.
 *
 * This exists because `findNearbyUsers` cannot answer it: that is a `$near`
 * with a `maxDistance`, so a friend outside the radius is never found rather
 * than merely filtered out.
 *
 * Precision is decided here and the coordinates are rounded before they leave
 * the server. A friend in another city is reported at city granularity, so the
 * map can say "around Accra" without the client ever holding a precise fix.
 */
export const getFriendLocations = async (req, res) => {
  try {
    const userId = req.user.id;

    const [connections, viewerLocation] = await Promise.all([
      getAcceptedConnectionProfiles(userId),
      locationService.getUserLocationWithFallback(userId),
    ]);

    if (connections.length === 0) {
      return res.status(200).json({ success: true, count: 0, friends: [] });
    }

    const ids = connections.map((row) => row.user_id);

    // Only rows still sharing. Incognito flips `location_sharing_enabled`, so
    // Ghost Mode is honoured by this filter rather than by a separate check.
    const locations = await UserLocation.find({
      user_id: { $in: ids },
      is_active: true,
      location_sharing_enabled: true,
    }).lean();

    const byUser = new Map(locations.map((row) => [row.user_id, row]));

    const viewerPoint = viewerLocation?.location?.coordinates
      ? {
          latitude: viewerLocation.location.coordinates[1],
          longitude: viewerLocation.location.coordinates[0],
        }
      : null;

    const settings = await Promise.all(
      connections.map((row) =>
        privacyService.getPrivacySettings(row.user_id).catch(() => null)
      )
    );

    const friends = [];

    connections.forEach((row, index) => {
      const location = byUser.get(row.user_id);
      if (!location?.location?.coordinates) return;

      // A private profile is off the map entirely, whatever their sharing flag
      // says -- the two settings are independent and the stricter one wins.
      if (row.privacy_profile === "private") return;

      const privacy = settings[index];
      if (privacy?.profile_visibility === "private") return;

      const exactAllowed = privacy ? Boolean(Number(privacy.show_exact_location)) : false;
      const radius = Number(privacy?.custom_radius) || 500;

      const point = {
        latitude: location.location.coordinates[1],
        longitude: location.location.coordinates[0],
      };
      const distance = metresBetween(viewerPoint, point);

      let precision = "city";
      if (distance !== null) {
        if (exactAllowed && distance <= radius) precision = "exact";
        else if (distance <= AREA_MAX_M) precision = "area";
      }

      const step = ROUNDING[precision];
      const latitude = step ? roundTo(point.latitude, step) : point.latitude;
      const longitude = step ? roundTo(point.longitude, step) : point.longitude;

      friends.push({
        user_id: row.user_id,
        first_name: row.first_name,
        last_name: row.last_name,
        profile_picture_url: row.profile_picture_url,
        university_id: row.university_id,
        latitude,
        longitude,
        precision,
        last_seen: location.last_seen || location.last_updated,
        is_online: isRecentlySeen(location.last_seen || location.last_updated),
        has_story: Boolean(Number(row.has_story)),
        place_label: null,
      });
    });

    res.status(200).json({ success: true, count: friends.length, friends });
  } catch (error) {
    console.error("Get friend locations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve friend locations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/** Online means seen in the last five minutes, matching ProfileService. */
function isRecentlySeen(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}
