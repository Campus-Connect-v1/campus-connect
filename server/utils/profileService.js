// services/ProfileService.js
import { findById } from "../models/user.model.js"; // Your existing MySQL model
import { PrivacyService } from "./privacyService.js";

const privacyService = new PrivacyService();

export class ProfileService {
  // Get filtered profile combining MySQL user data and privacy settings
  async getFilteredProfile(profileOwnerId, viewerId) {
    // Get user data from MySQL
    const user = await findById(profileOwnerId);

    if (!user) {
      return null;
    }

    // Get privacy settings from MySQL
    const privacySettings = await privacyService.getPrivacySettings(
      profileOwnerId
    );

    if (!privacySettings) {
      return null;
    }

    const filteredProfile = {
      user_id: profileOwnerId,
      university_id: user.university_id, // Always include basic reference
    };

    // Parse visible fields from JSON string (if stored as string in MySQL)
    let visibleFields;
    try {
      visibleFields =
        typeof privacySettings.visible_fields === "string"
          ? JSON.parse(privacySettings.visible_fields)
          : privacySettings.visible_fields;
    } catch (error) {
      visibleFields = {
        name: true,
        photo: true,
        bio: true,
        program: true,
        courses: false,
        contact: false,
      };
    }

    // Only include fields allowed by privacy settings
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

    if (visibleFields.courses) {
      // You can add courses logic here
    }

    // Add approximate location context
    if (privacySettings.show_exact_location) {
      const locationService = new LocationService();
      const location = await locationService.getUserLocation(profileOwnerId);
      if (location) {
        filteredProfile.location = location.coordinates;
      }
    } else {
      filteredProfile.area = "Nearby";
    }

    return filteredProfile;
  }
}
