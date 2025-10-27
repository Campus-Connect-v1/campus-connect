// scripts/test2.js
// was to fix
// {
//     "message": "Failed to retrieve nearby profiles",
//     "error": "There is more than one 2dsphere index on test.userlocations; unsure which to use for $geoNear"
// }
// but failed

import mongoose from "mongoose";
import { UserLocation } from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();

async function loadUsersWithFixedIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Verify the correct index exists
    console.log("🔍 Checking indexes...");
    const collection = mongoose.connection.db.collection("userlocations");
    const indexes = await collection.indexes();

    const geoIndexes = indexes
      .filter((index) => Object.values(index.key).includes("2dsphere"))
      .map((index) => index.name);

    console.log("📋 Current 2dsphere indexes:", geoIndexes);

    if (!geoIndexes.includes("location_2dsphere")) {
      console.log("❌ Correct index not found. Creating location_2dsphere...");
      await collection.createIndex({ location: "2dsphere" });
      console.log("✅ Created location_2dsphere index");
    } else {
      console.log("✅ Correct index (location_2dsphere) is present");
    }

    // Clear any existing test data (optional - comment out if you want to keep existing data)
    console.log("\n🗑️ Clearing existing test data...");
    await UserLocation.deleteMany({
      user_id: {
        $in: [
          "user_1",
          "user_2",
          "user_3",
          "user_4",
          "user_5",
          "user_6",
          "user_7",
          "user_8",
          "user_9",
          "user_10",
          "user_11",
          "user_12",
          "b171c38c-68a4-4300-ad40-0108f10992d3",
        ],
      },
    });

    // User data from your MySQL database
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

    console.log(`📋 Loading ${userData.length} users into MongoDB...`);

    // Stanford University coordinates
    const stanfordCoords = [-122.1697, 37.4275];

    // Campus locations for realistic distribution
    const campusLocations = [
      { name: "Gates Building", coords: [-122.1697, 37.4275] },
      { name: "Green Library", coords: [-122.1701, 37.4283] },
      { name: "Student Center", coords: [-122.1689, 37.4268] },
      { name: "Athletic Center", coords: [-122.1712, 37.4291] },
      { name: "Campus Cafe", coords: [-122.1693, 37.4279] },
      { name: "Science Center", coords: [-122.1675, 37.426] },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < userData.length; i++) {
      const user = userData[i];
      const location = campusLocations[i % campusLocations.length];

      // Add realistic random variation (within 300m)
      const randomOffset = () => (Math.random() - 0.5) * 0.003;
      const coordinates = [
        location.coords[0] + randomOffset(),
        location.coords[1] + randomOffset(),
      ];

      const locationDoc = {
        user_id: user.user_id,
        location: {
          type: "Point",
          coordinates: coordinates,
        },
        accuracy: Math.floor(Math.random() * 20) + 5, // 5-25m accuracy
        is_active: true,
        location_sharing_enabled: true,
        last_updated: new Date(),
        last_seen: new Date(),
        geofence_radius: 100,
      };

      // Use upsert to avoid duplicates
      const result = await UserLocation.findOneAndUpdate(
        { user_id: user.user_id },
        locationDoc,
        { upsert: true, new: true }
      );

      if (result.$isNew) {
        createdCount++;
        console.log(
          `✅ Created: ${user.first_name} ${user.last_name} at ${location.name}`
        );
      } else {
        updatedCount++;
        console.log(`🔄 Updated: ${user.first_name} ${user.last_name}`);
      }
    }

    // Verify the data
    console.log("\n🔍 Data verification:");
    const totalLocations = await UserLocation.countDocuments();
    const activeLocations = await UserLocation.countDocuments({
      is_active: true,
      location_sharing_enabled: true,
    });

    console.log(`📊 Total locations: ${totalLocations}`);
    console.log(`📊 Active & sharing: ${activeLocations}`);
    console.log(`📊 Created: ${createdCount}`);
    console.log(`📊 Updated: ${updatedCount}`);

    // Test geofencing with different radii using AGGREGATE for distance calculation
    console.log("\n🧪 Testing geofencing with distance calculation:");

    const testRadii = [100, 200, 500];
    for (const radius of testRadii) {
      const results = await UserLocation.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: stanfordCoords },
            distanceField: "distance",
            maxDistance: radius,
            spherical: true,
            query: {
              is_active: true,
              location_sharing_enabled: true,
            },
          },
        },
        { $count: "count" },
      ]);

      const count = results.length > 0 ? results[0].count : 0;
      console.log(`   ${radius}m radius: ${count} users found`);
    }

    // Show detailed sample of nearby users with distances
    console.log("\n👥 Users near Gates Building (200m) with distances:");
    const sampleResults = await UserLocation.aggregate([
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
      { $limit: 5 },
      {
        $project: {
          user_id: 1,
          distance: 1,
          accuracy: 1,
        },
      },
    ]);

    sampleResults.forEach((user) => {
      console.log(`   - ${user.user_id} (${Math.round(user.distance)}m away)`);
    });

    console.log("\n🎉 MongoDB loader completed successfully!");
    console.log("\n🚀 Your geofencing is READY with:");
    console.log("   ✅ Correct index: location_2dsphere");
    console.log("   ✅ Real user data from MySQL");
    console.log("   ✅ Realistic campus locations");
    console.log("   ✅ Distance calculations working");
    console.log("\n💡 Test endpoint: GET /api/geofencing/nearby?radius=200");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
  }
}

loadUsersWithFixedIndex();

// failed
