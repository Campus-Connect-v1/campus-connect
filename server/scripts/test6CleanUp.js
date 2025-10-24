// scripts/createNearbyUsers.js
import mongoose from "mongoose";
import { UserLocation } from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();
// Your existing user_1 coordinates
const CENTER_COORDINATES = {
  longitude: -122.1697,
  latitude: 37.4275,
};

class NearbyUsersCreator {
  // Generate random coordinates within radius (in meters)
  static generateRandomCoordinates(baseLon, baseLat, radiusMeters) {
    const radiusDegrees = radiusMeters / 111320; // approx meters per degree

    const randomRadius = Math.random() * radiusDegrees;
    const randomAngle = Math.random() * 2 * Math.PI;

    const lat = baseLat + randomRadius * Math.cos(randomAngle);
    const lon =
      baseLon +
      (randomRadius * Math.sin(randomAngle)) /
        Math.cos((baseLat * Math.PI) / 180);

    return [lon, lat];
  }

  // Create users at specific distances for testing
  static createTestUsers() {
    const testUsers = [];

    // Very close users (same building)
    testUsers.push({
      user_id: "user_near_1",
      location: {
        type: "Point",
        coordinates: [-122.1696, 37.4276], // ~10m away
      },
      accuracy: 15,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: true,
      is_active: true,
    });

    testUsers.push({
      user_id: "user_near_2",
      location: {
        type: "Point",
        coordinates: [-122.1698, 37.4274], // ~15m away
      },
      accuracy: 20,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: true,
      is_active: true,
    });

    // Medium distance users (same area)
    testUsers.push({
      user_id: "user_medium_1",
      location: {
        type: "Point",
        coordinates: [-122.17, 37.4278], // ~50m away
      },
      accuracy: 25,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: true,
      is_active: true,
    });

    testUsers.push({
      user_id: "user_medium_2",
      location: {
        type: "Point",
        coordinates: [-122.169, 37.427], // ~80m away
      },
      accuracy: 30,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: true,
      is_active: true,
    });

    // Edge of 500m radius
    testUsers.push({
      user_id: "user_edge_1",
      location: {
        type: "Point",
        coordinates: [-122.165, 37.43], // ~400m away
      },
      accuracy: 40,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: true,
      is_active: true,
    });

    // Just outside 500m radius (should not appear in results)
    testUsers.push({
      user_id: "user_far_1",
      location: {
        type: "Point",
        coordinates: [-122.16, 37.432], // ~800m away
      },
      accuracy: 50,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: true,
      is_active: true,
    });

    // Users with different privacy settings
    testUsers.push({
      user_id: "user_private_1",
      location: {
        type: "Point",
        coordinates: [-122.1695, 37.4276], // ~20m away
      },
      accuracy: 15,
      last_updated: new Date(),
      last_seen: new Date(),
      location_sharing_enabled: false, // Location sharing disabled
      is_active: true,
    });

    testUsers.push({
      user_id: "user_inactive_1",
      location: {
        type: "Point",
        coordinates: [-122.1697, 37.4273], // ~25m away
      },
      accuracy: 20,
      last_updated: new Date(),
      last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      location_sharing_enabled: true,
      is_active: false, // Inactive user
    });

    // Add some random users within 200m
    for (let i = 1; i <= 5; i++) {
      const [lon, lat] = this.generateRandomCoordinates(
        CENTER_COORDINATES.longitude,
        CENTER_COORDINATES.latitude,
        200
      );

      testUsers.push({
        user_id: `user_random_${i}`,
        location: {
          type: "Point",
          coordinates: [lon, lat],
        },
        accuracy: 10 + Math.random() * 40,
        last_updated: new Date(),
        last_seen: new Date(),
        location_sharing_enabled: Math.random() > 0.2, // 80% sharing enabled
        is_active: Math.random() > 0.1, // 90% active
      });
    }

    return testUsers;
  }

  static async insertTestUsers() {
    try {
      console.log("🗑️ Cleaning up existing test users...");
      await UserLocation.deleteMany({
        user_id: {
          $in: [
            "user_near_1",
            "user_near_2",
            "user_medium_1",
            "user_medium_2",
            "user_edge_1",
            "user_far_1",
            "user_private_1",
            "user_inactive_1",
            /user_random_/,
          ],
        },
      });

      console.log("👥 Creating test users around user_1...");
      const testUsers = this.createTestUsers();

      await UserLocation.insertMany(testUsers);

      console.log(`✅ Created ${testUsers.length} test users around user_1`);

      // Show summary
      const activeSharing = testUsers.filter(
        (u) => u.location_sharing_enabled && u.is_active
      ).length;

      const inactive = testUsers.filter((u) => !u.is_active).length;
      const privateUsers = testUsers.filter(
        (u) => !u.location_sharing_enabled
      ).length;

      console.log("\n📊 Test Users Summary:");
      console.log("─".repeat(30));
      console.log(`🟢 Active & sharing: ${activeSharing} users`);
      console.log(`🔴 Inactive: ${inactive} users`);
      console.log(`🔒 Private (no sharing): ${privateUsers} users`);
      console.log(`📍 All within 500m of user_1 (except user_far_1)`);

      return testUsers;
    } catch (error) {
      console.error("❌ Error creating test users:", error);
      throw error;
    }
  }

  static async verifySetup() {
    try {
      console.log("\n🔍 Verifying setup...");

      // Check user_1 exists
      const mainUser = await UserLocation.findOne({ user_id: "user_1" });
      if (!mainUser) {
        console.log("❌ user_1 not found in database");
        return;
      }

      console.log("✅ user_1 found at:", mainUser.location.coordinates);

      // Count nearby users that should be visible
      const visibleUsers = await UserLocation.find({
        user_id: { $ne: "user_1" },
        location_sharing_enabled: true,
        is_active: true,
      });

      console.log(
        `✅ ${visibleUsers.length} users with location sharing enabled and active`
      );

      // Test the nearby query directly
      const LocationService = (await import("../utils/locationService.js"))
        .LocationService;
      const locationService = new LocationService();

      console.log("\n🧪 Testing nearby users query...");
      const nearbyUsers = await locationService.findNearbyUsers("user_1", 500);

      console.log(`📡 Found ${nearbyUsers.length} users within 500m of user_1`);

      if (nearbyUsers.length > 0) {
        console.log("\n👤 Nearby users:");
        nearbyUsers.slice(0, 5).forEach((user) => {
          console.log(
            `   • ${user.user_id}: ${Math.round(user.distance)}m away`
          );
        });

        if (nearbyUsers.length > 5) {
          console.log(`   ... and ${nearbyUsers.length - 5} more`);
        }
      }
    } catch (error) {
      console.error("❌ Verification failed:", error);
    }
  }
}

// Run the script
async function main() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/your_database"
    );
    console.log("📡 Connected to MongoDB\n");

    await NearbyUsersCreator.insertTestUsers();
    await NearbyUsersCreator.verifySetup();

    console.log("\n🎉 Setup completed! Now test your API endpoint:");
    console.log("GET /api/geofencing/nearby?radius=500");
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n📡 MongoDB connection closed");
  }
}

// Calculate distance between two points for verification
function calculateDistance(lon1, lat1, lon2, lat2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

main();
