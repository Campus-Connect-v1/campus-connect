// scripts/test3.js
// to implode the db and remove all duplicate indexes

import mongoose from "mongoose";
import { UserLocation } from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();

async function nuclearCleanupAndLoad() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // NUCLEAR OPTION: Remove ALL 2dsphere indexes and create ONE clean one
    console.log("💥 NUCLEAR CLEANUP: Removing ALL 2dsphere indexes...");
    const collection = mongoose.connection.db.collection("userlocations");

    // Get all current indexes
    const indexes = await collection.indexes();
    console.log("📋 Current indexes:");
    indexes.forEach((index) => console.log(`   - ${index.name}:`, index.key));

    // Remove ALL 2dsphere indexes
    const indexesToRemove = indexes
      .filter((index) =>
        Object.values(index.key).some((value) => value === "2dsphere")
      )
      .map((index) => index.name);

    console.log(
      `🗑️ Removing ${indexesToRemove.length} 2dsphere indexes:`,
      indexesToRemove
    );

    for (const indexName of indexesToRemove) {
      try {
        await collection.dropIndex(indexName);
        console.log(`   ✅ Removed: ${indexName}`);
      } catch (error) {
        console.log(`   ℹ️ Could not remove ${indexName}:`, error.message);
      }
    }

    // Wait a moment for index operations to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create ONE clean 2dsphere index
    console.log("📌 Creating ONE clean 2dsphere index...");
    await collection.createIndex(
      { location: "2dsphere" },
      { name: "location_2dsphere" }
    );

    // Verify final indexes
    const finalIndexes = await collection.indexes();
    const finalGeoIndexes = finalIndexes
      .filter((index) =>
        Object.values(index.key).some((value) => value === "2dsphere")
      )
      .map((index) => index.name);

    console.log("✅ Final 2dsphere indexes:", finalGeoIndexes);

    if (finalGeoIndexes.length !== 1) {
      throw new Error(
        `Expected 1 2dsphere index, found ${finalGeoIndexes.length}`
      );
    }

    console.log("🎉 Index cleanup completed successfully!");

    // Clear ALL user location data to start fresh
    console.log("\n🗑️ Clearing ALL user location data...");
    await UserLocation.deleteMany({});
    console.log("✅ All user locations cleared");

    // Load fresh user data
    const userData = [
      {
        user_id: "user_1",
        first_name: "John",
        last_name: "Smith",
        program: "Computer Science",
      },
      {
        user_id: "user_2",
        first_name: "Maria",
        last_name: "Johnson",
        program: "Biology",
      },
      {
        user_id: "user_3",
        first_name: "David",
        last_name: "Wilson",
        program: "Mechanical Engineering",
      },
      {
        user_id: "user_4",
        first_name: "Sarah",
        last_name: "Lee",
        program: "Physics",
      },
      {
        user_id: "user_5",
        first_name: "Robert",
        last_name: "Brooks",
        program: "Economics",
      },
      {
        user_id: "user_6",
        first_name: "Lisa",
        last_name: "Chen",
        program: "Psychology",
      },
      {
        user_id: "user_7",
        first_name: "Michael",
        last_name: "Garcia",
        program: "Electrical Engineering",
      },
      {
        user_id: "user_8",
        first_name: "Emily",
        last_name: "Rodriguez",
        program: "Political Science",
      },
      {
        user_id: "user_9",
        first_name: "Thomas",
        last_name: "Martinez",
        program: "Business",
      },
      {
        user_id: "user_10",
        first_name: "Karen",
        last_name: "Anderson",
        program: "Chemistry",
      },
      {
        user_id: "user_11",
        first_name: "James",
        last_name: "Taylor",
        program: "English Literature",
      },
      {
        user_id: "user_12",
        first_name: "Patricia",
        last_name: "Thomas",
        program: "Art History",
      },
      {
        user_id: "b171c38c-68a4-4300-ad40-0108f10992d3",
        first_name: "John",
        last_name: "Doe",
        program: "Information Tech",
      },
    ];

    console.log(`\n📋 Loading ${userData.length} users into MongoDB...`);

    const stanfordCoords = [-122.1697, 37.4275];
    const campusLocations = [
      { name: "Gates Building", coords: [-122.1697, 37.4275] },
      { name: "Green Library", coords: [-122.1701, 37.4283] },
      { name: "Student Center", coords: [-122.1689, 37.4268] },
      { name: "Athletic Center", coords: [-122.1712, 37.4291] },
      { name: "Campus Cafe", coords: [-122.1693, 37.4279] },
      { name: "Science Center", coords: [-122.1675, 37.426] },
    ];

    const userLocations = [];

    for (let i = 0; i < userData.length; i++) {
      const user = userData[i];
      const location = campusLocations[i % campusLocations.length];

      const randomOffset = () => (Math.random() - 0.5) * 0.003;
      const coordinates = [
        location.coords[0] + randomOffset(),
        location.coords[1] + randomOffset(),
      ];

      userLocations.push({
        user_id: user.user_id,
        location: {
          type: "Point",
          coordinates: coordinates,
        },
        accuracy: Math.floor(Math.random() * 20) + 5,
        is_active: true,
        location_sharing_enabled: true,
        last_updated: new Date(),
        last_seen: new Date(),
        geofence_radius: 100,
      });
    }

    // Insert all at once
    await UserLocation.insertMany(userLocations);
    console.log(`✅ Created ${userLocations.length} user locations`);

    // TEST WITH SIMPLE FIND QUERY (not aggregate)
    console.log("\n🧪 Testing geofencing with SIMPLE query...");

    const testRadii = [100, 200, 500];
    for (const radius of testRadii) {
      const results = await UserLocation.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: stanfordCoords,
            },
            $maxDistance: radius,
          },
        },
        is_active: true,
        location_sharing_enabled: true,
      });

      console.log(`   ${radius}m radius: ${results.length} users found`);
    }

    // Test with aggregate (should work now)
    console.log("\n🧪 Testing geofencing with AGGREGATE query...");
    try {
      const aggregateResults = await UserLocation.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: stanfordCoords },
            distanceField: "distance",
            maxDistance: 200,
            spherical: true,
            query: {
              is_active: true,
              location_sharing_enabled: true,
            },
          },
        },
        { $count: "count" },
      ]);

      const count = aggregateResults.length > 0 ? aggregateResults[0].count : 0;
      console.log(`   ✅ Aggregate query: ${count} users found within 200m`);
    } catch (error) {
      console.log(`   ❌ Aggregate query failed: ${error.message}`);
    }

    // Final verification
    console.log("\n🔍 Final verification:");
    const totalLocations = await UserLocation.countDocuments();
    const activeLocations = await UserLocation.countDocuments({
      is_active: true,
      location_sharing_enabled: true,
    });

    console.log(`📊 Total locations: ${totalLocations}`);
    console.log(`📊 Active & sharing: ${activeLocations}`);

    console.log("\n🎉 NUCLEAR CLEANUP COMPLETED SUCCESSFULLY!");
    console.log("🚀 Your geofencing should now work perfectly!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

nuclearCleanupAndLoad();

// failed
