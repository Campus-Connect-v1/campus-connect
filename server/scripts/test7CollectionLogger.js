// scripts/logMongoCollection.js
import mongoose from "mongoose";
import { UserLocation } from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();

async function logMongoCollection() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/your_database"
    );
    console.log("📡 Connected to MongoDB\n");

    // Get all documents using Mongoose
    console.log("📄 ALL DOCUMENTS IN COLLECTION:");
    console.log("═".repeat(50));

    const allDocuments = await UserLocation.find({}).lean();

    if (allDocuments.length === 0) {
      console.log("❌ No documents found in collection");
      return;
    }

    console.log(`Total documents: ${allDocuments.length}\n`);

    allDocuments.forEach((doc, index) => {
      console.log(`📋 DOCUMENT ${index + 1}/${allDocuments.length}:`);
      console.log("─".repeat(40));

      // Pretty print each document
      Object.keys(doc).forEach((key) => {
        if (key === "location" && doc[key] && doc[key].coordinates) {
          console.log(`  ${key}:`);
          console.log(`    type: ${doc[key].type}`);
          console.log(
            `    coordinates: [${doc[key].coordinates[0]}, ${doc[key].coordinates[1]}]`
          );
        } else if (key === "_id") {
          console.log(`  ${key}: ${doc[key]}`);
        } else if (key === "__v") {
          // Skip version key
        } else {
          console.log(`  ${key}: ${doc[key]}`);
        }
      });
      console.log(""); // Empty line between documents
    });

    // Summary of users and their status
    console.log("\n👥 USER SUMMARY:");
    console.log("═".repeat(50));

    const activeUsers = allDocuments.filter((doc) => doc.is_active === true);
    const sharingUsers = allDocuments.filter(
      (doc) => doc.location_sharing_enabled === true
    );
    const activeAndSharing = allDocuments.filter(
      (doc) => doc.is_active === true && doc.location_sharing_enabled === true
    );

    console.log(`Total users: ${allDocuments.length}`);
    console.log(`Active users: ${activeUsers.length}`);
    console.log(`Location sharing enabled: ${sharingUsers.length}`);
    console.log(`Active AND sharing: ${activeAndSharing.length}`);
    console.log("");

    // Show coordinates for debugging geospatial queries
    console.log("📍 COORDINATES FOR GEOSPATIAL DEBUGGING:");
    console.log("═".repeat(50));

    allDocuments.forEach((doc) => {
      if (doc.location && doc.location.coordinates) {
        const status =
          doc.is_active && doc.location_sharing_enabled
            ? "🟢 VISIBLE"
            : "🔴 HIDDEN";
        console.log(
          `${status} - ${doc.user_id}: [${doc.location.coordinates[0]}, ${doc.location.coordinates[1]}]`
        );
      }
    });

    // Test geospatial query
    console.log("\n🎯 TESTING GEOSPATIAL QUERY:");
    console.log("═".repeat(50));

    const user1 = allDocuments.find((doc) => doc.user_id === "user_1");
    if (user1) {
      console.log(
        `Searching for users near user_1 at: [${user1.location.coordinates[0]}, ${user1.location.coordinates[1]}]`
      );

      const nearbyUsers = await UserLocation.aggregate([
        {
          $geoNear: {
            near: user1.location,
            distanceField: "distance",
            maxDistance: 500, // 500 meters
            spherical: true,
            query: {
              user_id: { $ne: "user_1" },
              location_sharing_enabled: true,
              is_active: true,
            },
          },
        },
      ]);

      console.log(`Found ${nearbyUsers.length} nearby users:`);
      nearbyUsers.forEach((user) => {
        console.log(`  • ${user.user_id}: ${Math.round(user.distance)}m away`);
      });

      if (nearbyUsers.length === 0) {
        console.log("\n🔍 Why no users found?");
        const potentialUsers = allDocuments.filter(
          (doc) =>
            doc.user_id !== "user_1" &&
            doc.location_sharing_enabled === true &&
            doc.is_active === true
        );
        console.log(
          `There are ${potentialUsers.length} users that should be visible:`
        );
        potentialUsers.forEach((user) => {
          console.log(`  - ${user.user_id}`);
        });
      }
    } else {
      console.log("❌ user_1 not found in collection");
    }
  } catch (error) {
    console.error("❌ Error logging collection:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n📡 MongoDB connection closed");
  }
}

