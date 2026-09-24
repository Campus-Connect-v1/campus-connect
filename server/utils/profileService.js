// utils/profileService.js

import { findById } from "../models/user.model.js";
import { PrivacyService } from "./privacyService.js";
import { LocationService } from "./locationService.js";
import { findByIds } from "../models/location.model.js";
const privacyService = new PrivacyService();
const locationService = new LocationService();

export class ProfileService {
  async batchGetUsers(userIds) {
    try {
      // const users = []; // optimization below
      if (!userIds.length) return [];
      const users = await findByIds(userIds); // You'll need to implement this
      const userMap = {};
      users.forEach((user) => {
        userMap[user.user_id] = user;
      });
      return userIds.map((id) => userMap[id]).filter((user) => user);

      //code below is unreachable, fr good reasons.
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

      // Batch fetch user data from MySQL, and privacy settings once here so
      // buildFilteredProfile below doesn't re-fetch identical settings per user.
      const [users, privacySettingsMap] = await Promise.all([
        this.batchGetUsers(visibleUserIds),
        privacyService.batchGetPrivacySettings(visibleUserIds),
      ]);
      console.log(`📊 MySQL users found: ${users.length}`);

      // Process every user in parallel instead of one at a time -- each user
      // here does 3-4 independent awaits (privacy settings, location,
      // building), so serializing the loop meant total latency scaled
      // linearly with the number of nearby users.
      const profiles = (
        await Promise.all(
          users.map(async (user) => {
            try {
              const privacySettings = privacySettingsMap[user.user_id];
              // Fetch the building once and hand it to buildFilteredProfile,
              // which previously fetched it again itself when
              // show_exact_location was set.
              const building = await locationService.getUserBuilding(
                user.user_id
              );
              const profile = await this.buildFilteredProfile(
                user,
                viewerId,
                privacySettings,
                building
              );
              if (!profile) return null;

              if (building) {
                profile.building = building.building_name;
                profile.area = building.building_name;
              }
              return profile;
            } catch (error) {
              console.error(
                `⚠️ Error processing user ${user.user_id}:`,
                error.message
              );
              return null;
            }
          })
        )
      ).filter(Boolean);

      console.log(`🎯 Final profiles returned: ${profiles.length}`);
      return profiles;
    } catch (error) {
      console.error("❌ Error in batchGetFilteredProfiles:", error);
      return [];
    }
  }

  // Enhanced profile building.
  //
  // `privacySettings` and `building` are optional: batchGetFilteredProfiles
  // (the hot path) fetches them once for the whole batch and passes them in
  // to avoid re-fetching identical data per user. Callers that build a single
  // profile in isolation (debug scripts, tests) can omit them and this falls
  // back to fetching them itself.
  async buildFilteredProfile(user, viewerId, privacySettings, building) {
    try {
      if (!user || !user.user_id) {
        console.log(`⚠️ Invalid user data received`);
        return null;
      }

      // console.log(`🔧 Building profile for user ${user.user_id}`);

      if (privacySettings === undefined) {
        privacySettings = await privacyService.getPrivacySettings(
          user.user_id
        );
      }
      if (!privacySettings) {
        // console.log(`❌ No privacy settings for user ${user.user_id}`);
        return null;
      }

      // Online status and last-seen both derive from the same cached
      // location record -- fetch it once instead of twice.
      const location = await locationService.getCachedUserLocation(
        user.user_id
      );
      const filteredProfile = {
        user_id: user.user_id,
        university_id: user.university_id || "",
        online: this.isOnlineFromLocation(location),
        last_seen: location ? location.last_seen : new Date(),
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
        // Use the pre-fetched building when the caller supplied one;
        // otherwise (single-profile callers) fetch it here.
        const resolvedBuilding =
          building !== undefined
            ? building
            : await locationService.getUserBuilding(user.user_id);
        filteredProfile.location_context = resolvedBuilding
          ? resolvedBuilding.building_name
          : "On Campus";
      } else {
        filteredProfile.location_context = "On Campus";
      }

      // console.log(
      //   `✅ Successfully built profile for ${filteredProfile.display_name}`
      // );
      return filteredProfile;
    } catch (error) {
      console.error(
        `❌ Error building profile for user ${user?.user_id}:`,
        error
      );
      return null;
    }
  }

  // Derive online status from an already-fetched cached location record,
  // shared by isUserOnline and the buildFilteredProfile hot path so neither
  // has to re-fetch the same Redis key.
  isOnlineFromLocation(location) {
    if (!location) return false;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(location.last_seen) > fifteenMinutesAgo;
  }

  // Check if user is currently online
  async isUserOnline(userId) {
    try {
      const location = await locationService.getCachedUserLocation(userId);
      return this.isOnlineFromLocation(location);
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
