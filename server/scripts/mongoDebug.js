// scripts/debugApiFlowComplete.js
import mongoose from "mongoose";
import { UserLocation } from "../models/location.js";
import { ProfileService } from "../utils/profileService.js";
import { PrivacyService } from "../utils/privacyService.js";
import { findById } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

async function debugApiFlowComplete() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔍 COMPLETE API FLOW DEBUG\n");

    const userId = "user_1";
    const radius = 500;

    // Step 1: Test LocationService (MongoDB)
    console.log("1. 🎯 LOCATION SERVICE (MongoDB)");
    console.log("─".repeat(40));

    const LocationService = (await import("../utils/locationService.js"))
      .LocationService;
    const locationService = new LocationService();

    const nearbyUsers = await locationService.findNearbyUsers(userId, radius);
    console.log(`✅ Found ${nearbyUsers.length} users in MongoDB`);

    const nearbyUserIds = nearbyUsers.map((user) => user.user_id);
    console.log(
      `User IDs: ${nearbyUserIds.slice(0, 10).join(", ")}${
        nearbyUserIds.length > 10 ? "..." : ""
      }`
    );

    // Step 2: Test ProfileService with each user
    console.log("\n2. 👤 PROFILE SERVICE DEBUG");
    console.log("─".repeat(40));

    const profileService = new ProfileService();
    const privacyService = new PrivacyService();

    let profilesFound = 0;
    let profilesFailed = 0;

    for (const userId of nearbyUserIds.slice(0, 10)) {
      // Test first 10 users
      try {
        console.log(`\n🔍 Testing ${userId}:`);

        // Check MySQL user data
        const mysqlUser = await findById(userId);
        console.log(`   MySQL: ${mysqlUser ? "FOUND" : "MISSING"}`);

        if (mysqlUser) {
          // Check privacy settings
          const privacySettings = await privacyService.getPrivacySettings(
            userId
          );
          console.log(`   Privacy: ${privacySettings ? "EXISTS" : "MISSING"}`);

          if (privacySettings) {
            // Test individual profile building
            const profile = await profileService.buildFilteredProfile(
              mysqlUser,
              "user_1"
            );
            console.log(`   Profile: ${profile ? "SUCCESS" : "FAILED (null)"}`);

            if (profile) {
              profilesFound++;
            } else {
              profilesFailed++;
            }
          } else {
            console.log(`   ❌ No privacy settings for ${userId}`);
            profilesFailed++;
          }
        } else {
          console.log(`   ❌ No MySQL data for ${userId}`);
          profilesFailed++;
        }
      } catch (error) {
        console.log(`   ❌ Error with ${userId}: ${error.message}`);
        profilesFailed++;
      }
    }

    // Step 3: Test batch profile retrieval
    console.log("\n3. 🔄 BATCH PROFILE RETRIEVAL");
    console.log("─".repeat(40));

    const visibleProfiles = await profileService.batchGetFilteredProfiles(
      nearbyUserIds,
      userId
    );
    console.log(
      `✅ ProfileService returned: ${visibleProfiles.length} profiles`
    );

    if (visibleProfiles.length === 0) {
      console.log("❌ ROOT CAUSE: ProfileService returned 0 profiles!");
      console.log("This explains why API returns 'No nearby profiles found'");
    } else {
      console.log("✅ Profiles found:");
      visibleProfiles.slice(0, 5).forEach((profile) => {
        console.log(
          `   • ${profile.user_id}: ${profile.first_name} ${profile.last_name}`
        );
      });
    }

    // Step 4: Test the complete controller flow
    console.log("\n4. 🚀 COMPLETE CONTROLLER FLOW");
    console.log("─".repeat(40));

    const enhancedProfiles = visibleProfiles.map((profile) => {
      const nearbyUser = nearbyUsers.find((u) => u.user_id === profile.user_id);
      return {
        ...profile,
        distance: nearbyUser?.distance,
        accuracy: nearbyUser?.accuracy,
        last_seen: profile.last_seen || nearbyUser?.last_seen,
      };
    });

    console.log(`✅ Final enhanced profiles: ${enhancedProfiles.length}`);

    if (enhancedProfiles.length === 0) {
      console.log("\n🎯 FINAL DIAGNOSIS:");
      console.log(
        "MongoDB finds users → ProfileService returns 0 profiles → API shows 'No nearby profiles found'"
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n📡 MongoDB connection closed");
  }
}

debugApiFlowComplete();