// Run the script
logMongoCollection();

/*


📡 Connected to MongoDB

📄 ALL DOCUMENTS IN COLLECTION:
══════════════════════════════════════════════════
Total documents: 34

📋 DOCUMENT 1/34:
────────────────────────────────────────
  _id: 68f9ec277078236c4de7a759
  user_id: user_1
  location:
    type: Point
    coordinates: [-122.1697, 37.4275]
  accuracy: 50
  last_updated: Thu Oct 23 2025 16:59:39 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 500
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 16:59:39 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 2/34:
────────────────────────────────────────
  _id: 68f9ec277078236c4de7a75a
  user_id: user_2
  location:
    type: Point
    coordinates: [-122.17, 37.4277]
  accuracy: 6
  last_updated: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 3/34:
────────────────────────────────────────
  _id: 68f9ec277078236c4de7a75b
  user_id: user_3
  location:
    type: Point
    coordinates: [-122.17020000000001, 37.4277]
  accuracy: 6
  last_updated: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 4/34:
────────────────────────────────────────
  _id: 68f9ec277078236c4de7a75c
  user_id: user_4
  location:
    type: Point
    coordinates: [-122.16980000000001, 37.4278]
  accuracy: 7
  last_updated: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 5/34:
────────────────────────────────────────
  _id: 68f9ec277078236c4de7a75d
  user_id: user_5
  location:
    type: Point
    coordinates: [-122.17030000000001, 37.4279]
  accuracy: 17
  last_updated: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 6/34:
────────────────────────────────────────
  _id: 68f9ec277078236c4de7a75e
  user_id: b171c38c-68a4-4300-ad40-0108f10992d3
  location:
    type: Point
    coordinates: [-122.1601, 37.4326]
  accuracy: 15
  last_updated: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 08:49:43 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 7/34:
────────────────────────────────────────
  _id: 68f9ef47a1fc3b1c09359d43
  user_id: user_11
  location:
    type: Point
    coordinates: [-122.16965722599012, 37.428553747752545]
  accuracy: 15
  last_updated: Thu Oct 23 2025 09:03:03 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:03 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:03 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 8/34:
────────────────────────────────────────
  _id: 68f9ef48a1fc3b1c09359d46
  user_id: user_12
  location:
    type: Point
    coordinates: [-122.17072324633506, 37.42785956002598]
  accuracy: 16
  last_updated: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 9/34:
────────────────────────────────────────
  _id: 68f9ef48a1fc3b1c09359d49
  user_id: user_13
  location:
    type: Point
    coordinates: [-122.1698612485148, 37.42661962339307]
  accuracy: 6
  last_updated: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 10/34:
────────────────────────────────────────
  _id: 68f9ef48a1fc3b1c09359d4c
  user_id: user_14
  location:
    type: Point
    coordinates: [-122.17113931818953, 37.43004701037186]
  accuracy: 19
  last_updated: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:04 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 11/34:
────────────────────────────────────────
  _id: 68f9ef49a1fc3b1c09359d52
  user_id: user_15
  location:
    type: Point
    coordinates: [-122.16954686946559, 37.42693086223032]
  accuracy: 13
  last_updated: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 12/34:
────────────────────────────────────────
  _id: 68f9ef49a1fc3b1c09359d59
  user_id: user_16
  location:
    type: Point
    coordinates: [-122.16705446738966, 37.42658678817496]
  accuracy: 14
  last_updated: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 13/34:
────────────────────────────────────────
  _id: 68f9ef49a1fc3b1c09359d60
  user_id: user_17
  location:
    type: Point
    coordinates: [-122.17230311388967, 37.42647945547615]
  accuracy: 13
  last_updated: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:03:05 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 14/34:
────────────────────────────────────────
  _id: 68f9ef9c2490171cc9162e67
  user_id: user_18
  location:
    type: Point
    coordinates: [-122.16586673484663, 37.430109596797216]
  accuracy: 9
  last_updated: Thu Oct 23 2025 09:04:28 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:28 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:28 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 15/34:
────────────────────────────────────────
  _id: 68f9ef9d2490171cc9162e6a
  user_id: user_19
  location:
    type: Point
    coordinates: [-122.17256241818882, 37.42889840700563]
  accuracy: 11
  last_updated: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 500
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 16/34:
────────────────────────────────────────
  _id: 68f9ef9d2490171cc9162e6d
  user_id: user_20
  location:
    type: Point
    coordinates: [-122.17485952090252, 37.43054075032247]
  accuracy: 9
  last_updated: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 17/34:
────────────────────────────────────────
  _id: 68f9ef9d2490171cc9162e70
  user_id: user_21
  location:
    type: Point
    coordinates: [-122.17096163434522, 37.42684550492022]
  accuracy: 12
  last_updated: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:29 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 18/34:
────────────────────────────────────────
  _id: 68f9ef9e2490171cc9162e73
  user_id: user_22
  location:
    type: Point
    coordinates: [-122.16937963846765, 37.42830393077578]
  accuracy: 18
  last_updated: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 19/34:
────────────────────────────────────────
  _id: 68f9ef9e2490171cc9162e76
  user_id: user_23
  location:
    type: Point
    coordinates: [-122.16874131293392, 37.42751133913126]
  accuracy: 7
  last_updated: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 20/34:
────────────────────────────────────────
  _id: 68f9ef9e2490171cc9162e79
  user_id: user_24
  location:
    type: Point
    coordinates: [-122.17079296506552, 37.4282755694277]
  accuracy: 7
  last_updated: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:30 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 21/34:
────────────────────────────────────────
  _id: 68f9ef9f2490171cc9162e7c
  user_id: user_25
  location:
    type: Point
    coordinates: [-122.16872343617898, 37.428842948131]
  accuracy: 5
  last_updated: Thu Oct 23 2025 09:04:31 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 09:04:31 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 09:04:31 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 22/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee45
  user_id: user_near_1
  location:
    type: Point
    coordinates: [-122.1696, 37.4276]
  accuracy: 15
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 23/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee46
  user_id: user_near_2
  location:
    type: Point
    coordinates: [-122.1698, 37.4274]
  accuracy: 20
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 24/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee47
  user_id: user_medium_1
  location:
    type: Point
    coordinates: [-122.17, 37.4278]
  accuracy: 25
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 25/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee48
  user_id: user_medium_2
  location:
    type: Point
    coordinates: [-122.169, 37.427]
  accuracy: 30
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 26/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee49
  user_id: user_edge_1
  location:
    type: Point
    coordinates: [-122.165, 37.43]
  accuracy: 40
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 27/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee4a
  user_id: user_far_1
  location:
    type: Point
    coordinates: [-122.16, 37.432]
  accuracy: 50
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 28/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee4b
  user_id: user_private_1
  location:
    type: Point
    coordinates: [-122.1695, 37.4276]
  accuracy: 15
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: false
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 29/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee4c
  user_id: user_inactive_1
  location:
    type: Point
    coordinates: [-122.1697, 37.4273]
  accuracy: 20
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: false
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 30/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee4d
  user_id: user_random_1
  location:
    type: Point
    coordinates: [-122.16984074424055, 37.42861364653724]
  accuracy: 32.260040843441764
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 31/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee4e
  user_id: user_random_2
  location:
    type: Point
    coordinates: [-122.17007188628438, 37.42577855699199]
  accuracy: 24.74877894561155
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 32/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee4f
  user_id: user_random_3
  location:
    type: Point
    coordinates: [-122.1695725832621, 37.427268315475516]
  accuracy: 15.727412395134284
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: false
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 33/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee50
  user_id: user_random_4
  location:
    type: Point
    coordinates: [-122.16857599618778, 37.426837455554185]
  accuracy: 46.83168023545262
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: true
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)

📋 DOCUMENT 34/34:
────────────────────────────────────────
  _id: 68fa908c71286a11bc8dee51
  user_id: user_random_5
  location:
    type: Point
    coordinates: [-122.17008600366808, 37.4272877001061]
  accuracy: 14.937045833502376
  last_updated: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  is_active: false
  geofence_radius: 100
  location_sharing_enabled: true
  createdAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)
  updatedAt: Thu Oct 23 2025 20:31:08 GMT+0000 (Greenwich Mean Time)


👥 USER SUMMARY:
══════════════════════════════════════════════════
Total users: 34
Active users: 31
Location sharing enabled: 33
Active AND sharing: 30

📍 COORDINATES FOR GEOSPATIAL DEBUGGING:
══════════════════════════════════════════════════
🟢 VISIBLE - user_1: [-122.1697, 37.4275]
🟢 VISIBLE - user_2: [-122.17, 37.4277]
🟢 VISIBLE - user_3: [-122.17020000000001, 37.4277]
🟢 VISIBLE - user_4: [-122.16980000000001, 37.4278]
🟢 VISIBLE - user_5: [-122.17030000000001, 37.4279]
🟢 VISIBLE - b171c38c-68a4-4300-ad40-0108f10992d3: [-122.1601, 37.4326]
🟢 VISIBLE - user_11: [-122.16965722599012, 37.428553747752545]
🟢 VISIBLE - user_12: [-122.17072324633506, 37.42785956002598]
🟢 VISIBLE - user_13: [-122.1698612485148, 37.42661962339307]
🟢 VISIBLE - user_14: [-122.17113931818953, 37.43004701037186]
🟢 VISIBLE - user_15: [-122.16954686946559, 37.42693086223032]
🟢 VISIBLE - user_16: [-122.16705446738966, 37.42658678817496]
🟢 VISIBLE - user_17: [-122.17230311388967, 37.42647945547615]
🟢 VISIBLE - user_18: [-122.16586673484663, 37.430109596797216]
🟢 VISIBLE - user_19: [-122.17256241818882, 37.42889840700563]
🟢 VISIBLE - user_20: [-122.17485952090252, 37.43054075032247]
🟢 VISIBLE - user_21: [-122.17096163434522, 37.42684550492022]
🟢 VISIBLE - user_22: [-122.16937963846765, 37.42830393077578]
🟢 VISIBLE - user_23: [-122.16874131293392, 37.42751133913126]
🟢 VISIBLE - user_24: [-122.17079296506552, 37.4282755694277]
🟢 VISIBLE - user_25: [-122.16872343617898, 37.428842948131]
🟢 VISIBLE - user_near_1: [-122.1696, 37.4276]
🟢 VISIBLE - user_near_2: [-122.1698, 37.4274]
🟢 VISIBLE - user_medium_1: [-122.17, 37.4278]
🟢 VISIBLE - user_medium_2: [-122.169, 37.427]
🟢 VISIBLE - user_edge_1: [-122.165, 37.43]
🟢 VISIBLE - user_far_1: [-122.16, 37.432]
🔴 HIDDEN - user_private_1: [-122.1695, 37.4276]
🔴 HIDDEN - user_inactive_1: [-122.1697, 37.4273]
🟢 VISIBLE - user_random_1: [-122.16984074424055, 37.42861364653724]
🟢 VISIBLE - user_random_2: [-122.17007188628438, 37.42577855699199]
🔴 HIDDEN - user_random_3: [-122.1695725832621, 37.427268315475516]
🟢 VISIBLE - user_random_4: [-122.16857599618778, 37.426837455554185]
🔴 HIDDEN - user_random_5: [-122.17008600366808, 37.4272877001061]

🎯 TESTING GEOSPATIAL QUERY:
══════════════════════════════════════════════════
Searching for users near user_1 at: [-122.1697, 37.4275]
❌ Error logging collection: There is more than one 2dsphere index on test.userlocations; unsure which to use for $geoNear

📡 MongoDB connection closed

*/
