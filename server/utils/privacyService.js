// utils/privacyService.js

import {
  getPrivacySettingsModel,
  updatePrivacySettingsModel,
} from "../models/user.model.js";
import { LocationService } from "./locationService.js";
import redisClient from "../config/redis.js";

export class PrivacyService {
  constructor() {
    this.locationService = new LocationService();
  }

  async fetchPrivacySettingsFromDB(userIds) {
    try {
      const settingsMap = {};

      for (const userId of userIds) {
        try {
          const settings = await getPrivacySettingsModel(userId);

          if (settings) {
            // FIXED: Use consistent field naming
            const visibilityRadius =
              settings.visibility_radius || settings.custom_radius || 100;

            settingsMap[userId] = {
              profile_visibility: settings.profile_visibility || "geofenced",
              visibility_radius: visibilityRadius,
              custom_radius: visibilityRadius, // Keep both for compatibility
              show_exact_location: settings.show_exact_location || false,
              visible_fields:
                settings.visible_fields ||
                JSON.stringify({
                  name: true,
                  photo: true,
                  bio: true,
                  program: true,
                  courses: false,
                  contact: false,
                }),
            };
          } else {
            // Create default settings if none exist
            settingsMap[userId] = {
              profile_visibility: "geofenced",
              visibility_radius: 100,
              custom_radius: 100,
              show_exact_location: false,
              visible_fields: JSON.stringify({
                name: true,
                photo: true,
                bio: true,
                program: true,
                courses: false,
                contact: false,
              }),
            };
          }
        } catch (error) {
          console.log(
            `⚠️ Error fetching privacy for ${userId}:`,
            error.message
          );
          settingsMap[userId] = this.getDefaultPrivacySettings();
        }
      }

      return settingsMap;
    } catch (error) {
      console.error("❌ Error in fetchPrivacySettingsFromDB:", error);
      return {};
    }
  }

  getDefaultPrivacySettings() {
    return {
      profile_visibility: "geofenced",
      visibility_radius: 100,
      custom_radius: 100,
      show_exact_location: false,
      visible_fields: JSON.stringify({
        name: true,
        photo: true,
        bio: true,
        program: true,
        courses: false,
        contact: false,
      }),
    };
  }

