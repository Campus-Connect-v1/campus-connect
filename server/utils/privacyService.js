// services/PrivacyService.js
import {
  getPrivacySettingsModel,
  updatePrivacySettingsModel,
} from "../models/user.model.js";
import redisClient from "../config/redis.js";

export class PrivacyService {
  // Batch check privacy for multiple users at once
  async batchCanViewProfile(viewerId, profileOwnerIds) {
    if (!profileOwnerIds.length) return {};

    const cacheKey = `privacy_batch:${viewerId}:${profileOwnerIds
      .sort()
      .join("_")}`;

    // Check Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const results = {};
    const privacySettingsMap = await this.batchGetPrivacySettings(
      profileOwnerIds
    );

    for (const profileOwnerId of profileOwnerIds) {
      const settings = privacySettingsMap[profileOwnerId];
      results[profileOwnerId] = await this.evaluatePrivacyAccess(
        viewerId,
        profileOwnerId,
        settings
      );
    }

    // Cache batch results for 1 minute
    await redisClient.setex(cacheKey, 60, JSON.stringify(results));

    return results;
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
          300, // 5 minutes
          JSON.stringify(settings)
        );
        settingsMap[userId] = settings;
      }
    }

    // Combine cached and newly fetched settings
    return { ...cachedSettings, ...settingsMap };
  }

  // Enhanced privacy evaluation with campus context
  async evaluatePrivacyAccess(viewerId, profileOwnerId, privacySettings) {
    if (!privacySettings) return false;

    switch (privacySettings.profile_visibility) {
      case "public":
        return true;

      case "private":
        return false;

      case "geofenced":
        const locationService = new LocationService();
        const distance = await locationService.calculateDistance(
          viewerId,
          profileOwnerId
        );
        return distance <= privacySettings.custom_radius;

      case "friends_only":
        return await this.areConnected(viewerId, profileOwnerId);

      default:
        return false;
    }
  }

  // Quick incognito mode toggle
  async toggleIncognitoMode(userId, enabled) {
    const locationService = new LocationService();
    await locationService.toggleIncognitoMode(userId, enabled);

    return {
      incognito_mode: enabled,
      location_sharing_enabled: !enabled,
      message: `Incognito mode ${enabled ? "enabled" : "disabled"}`,
    };
  }

  // Get privacy settings from MySQL
  async getPrivacySettings(userId) {
    // Use your existing MySQL model function
    const settings = await getPrivacySettingsModel(userId);

    if (!settings) {
      // Create default settings in MySQL
      return await this.createDefaultPrivacySettings(userId);
    }

    return settings;
  }

  // Update privacy settings in MySQL
  async updatePrivacySettings(userId, updateData) {
    // Use your existing MySQL model function
    const settings = await updatePrivacySettingsModel(userId, updateData);
    return settings;
  }

  // Create default privacy settings in MySQL
  async createDefaultPrivacySettings(userId) {
    const defaultSettings = {
      profile_visibility: "geofenced",
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

    return await updatePrivacySettingsModel(userId, defaultSettings);
  }

  // Validate privacy settings
  validatePrivacySettings(settings) {
    const validModes = ["public", "geofenced", "private", "friends_only"];

    if (!validModes.includes(settings.profile_visibility)) {
      throw new Error("Invalid profile visibility mode");
    }

    if (settings.custom_radius < 10 || settings.custom_radius > 5000) {
      throw new Error("Custom radius must be between 10 and 5000 meters");
    }

    return true;
  }
}
