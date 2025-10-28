// scripts/test4populatemongo.js
// works fine to popukate the db (sometimes only after the test.js is run)

import mongoose from "mongoose";
import { UserLocation } from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();

async function safePopulate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Your SQL users to add (only if they don't exist)
    const usersToAdd = [
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
        user_id: "b171c38c-68a4-4300-ad40-0108f10992d3",
        first_name: "John",
        last_name: "Doe",
        program: "Information Tech",
      },
    ];

    console.log(`📋 Checking ${usersToAdd.length} users...`);

    // Create locations - user_1 at center, others nearby
    const user1Location = [-122.1701, 37.4276];

    const locations = [
      { user_id: "user_1", offset: [0.0, 0.0], name: "Gates Building" },
      { user_id: "user_2", offset: [0.0001, 0.0001], name: "Gates Building" },
      { user_id: "user_3", offset: [-0.0001, 0.0001], name: "Gates Building" },
      { user_id: "user_4", offset: [0.0003, 0.0002], name: "Green Library" },
      { user_id: "user_5", offset: [-0.0002, 0.0003], name: "Student Center" },
      {
        user_id: "b171c38c-68a4-4300-ad40-0108f10992d3",
        offset: [0.01, 0.005],
        name: "Off Campus",
      },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const loc of locations) {
      const user = usersToAdd.find((u) => u.user_id === loc.user_id);
      if (!user) continue;

      // Check if user already exists
      const existingUser = await UserLocation.findOne({ user_id: loc.user_id });

      if (existingUser) {
        console.log(`⏭️  Skipping ${user.first_name} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create new location
      const coordinates = [
        user1Location[0] + loc.offset[0],
        user1Location[1] + loc.offset[1],
      ];

      await UserLocation.create({
        user_id: loc.user_id,
        location: {
          type: "Point",
          coordinates: coordinates,
        },
        accuracy: Math.floor(Math.random() * 15) + 5,
        is_active: true,
        location_sharing_enabled: true,
        last_updated: new Date(),
        last_seen: new Date(),
        geofence_radius: 100,
      });

      addedCount++;
      console.log(`📍 Added ${user.first_name} at ${loc.name}`);
    }

    console.log(`\n📊 Results: ${addedCount} added, ${skippedCount} skipped`);

    // Test geofencing
    console.log("\n🧪 Testing geofencing...");
    const results = await UserLocation.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: user1Location,
          },
          $maxDistance: 100,
        },
      },
      user_id: { $ne: "user_1" },
      is_active: true,
      location_sharing_enabled: true,
    });

    console.log(`✅ Found ${results.length} users within 100m of user_1`);

    const totalUsers = await UserLocation.countDocuments();
    console.log(`📊 Total users in DB: ${totalUsers}`);

    console.log("\n🎉 SAFE POPULATION COMPLETED!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// safePopulate();

async function addMoreUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // More users from your SQL database
    const moreUsers = [
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
        user_id: "user_13",
        first_name: "Matthew",
        last_name: "Hernandez",
        program: "Film Studies",
      },
      {
        user_id: "user_14",
        first_name: "Jennifer",
        last_name: "Moore",
        program: "Sociology",
      },
      {
        user_id: "user_15",
        first_name: "Christopher",
        last_name: "Jackson",
        program: "History",
      },
      {
        user_id: "user_16",
        first_name: "Amanda",
        last_name: "Martin",
        program: "Mathematics",
      },
      {
        user_id: "user_17",
        first_name: "Joshua",
        last_name: "Lee",
        program: "Philosophy",
      },
      {
        user_id: "user_18",
        first_name: "Michelle",
        last_name: "Perez",
        program: "Molecular Biology",
      },
      {
        user_id: "user_19",
        first_name: "Daniel",
        last_name: "Thompson",
        program: "Economics",
      },
      {
        user_id: "user_20",
        first_name: "Laura",
        last_name: "White",
        program: "Computer Science",
      },
      {
        user_id: "user_21",
        first_name: "Kevin",
        last_name: "Harris",
        program: "Aerospace Engineering",
      },
      {
        user_id: "user_22",
        first_name: "Nicole",
        last_name: "Sanchez",
        program: "Physics",
      },
      {
        user_id: "user_23",
        first_name: "Jason",
        last_name: "Clark",
        program: "Hotel Administration",
      },
      {
        user_id: "user_24",
        first_name: "Stephanie",
        last_name: "Ramirez",
        program: "Agriculture",
      },
      {
        user_id: "user_25",
        first_name: "Richard",
        last_name: "Lewis",
        program: "Finance",
      },
    ];

    console.log(`📋 Checking ${moreUsers.length} additional users...`);

    // Central location (Gates Building)
    const centerLocation = [-122.1701, 37.4276];

    // Different campus locations for variety
    const campusLocations = [
      { name: "Gates Building", coords: [-122.1701, 37.4276] },
      { name: "Green Library", coords: [-122.1701, 37.4283] },
      { name: "Student Center", coords: [-122.1689, 37.4268] },
      { name: "Athletic Center", coords: [-122.1712, 37.4291] },
      { name: "Campus Cafe", coords: [-122.1693, 37.4279] },
      { name: "Science Center", coords: [-122.1675, 37.426] },
      { name: "Engineering Bldg", coords: [-122.172, 37.4255] },
      { name: "Art Building", coords: [-122.165, 37.4295] },
      { name: "Business School", coords: [-122.173, 37.428] },
      { name: "Medical Center", coords: [-122.175, 37.43] },
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < moreUsers.length; i++) {
      const user = moreUsers[i];
      const location = campusLocations[i % campusLocations.length];

      // Check if user already exists
      const existingUser = await UserLocation.findOne({
        user_id: user.user_id,
      });

      if (existingUser) {
        console.log(
          `⏭️  Skipping ${user.first_name} ${user.last_name} (already exists)`
        );
        skippedCount++;
        continue;
      }

      // Add random variation to coordinates (within 200m)
      const randomOffset = () => (Math.random() - 0.5) * 0.002;
      const coordinates = [
        location.coords[0] + randomOffset(),
        location.coords[1] + randomOffset(),
      ];

      await UserLocation.create({
        user_id: user.user_id,
        location: {
          type: "Point",
          coordinates: coordinates,
        },
        accuracy: Math.floor(Math.random() * 15) + 5,
        is_active: true,
        location_sharing_enabled: true,
        last_updated: new Date(),
        last_seen: new Date(),
        geofence_radius: 100,
      });

      addedCount++;
      console.log(
        `📍 Added ${user.first_name} ${user.last_name} at ${location.name}`
      );
    }

    console.log(`\n📊 Results: ${addedCount} added, ${skippedCount} skipped`);

    // Test geofencing with different radii
    console.log("\n🧪 Testing geofencing with new users...");

    const testRadii = [100, 200, 500];
    for (const radius of testRadii) {
      const results = await UserLocation.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: centerLocation,
            },
            $maxDistance: radius,
          },
        },
        is_active: true,
        location_sharing_enabled: true,
      });

      console.log(`   ${radius}m radius: ${results.length} total users found`);
    }

    const totalUsers = await UserLocation.countDocuments();
    console.log(`📊 Total users in DB: ${totalUsers}`);

    console.log("\n🎉 ADDED MORE USERS SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

addMoreUsers();