  // Batch check privacy for multiple users at once
  async batchCanViewProfile(viewerId, profileOwnerIds) {
    try {
      // console.log(`🔐 BATCH PRIVACY CHECK STARTED`);
      // console.log(`   Viewer: ${viewerId}`);
      // console.log(
      //   `   Checking ${profileOwnerIds.length} users:`,
      //   profileOwnerIds
      // );

      if (!profileOwnerIds.length) {
        // console.log("❌ No profile owner IDs provided");
        return {};
      }

      if (!viewerId) {
        // console.log("❌ No viewer ID provided");
        const fallbackResults = {};
        profileOwnerIds.forEach((id) => (fallbackResults[id] = false));
        return fallbackResults;
      }

      const cacheKey = `privacy_batch:${viewerId}:${profileOwnerIds
        .sort()
        .join("_")}`;

      // Check Redis cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`✅ Using cached privacy results`);
        return JSON.parse(cached);
      }

      const results = {};
      const privacySettingsMap = await this.batchGetPrivacySettings(
        profileOwnerIds
      );

      // console.log(
      //   `✅ Retrieved privacy settings for ${
      //     Object.keys(privacySettingsMap).length
      //   } users`
      // );

      // Process each user
      for (const profileOwnerId of profileOwnerIds) {
        try {
          const settings = privacySettingsMap[profileOwnerId];

          if (!settings) {
            console.log(
              `❌ No privacy settings found for user ${profileOwnerId}`
            );
            results[profileOwnerId] = false;
            continue;
          }

          const canView = await this.evaluatePrivacyAccess(
            viewerId,
            profileOwnerId,
            settings
          );

          results[profileOwnerId] = canView;

          if (canView) {
            // console.log(`✅ ALLOWED: ${viewerId} can view ${profileOwnerId}`);
          } else {
            // console.log(`❌ DENIED: ${viewerId} cannot view ${profileOwnerId}`);
          }
        } catch (error) {
          console.error(
            `⚠️ Error processing ${profileOwnerId}:`,
            error.message
          );
          results[profileOwnerId] = false;
        }
      }

      // Cache batch results for 1 minute
      try {
        await redisClient.setex(cacheKey, 1800, JSON.stringify(results));
        console.log(`💾 Cached results in Redis for 1800 seconds`);
      } catch (cacheError) {
        console.error("⚠️ Failed to cache results:", cacheError.message);
      }

      return results;
    } catch (error) {
      console.error("❌ CRITICAL ERROR in batchCanViewProfile:", error);
      const fallbackResults = {};
      profileOwnerIds.forEach((id) => (fallbackResults[id] = false));
      return fallbackResults;
    }
  }

  // Get privacy settings for multiple users at once
  async batchGetPrivacySettings(userIds) {
    const settingsMap = {};
    const uncachedUsers = [];
    const cachedSettings = {};

    // Check Redis cache for each user
    for (const userId of userIds) {
      const cacheKey = `user_privacy:${userId}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        cachedSettings[userId] = JSON.parse(cached);
      } else {
        uncachedUsers.push(userId);
      }
    }

    // Batch fetch uncached settings from MySQL
    if (uncachedUsers.length > 0) {
      const dbSettings = await this.fetchPrivacySettingsFromDB(uncachedUsers);

      // Cache each setting individually
      for (const [userId, settings] of Object.entries(dbSettings)) {
        await redisClient.setex(
          `user_privacy:${userId}`,
          300,
          JSON.stringify(settings)
        );
        settingsMap[userId] = settings;
      }
    }

    // Combine cached and newly fetched settings
    return { ...cachedSettings, ...settingsMap };
  }

  // Enhanced privacy evaluation with proper geofencing
  async evaluatePrivacyAccess(viewerId, profileOwnerId, privacySettings) {
    try {
      // Allow users to view their own profile
      if (viewerId === profileOwnerId) {
        console.log(`   👤 User viewing own profile`);
        return true;
      }

      if (!privacySettings) {
        // console.log(`   ❌ No privacy settings provided`);
        return false;
      }

      // console.log(`   🔍 Privacy evaluation for ${profileOwnerId}:`);
      // console.log(`      Visibility: ${privacySettings.profile_visibility}`);
      // console.log(`      Radius: ${privacySettings.visibility_radius}m`);

      switch (privacySettings.profile_visibility) {
        case "public":
          // console.log(`   🌐 Public profile - automatic access`);
          return true;

        case "private":
          // console.log(`   🔒 Private profile - access denied`);
          return false;

        case "geofenced":
          const radius = privacySettings.visibility_radius || 100;
          // console.log(`   📍 Geofenced profile - checking ${radius}m radius`);

          const isNearby = await this.isViewerInGeofence(
            viewerId,
            profileOwnerId,
            radius
          );

          // console.log(
          //   `   📍 Geofence result: ${
          //     isNearby ? "WITHIN_RADIUS" : "OUTSIDE_RADIUS"
          //   }`
          // );
          return isNearby;

        case "friends_only":
          console.log(`   👥 Friends-only profile - checking relationship`);
          const areFriends = await this.areConnected(viewerId, profileOwnerId);
          console.log(
            `   👥 Friendship status: ${areFriends ? "FRIENDS" : "NOT_FRIENDS"}`
          );
          return areFriends;

        default:
          // console.log(`   ⚠️ Unknown visibility, defaulting to deny`);
          return false;
      }
    } catch (error) {
      console.error(`   ❌ Error in evaluatePrivacyAccess:`, error.message);
      return false;
    }
  }

  // Enhanced geofence checking with location validation
  async isViewerInGeofence(viewerId, profileOwnerId, radius = 5000) {
    try {
      // console.log(`   📍 Checking geofence proximity:`);
      // console.log(
      //   `      Viewer: ${viewerId}, Owner: ${profileOwnerId}, Radius: ${radius}m`
      // );

      // Get both users' locations with fallback to database
      const [viewerLocation, ownerLocation] = await Promise.all([
        this.getUserLocationWithFallback(viewerId),
        this.getUserLocationWithFallback(profileOwnerId),
      ]);

      // Validate locations
      if (!viewerLocation || viewerLocation.latitude === undefined) {
        // console.log(`   ❌ Missing or invalid viewer location for ${viewerId}`);
        // console.log(`   📍 Viewer location data:`, viewerLocation);
        return false;
      }

      if (!ownerLocation || ownerLocation.latitude === undefined) {
        // console.log(
        //   `   ❌ Missing or invalid owner location for ${profileOwnerId}`
        // );
        // console.log(`   📍 Owner location data:`, ownerLocation);
        return false;
      }

      // console.log(
      //   `   📍 Viewer location: ${viewerLocation.latitude}, ${viewerLocation.longitude}`
      // );

      // console.log(
      //   `   📍 Owner location: ${ownerLocation.latitude}, ${ownerLocation.longitude}`
      // );

      // Calculate distance using the fixed method
      const distance = this.locationService.calculateDistance(
        viewerLocation.latitude,
        viewerLocation.longitude,
        ownerLocation.latitude,
        ownerLocation.longitude
      );

      // console.log(
      //   `   📏 Calculated distance: ${distance.toFixed(
      //     2
      //   )}m (max allowed: ${radius}m)`
      // );

      const isWithinRadius = distance <= radius;
      // console.log(`   🎯 Within radius: ${isWithinRadius}`);

      return isWithinRadius;
    } catch (error) {
      console.error(`   ❌ Error in isViewerInGeofence:`, error.message);
      return false;
    }
  }

  // Add this new method to get user location with fallback
  async getUserLocationWithFallback(userId) {
    try {
      // First try cached location
      let location = await this.locationService.getCachedUserLocation(userId);

      if (!location) {
        // console.log(
        //   `   🔍 No cached location for ${userId}, checking database...`
        // );

        // Fallback to database query
        const userLocation = await this.locationService.getUserLocationFromDB(
          userId
        );
        if (userLocation) {
          location = {
            latitude: userLocation.location.coordinates[1],
            longitude: userLocation.location.coordinates[0],
            last_updated: userLocation.last_updated,
            last_seen: userLocation.last_seen,
            accuracy: userLocation.accuracy,
          };

          // Cache the location for future use
          await this.locationService.cacheUserLocation(userId, userLocation);
          // console.log(
          //   `   💾 Retrieved and cached location from DB for ${userId}`
          // );
        }
      }

      return location;
    } catch (error) {
      console.error(
        `   ❌ Error getting location for ${userId}:`,
        error.message
      );
      return null;
    }
  }

  // Placeholder for friendship check
  async areConnected(viewerId, profileOwnerId) {
    // console.log(
    //   `   🔍 Checking connection between ${viewerId} and ${profileOwnerId}`
    // );

    // TODO: Implement actual friendship/connection check

    return false;
  }

  // Quick incognito mode toggle
  async toggleIncognitoMode(userId, enabled) {
    await this.locationService.toggleIncognitoMode(userId, enabled);

    return {
      incognito_mode: enabled,
      location_sharing_enabled: !enabled,
      message: `Incognito mode ${enabled ? "enabled" : "disabled"}`,
    };
  }

  // Get privacy settings from MySQL
  async getPrivacySettings(userId) {
    const settings = await getPrivacySettingsModel(userId);

    if (!settings) {
      return await this.createDefaultPrivacySettings(userId);
    }

    return settings;
  }

  // Update privacy settings in MySQL
  async updatePrivacySettings(userId, updateData) {
    // Ensure consistent field naming
    if (updateData.visibility_radius && !updateData.custom_radius) {
      updateData.custom_radius = updateData.visibility_radius;
    }
    if (updateData.custom_radius && !updateData.visibility_radius) {
      updateData.visibility_radius = updateData.custom_radius;
    }

    const settings = await updatePrivacySettingsModel(userId, updateData);

    // Clear cache
    await redisClient.del(`user_privacy:${userId}`);

    return settings;
  }

  // Create default privacy settings in MySQL
  async createDefaultPrivacySettings(userId) {
    const defaultSettings = this.getDefaultPrivacySettings();
    return await updatePrivacySettingsModel(userId, defaultSettings);
  }

  // Validate privacy settings
  validatePrivacySettings(settings) {
    const validModes = ["public", "geofenced", "private", "friends_only"];

    if (
      settings.profile_visibility &&
      !validModes.includes(settings.profile_visibility)
    ) {
      throw new Error("Invalid profile visibility mode");
    }

    const radius = settings.visibility_radius || settings.custom_radius;
    if (radius && (radius < 10 || radius > 5000)) {
      throw new Error("Visibility radius must be between 10 and 5000 meters");
    }

    return true;
  }
}
