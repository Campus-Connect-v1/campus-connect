// scripts/debugProfileServiceFlow.js
import mongoose from "mongoose";
import { ProfileService } from "../utils/profileService.js";
import { PrivacyService } from "../utils/privacyService.js";
import { findById } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

async function debugProfileServiceFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔍 DEBUGGING PROFILE SERVICE FLOW\n");

    const profileService = new ProfileService();
    const privacyService = new PrivacyService();

    // Test with a few users that should work
    const testUserIds = ["user_2", "user_3", "user_4", "user_5"];

    console.log("1. 🧪 TESTING INDIVIDUAL PROFILE BUILDING");
    console.log("─".repeat(50));

    for (const userId of testUserIds) {
      try {
        console.log(`\n🔍 Testing ${userId}:`);

        // Get MySQL user
        const mysqlUser = await findById(userId);
        console.log(
          `   ✅ MySQL user found: ${mysqlUser.first_name} ${mysqlUser.last_name}`
        );

        // Get privacy settings
        const privacySettings = await privacyService.getPrivacySettings(userId);
        console.log(
          `   ✅ Privacy settings: ${privacySettings ? "EXISTS" : "MISSING"}`
        );

        if (privacySettings) {
          console.log(
            `   📊 Visibility: ${privacySettings.profile_visibility}`
          );
          console.log(`   📏 Radius: ${privacySettings.custom_radius}m`);
        }

        // Test buildFilteredProfile
        const profile = await profileService.buildFilteredProfile(
          mysqlUser,
          "user_1"
        );
        console.log(`   🎯 Profile result: ${profile ? "SUCCESS" : "NULL"}`);

        if (profile) {
          console.log(`      - User ID: ${profile.user_id}`);
          console.log(
            `      - Name: ${profile.first_name} ${profile.last_name}`
          );
          console.log(`      - Fields: ${Object.keys(profile).join(", ")}`);
        } else {
          console.log(`      ❌ Profile is NULL - this is the problem!`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
      }
    }

    // Test batch method
    console.log("\n2. 🔄 TESTING BATCH PROFILE RETRIEVAL");
    console.log("─".repeat(50));

    const batchProfiles = await profileService.batchGetFilteredProfiles(
      testUserIds,
      "user_1"
    );
    console.log(`✅ Batch method returned: ${batchProfiles.length} profiles`);

    if (batchProfiles.length === 0) {
      console.log("❌ BATCH METHOD RETURNED 0 PROFILES!");
      console.log("This is why your API shows 'No nearby profiles found'");
    } else {
      console.log("✅ Batch profiles:");
      batchProfiles.forEach((profile) => {
        console.log(
          `   • ${profile.user_id}: ${profile.first_name} ${profile.last_name}`
        );
      });
    }

    // Test what happens in the controller
    console.log("\n3. 🎯 TESTING COMPLETE CONTROLLER LOGIC");
    console.log("─".repeat(50));

    const nearbyUserIds = ["user_2", "user_3", "user_4", "user_5"];
    const visibleProfiles = await profileService.batchGetFilteredProfiles(
      nearbyUserIds,
      "user_1"
    );

    const enhancedProfiles = visibleProfiles.map((profile) => {
      // Simulate what the controller does
      return {
        ...profile,
        distance: 50, // Mock distance
        accuracy: 15, // Mock accuracy
        last_seen: new Date(),
      };
    });

    console.log(`✅ Final enhanced profiles: ${enhancedProfiles.length}`);

    if (enhancedProfiles.length === 0) {
      console.log("🎯 ROOT CAUSE IDENTIFIED:");
      console.log(
        "ProfileService.batchGetFilteredProfiles() is returning empty array"
      );
      console.log(
        "Check the buildFilteredProfile method - it's likely returning null"
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

debugProfileServiceFlow();
