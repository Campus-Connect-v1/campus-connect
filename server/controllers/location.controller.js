// controllers/locationController.js
import { LocationService } from "../utils/locationService.js";
import { PrivacyService } from "../utils/privacyService.js";
import { ProfileService } from "../utils/profileService.js";

const locationService = new LocationService();
const privacyService = new PrivacyService();
const profileService = new ProfileService();

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
      accuracy
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

export const getNearbyProfiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { radius = 100 } = req.query;

    // Get nearby users from MongoDB
    const nearbyUsers = await locationService.findNearbyUsers(
      userId,
      parseInt(radius)
    );

    // Get filtered profiles with privacy validation
    const visibleProfiles = [];

    for (const nearbyUser of nearbyUsers) {
      if (await privacyService.canViewProfile(userId, nearbyUser.user_id)) {
        const profile = await profileService.getFilteredProfile(
          nearbyUser.user_id,
          userId
        );
        if (profile) {
          visibleProfiles.push({
            ...profile,
            distance: nearbyUser.distance,
            last_seen: nearbyUser.last_updated,
          });
        }
      }
    }

    res.json({
      message: "Nearby profiles retrieved successfully",
      count: visibleProfiles.length,
      radius: parseInt(radius),
      profiles: visibleProfiles,
    });
  } catch (error) {
    console.error("Get nearby profiles error:", error);
    res.status(500).json({
      message: "Failed to retrieve nearby profiles",
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
    const locationService = new LocationService();
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

export const getLocationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { hours = 24 } = req.query;

    const locationService = new LocationService();
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
