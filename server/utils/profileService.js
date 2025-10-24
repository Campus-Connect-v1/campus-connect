// utils/profileService.js

import { findById } from "../models/user.model.js";
import { PrivacyService } from "./privacyService.js";
import { LocationService } from "./locationService.js";

const privacyService = new PrivacyService();
const locationService = new LocationService();

export class ProfileService {
  async batchGetUsers(userIds) {
    try {
      const users = [];

      for (const userId of userIds) {
        try {
          const user = await findById(userId);
          if (user) {
            users.push(user);
          } else {
            console.log(`⚠️ User ${userId} not found in database`);
          }
        } catch (error) {
          console.log(`⚠️ Error fetching user ${userId}:`, error.message);
        }
      }

      return users;
    } catch (error) {
      console.error("❌ Error in batchGetUsers:", error);
      return [];
    }
  }

  parseVisibleFields(visibleFields) {
    if (!visibleFields) {
      return {
        name: true,
        photo: true,
        bio: true,
        program: true,
        courses: false,
        contact: false,
      };
    }

    if (typeof visibleFields === "object") {
      return visibleFields;
    }

    try {
      return JSON.parse(visibleFields);
    } catch (error) {
      console.error("Error parsing visible fields:", error);
      return {
        name: true,
        photo: true,
        bio: true,
        program: true,
        courses: false,
        contact: false,
      };
    }
  }

  // Batch get filtered profiles
  async batchGetFilteredProfiles(profileOwnerIds, viewerId) {
    if (!profileOwnerIds || !profileOwnerIds.length) {
      console.log("❌ No profile owner IDs provided");
      return [];
    }

    // console.log(
    //   `🔍 Processing ${profileOwnerIds.length} users for viewer ${viewerId}`
    // );

    try {
      // Batch privacy check
      const privacyResults = await privacyService.batchCanViewProfile(
        viewerId,
        profileOwnerIds
      );

      const visibleUserIds = Object.keys(privacyResults).filter(
        (userId) => privacyResults[userId]
      );

      console.log(`👥 Users visible to viewer: ${visibleUserIds.length}`);

      if (visibleUserIds.length === 0) {
        return [];
      }

      // Batch fetch user data from MySQL
      const users = await this.batchGetUsers(visibleUserIds);
      console.log(`📊 MySQL users found: ${users.length}`);

      const profiles = [];

      // Process each user with error handling
      for (const user of users) {
        try {
          const profile = await this.buildFilteredProfile(user, viewerId);
          if (profile) {
            // Add campus context
            const building = await locationService.getUserBuilding(
              user.user_id
            );
            if (building) {
              profile.building = building.building_name;
              profile.area = building.building_name;
            }
            profiles.push(profile);
          }
        } catch (error) {
          console.error(
            `⚠️ Error processing user ${user.user_id}:`,
            error.message
          );
          continue;
        }
      }

      console.log(`🎯 Final profiles returned: ${profiles.length}`);
      return profiles;
    } catch (error) {
      console.error("❌ Error in batchGetFilteredProfiles:", error);
      return [];
    }
  }

  // Enhanced profile building
  async buildFilteredProfile(user, viewerId) {
    try {
      if (!user || !user.user_id) {
        console.log(`⚠️ Invalid user data received`);
        return null;
      }

      console.log(`🔧 Building profile for user ${user.user_id}`);

      const privacySettings = await privacyService.getPrivacySettings(
        user.user_id
      );
      if (!privacySettings) {
        console.log(`❌ No privacy settings for user ${user.user_id}`);
        return null;
      }

      // Create base profile
      const filteredProfile = {
        user_id: user.user_id,
        university_id: user.university_id || "",
        online: await this.isUserOnline(user.user_id),
        last_seen: await this.getLastSeen(user.user_id),
      };

      // Parse visible fields
      const visibleFields = this.parseVisibleFields(
        privacySettings.visible_fields
      );

      // Add visible fields with null checks
      if (visibleFields.name) {
        filteredProfile.first_name = user.first_name || "";
        filteredProfile.last_name = user.last_name || "";
        filteredProfile.display_name = `${user.first_name || ""} ${
          user.last_name || ""
        }`.trim();
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

      // Add location context
      if (privacySettings.show_exact_location) {
        const building = await locationService.getUserBuilding(user.user_id);
        if (building) {
          filteredProfile.location_context = building.building_name;
        } else {
          filteredProfile.location_context = "On Campus";
        }
      } else {
        filteredProfile.location_context = "On Campus";
      }

      console.log(
        `✅ Successfully built profile for ${filteredProfile.display_name}`
      );
      return filteredProfile;
    } catch (error) {
      console.error(
        `❌ Error building profile for user ${user?.user_id}:`,
        error
      );
      return null;
    }
  }

  // Check if user is currently online
  async isUserOnline(userId) {
    try {
      const location = await locationService.getCachedUserLocation(userId);
      if (!location) return false;

      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const lastSeen = new Date(location.last_seen);
      return lastSeen > fifteenMinutesAgo;
    } catch (error) {
      console.error(`Error checking online status for ${userId}:`, error);
      return false;
    }
  }

  // Get user's last seen timestamp
  async getLastSeen(userId) {
    try {
      const location = await locationService.getCachedUserLocation(userId);
      return location ? location.last_seen : new Date();
    } catch (error) {
      console.error(`Error getting last seen for ${userId}:`, error);
      return new Date();
    }
  }
}
