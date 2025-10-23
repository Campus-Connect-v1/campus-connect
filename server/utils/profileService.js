// services/ProfileService.js
import { findById } from "../models/user.model.js";
import { PrivacyService } from "./privacyService.js";
import { LocationService } from "./locationService.js";

const privacyService = new PrivacyService();
const locationService = new LocationService();

export class ProfileService {
  // Batch get filtered profiles
  async batchGetFilteredProfiles(profileOwnerIds, viewerId) {
    if (!profileOwnerIds.length) return [];

    // Batch privacy check
    const privacyResults = await privacyService.batchCanViewProfile(
      viewerId,
      profileOwnerIds
    );

    const visibleUserIds = Object.keys(privacyResults).filter(
      (userId) => privacyResults[userId]
    );

    // Batch fetch user data from MySQL
    const users = await this.batchGetUsers(visibleUserIds);

    const profiles = [];
    for (const user of users) {
      const profile = await this.buildFilteredProfile(user, viewerId);
      if (profile) {
        // Add campus context
        const building = await locationService.getUserBuilding(user.user_id);
        if (building) {
          profile.building = building.building_name;
          profile.area = building.building_name; // Replace generic "Nearby"
        }

        profiles.push(profile);
      }
    }

    return profiles;
  }

  // Enhanced profile building
  async buildFilteredProfile(user, viewerId) {
    const privacySettings = await privacyService.getPrivacySettings(
      user.user_id
    );
    if (!privacySettings) return null;

    const filteredProfile = {
      user_id: user.user_id,
      university_id: user.university_id,
      online: await this.isUserOnline(user.user_id),
      last_seen: await this.getLastSeen(user.user_id),
    };

    // Parse visible fields
    const visibleFields = this.parseVisibleFields(
      privacySettings.visible_fields
    );

    // Add visible fields
    if (visibleFields.name) {
      filteredProfile.first_name = user.first_name;
      filteredProfile.last_name = user.last_name;
    }

    if (visibleFields.photo && user.profile_picture_url) {
      filteredProfile.profile_picture_url = user.profile_picture_url;
    }

    if (visibleFields.bio && user.bio) {
      filteredProfile.bio = user.bio;
    }

    if (visibleFields.program && user.program) {
      filteredProfile.program = user.program;
    }

    // Add location context (building name instead of coordinates)
    if (privacySettings.show_exact_location) {
      const building = await locationService.getUserBuilding(user.user_id);
      if (building) {
        filteredProfile.location_context = building.building_name;
      }
    } else {
      filteredProfile.location_context = "On Campus";
    }

    return filteredProfile;
  }

  // Check if user is currently online
  async isUserOnline(userId) {
    const location = await locationService.getCachedUserLocation(userId);
    if (!location) return false;

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(location.last_seen) > fifteenMinutesAgo;
  }

  // Get user's last seen timestamp
  async getLastSeen(userId) {
    const location = await locationService.getCachedUserLocation(userId);
    return location ? location.last_seen : null;
  }
}
