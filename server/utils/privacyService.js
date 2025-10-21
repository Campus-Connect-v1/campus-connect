// services/PrivacyService.js
import {
  getPrivacySettingsModel,
  updatePrivacySettingsModel,
} from "../models/user.model.js"; // Your existing MySQL models

export class PrivacyService {
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

  // Check if viewer can see profile based on MySQL privacy settings
  async canViewProfile(viewerId, profileOwnerId) {
    const privacySettings = await this.getPrivacySettings(profileOwnerId);

    if (!privacySettings) {
      return false;
    }

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

  // Check if users are connected (from your MySQL connections table)
  async areConnected(userId1, userId2) {
    // Use your existing MySQL connection check
    const connection = await checkExistingConnectionModel(userId1, userId2);
    return connection && connection.status === "accepted";
  }
}
