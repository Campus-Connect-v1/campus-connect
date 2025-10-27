// // remove duplicates
// // scripts/test5.js

// // solves this error
// // {
// //     "message": "Failed to retrieve nearby profiles",
// //     "error": "There is more than one 2dsphere index on test.userlocations; unsure which to use for $geoNear"
// // }
// // and passed

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// dotenv.config();

// async function nukeDuplicateIndexes() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ Connected to MongoDB");

//     const collection = mongoose.connection.db.collection("userlocations");

//     console.log("🔍 Finding ALL indexes...");
//     const indexesCursor = collection.listIndexes();
//     const indexes = await indexesCursor.toArray();

//     console.log("📋 ALL INDEXES FOUND:");
//     indexes.forEach((index) => {
//       console.log(`- ${index.name}:`, JSON.stringify(index.key));
//     });

//     // Group indexes by their key structure to find duplicates
//     const indexGroups = {};

//     indexes.forEach((index) => {
//       const keyString = JSON.stringify(index.key);
//       if (!indexGroups[keyString]) {
//         indexGroups[keyString] = [];
//       }
//       indexGroups[keyString].push(index.name);
//     });

//     console.log("\n🎯 DUPLICATE INDEX GROUPS:");
//     let totalRemoved = 0;

//     for (const [keyString, indexNames] of Object.entries(indexGroups)) {
//       if (indexNames.length > 1) {
//         console.log(`\n🗑️ Duplicate group for key: ${keyString}`);
//         console.log(`   Indexes: ${indexNames.join(", ")}`);

//         // Keep the first index, remove others
//         const indexToKeep = indexNames[0];
//         const indexesToRemove = indexNames.slice(1);

//         console.log(`   Keeping: ${indexToKeep}`);
//         console.log(`   Removing: ${indexesToRemove.join(", ")}`);

//         for (const indexName of indexesToRemove) {
//           try {
//             await collection.dropIndex(indexName);
//             console.log(`   ✅ Removed: ${indexName}`);
//             totalRemoved++;
//           } catch (error) {
//             console.log(`   ⚠️ Could not remove ${indexName}:`, error.message);
//           }
//         }
//       }
//     }

//     if (totalRemoved === 0) {
//       console.log("\n✅ No duplicate indexes found!");
//     } else {
//       console.log(`\n🎉 Removed ${totalRemoved} duplicate indexes!`);
//     }

//     // Final verification
//     console.log("\n🔍 FINAL INDEXES:");
//     const finalIndexesCursor = collection.listIndexes();
//     const finalIndexes = await finalIndexesCursor.toArray();

//     finalIndexes.forEach((index) => {
//       console.log(`- ${index.name}:`, JSON.stringify(index.key));
//     });

//     // Check specifically for 2dsphere indexes
//     const geoIndexes = finalIndexes
//       .filter((index) => Object.values(index.key).includes("2dsphere"))
//       .map((index) => index.name);

//     console.log("\n🎯 FINAL 2DSPHERE INDEXES:", geoIndexes);

//     if (geoIndexes.length !== 1) {
//       console.log("❌ Still have multiple 2dsphere indexes!");
//       console.log("💡 Running nuclear option...");

//       // Remove ALL 2dsphere indexes and create one clean one
//       for (const indexName of geoIndexes) {
//         try {
//           await collection.dropIndex(indexName);
//           console.log(`   🗑️ Removed: ${indexName}`);
//         } catch (error) {
//           console.log(`   ⚠️ Could not remove ${indexName}:`, error.message);
//         }
//       }

//       // Create one clean 2dsphere index
//       await collection.createIndex({ location: "2dsphere" });
//       console.log("✅ Created clean location_2dsphere index");
//     }

//     console.log("\n🚀 DUPLICATE INDEX CLEANUP COMPLETED!");
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   } finally {
//     await mongoose.connection.close();
//     console.log("🔌 MongoDB connection closed");
//   }
// }

// nukeDuplicateIndexes();

// scripts/fixDuplicateIndexes.js
// import mongoose from "mongoose";
// import { UserLocation } from "../models/location.js";
// import dotenv from "dotenv";
// dotenv.config();

// async function fixDuplicateIndexes() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("📡 Connected to MongoDB\n");

//     const collection = mongoose.connection.collection("userlocations");

//     // Get ALL indexes
//     console.log("📑 ALL CURRENT INDEXES:");
//     console.log("═".repeat(40));

//     const indexes = await collection.listIndexes().toArray();
//     indexes.forEach((index, i) => {
//       console.log(`${i + 1}. ${index.name}:`, index.key);
//     });

//     // Find ALL 2dsphere indexes (including nested ones)
//     const sphereIndexes = indexes.filter((index) => {
//       const keys = Object.values(index.key);
//       return keys.includes("2dsphere") || keys.includes("2d");
//     });

//     console.log(`\n🎯 Found ${sphereIndexes.length} geospatial indexes:`);
//     sphereIndexes.forEach((index) => {
//       console.log(`   - ${index.name}:`, index.key);
//     });

//     if (sphereIndexes.length > 1) {
//       console.log("\n🔧 Dropping duplicate geospatial indexes...");

//       // Keep the main 'location_2dsphere' index, drop the nested one
//       const indexesToKeep = ["location_2dsphere"];
//       const indexesToDrop = sphereIndexes.filter(
//         (index) => !indexesToKeep.includes(index.name)
//       );

//       for (const index of indexesToDrop) {
//         await collection.dropIndex(index.name);
//         console.log(`✅ Dropped duplicate index: ${index.name}`);
//       }

//       console.log("\n✅ Index cleanup completed!");
//     }

//     // Test the geospatial query again
//     console.log("\n🎯 FINAL GEOSPATIAL TEST:");
//     console.log("═".repeat(50));

//     const user1 = await UserLocation.findOne({ user_id: "user_1" });

//     try {
//       const nearbyUsers = await UserLocation.aggregate([
//         {
//           $geoNear: {
//             near: user1.location,
//             distanceField: "distance",
//             maxDistance: 500,
//             spherical: true,
//             query: {
//               user_id: { $ne: "user_1" },
//               location_sharing_enabled: true,
//               is_active: true,
//             },
//           },
//         },
//         { $sort: { distance: 1 } },
//         { $limit: 15 },
//       ]);

//       console.log(`✅ SUCCESS! Found ${nearbyUsers.length} nearby users:\n`);
//       nearbyUsers.forEach((user, i) => {
//         console.log(
//           `   ${i + 1}. ${user.user_id}: ${Math.round(user.distance)}m away`
//         );
//       });
//     } catch (error) {
//       console.log("❌ Geospatial query still failing:", error.message);
//     }
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   } finally {
//     await mongoose.disconnect();
//     console.log("\n📡 MongoDB connection closed");
//   }
// }

// fixDuplicateIndexes();

// scripts/quickFixMissingUsers.js
// import mongoose from "mongoose";
// import { UserLocation } from "../models/location.js";
// import dotenv from "dotenv";
// dotenv.config();

// async function quickFixMissingUsers() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("🔧 QUICK FIX: Loading missing users to MongoDB\n");

//     // Users that should exist based on your MySQL data
//     const usersToCreate = [
//       "user_1",
//       "user_2",
//       "user_3",
//       "user_4",
//       "user_5",
//       "user_6",
//       "user_7",
//       "user_8",
//       "user_9",
//       "user_10",
//       "user_11",
//       "user_12",
//       "user_13",
//       "user_14",
//       "user_15",
//     ];

//     const centerLon = -122.1697;
//     const centerLat = 37.4275;

//     let created = 0;
//     let existing = 0;

//     for (const userId of usersToCreate) {
//       // Check if user exists
//       const exists = await UserLocation.findOne({ user_id: userId });

//       if (exists) {
//         console.log(`✅ ${userId} already exists`);
//         existing++;
//         continue;
//       }

//       // Create user with random nearby location
//       const offsetLon = (Math.random() - 0.5) * 0.01; // ~500m range
//       const offsetLat = (Math.random() - 0.5) * 0.01;

//       await UserLocation.create({
//         user_id: userId,
//         location: {
//           type: "Point",
//           coordinates: [centerLon + offsetLon, centerLat + offsetLat],
//         },
//         accuracy: 15,
//         last_updated: new Date(),
//         last_seen: new Date(),
//         is_active: true,
//         location_sharing_enabled: true,
//         geofence_radius: 500,
//       });

//       console.log(`📍 Created ${userId}`);
//       created++;
//     }

//     console.log(`\n📊 RESULTS:`);
//     console.log(`✅ Created: ${created} users`);
//     console.log(`✅ Existing: ${existing} users`);
//     console.log(`🎯 Total in MongoDB: ${created + existing} users`);

//     // Test the nearby query
//     console.log("\n🧪 Testing nearby query...");
//     const user1 = await UserLocation.findOne({ user_id: "user_1" });
//     if (user1) {
//       const nearby = await UserLocation.aggregate([
//         {
//           $geoNear: {
//             near: user1.location,
//             distanceField: "distance",
//             maxDistance: 500,
//             spherical: true,
//             query: {
//               user_id: { $ne: "user_1" },
//               location_sharing_enabled: true,
//               is_active: true,
//             },
//           },
//         },
//         { $sort: { distance: 1 } },
//       ]);

//       console.log(`✅ Found ${nearby.length} users within 500m of user_1`);
//       nearby.slice(0, 5).forEach((user) => {
//         console.log(`   • ${user.user_id}: ${Math.round(user.distance)}m away`);
//       });
//     }
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   } finally {
//     await mongoose.disconnect();
//     console.log("\n📡 MongoDB connection closed");
//   }
// }

// quickFixMissingUsers();

// scripts/quickFixMissingUsers_FIXED.js
// import mongoose from "mongoose";
// import { UserLocation } from "../models/location.js";
// import dotenv from "dotenv";
// dotenv.config();

// async function quickFixMissingUsers() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("🔧 QUICK FIX: Loading missing users to MongoDB\n");

//     // First, clean up any duplicate indexes
//     console.log("🗑️ Checking for duplicate indexes...");
//     const collection = mongoose.connection.collection("userlocations");
//     const indexes = await collection.listIndexes().toArray();

//     const sphereIndexes = indexes.filter(
//       (index) =>
//         index.key?.location === "2dsphere" ||
//         index.key?.["location.coordinates"] === "2dsphere"
//     );

//     if (sphereIndexes.length > 1) {
//       console.log(
//         `🎯 Found ${sphereIndexes.length} geospatial indexes, cleaning up...`
//       );

//       // Keep only the main 'location_2dsphere' index
//       const indexesToKeep = ["location_2dsphere"];
//       const indexesToDrop = sphereIndexes.filter(
//         (index) => !indexesToKeep.includes(index.name)
//       );

//       for (const index of indexesToDrop) {
//         await collection.dropIndex(index.name);
//         console.log(`✅ Dropped duplicate index: ${index.name}`);
//       }
//     }

//     // Users that should exist based on your MySQL data
//     const usersToCreate = [
//       "user_1",
//       "user_2",
//       "user_3",
//       "user_4",
//       "user_5",
//       "user_6",
//       "user_7",
//       "user_8",
//       "user_9",
//       "user_10",
//       "user_11",
//       "user_12",
//       "user_13",
//       "user_14",
//       "user_15",
//     ];

//     const centerLon = -122.1697;
//     const centerLat = 37.4275;

//     let created = 0;
//     let existing = 0;

//     for (const userId of usersToCreate) {
//       // Check if user exists
//       const exists = await UserLocation.findOne({ user_id: userId });

//       if (exists) {
//         console.log(`✅ ${userId} already exists`);
//         existing++;
//         continue;
//       }

//       // Create user with random nearby location
//       const offsetLon = (Math.random() - 0.5) * 0.01; // ~500m range
//       const offsetLat = (Math.random() - 0.5) * 0.01;

//       await UserLocation.create({
//         user_id: userId,
//         location: {
//           type: "Point",
//           coordinates: [centerLon + offsetLon, centerLat + offsetLat],
//         },
//         accuracy: 15,
//         last_updated: new Date(),
//         last_seen: new Date(),
//         is_active: true,
//         location_sharing_enabled: true,
//         geofence_radius: 500,
//       });

//       console.log(`📍 Created ${userId}`);
//       created++;
//     }

//     console.log(`\n📊 RESULTS:`);
//     console.log(`✅ Created: ${created} users`);
//     console.log(`✅ Existing: ${existing} users`);
//     console.log(`🎯 Total in MongoDB: ${created + existing} users`);

//     // Test the nearby query
//     console.log("\n🧪 Testing nearby query...");
//     const user1 = await UserLocation.findOne({ user_id: "user_1" });
//     if (user1) {
//       const nearby = await UserLocation.aggregate([
//         {
//           $geoNear: {
//             near: user1.location,
//             distanceField: "distance",
//             maxDistance: 500,
//             spherical: true,
//             query: {
//               user_id: { $ne: "user_1" },
//               location_sharing_enabled: true,
//               is_active: true,
//             },
//           },
//         },
//         { $sort: { distance: 1 } },
//       ]);

//       console.log(`✅ Found ${nearby.length} users within 500m of user_1`);
//       nearby.slice(0, 5).forEach((user) => {
//         console.log(`   • ${user.user_id}: ${Math.round(user.distance)}m away`);
//       });
//     }
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   } finally {
//     await mongoose.disconnect();
//     console.log("\n📡 MongoDB connection closed");
//   }
// }

// quickFixMissingUsers();

// scripts/permanentIndexFix.js
// import mongoose from "mongoose";
// import { UserLocation } from "../models/location.js";
// import dotenv from "dotenv";
// dotenv.config();

// async function permanentIndexFix() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("🔧 PERMANENT INDEX FIX\n");

//     const collection = mongoose.connection.collection("userlocations");

//     // 1. Drop ALL indexes except _id_
//     console.log("1. 🗑️ DROPPING ALL CUSTOM INDEXES");
//     console.log("─".repeat(40));

//     const indexes = await collection.listIndexes().toArray();

//     for (const index of indexes) {
//       if (index.name !== "_id_") {
//         await collection.dropIndex(index.name);
//         console.log(`✅ Dropped index: ${index.name}`);
//       }
//     }

//     // 2. Wait a moment for indexes to be dropped
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     // 3. Create only the necessary indexes manually
//     console.log("\n2. 🔧 CREATING OPTIMIZED INDEXES");
//     console.log("─".repeat(40));

//     // ONLY create the main 2dsphere index
//     await collection.createIndex(
//       { location: "2dsphere" },
//       { name: "location_2dsphere" }
//     );
//     console.log("✅ Created location_2dsphere index");

//     // Create other necessary indexes
//     await collection.createIndex(
//       { user_id: 1 },
//       { name: "user_id_1", unique: true }
//     );
//     console.log("✅ Created user_id index");

//     await collection.createIndex(
//       { last_updated: 1 },
//       { name: "last_updated_1" }
//     );
//     console.log("✅ Created last_updated index");

//     await collection.createIndex(
//       { user_id: 1, is_active: 1 },
//       { name: "user_id_is_active" }
//     );
//     console.log("✅ Created user_id + is_active compound index");

//     // 4. Verify the fix
//     console.log("\n3. ✅ VERIFYING FIX");
//     console.log("─".repeat(40));

//     const finalIndexes = await collection.listIndexes().toArray();
//     console.log("Final indexes:");
//     finalIndexes.forEach((index) => {
//       console.log(`   • ${index.name}:`, index.key);
//     });

//     const sphereIndexes = finalIndexes.filter(
//       (index) =>
//         index.key?.location === "2dsphere" ||
//         index.key?.["location.coordinates"] === "2dsphere"
//     );

//     console.log(`\n🎯 Geospatial indexes: ${sphereIndexes.length}`);
//     if (sphereIndexes.length === 1) {
//       console.log("✅ SUCCESS! Only one 2dsphere index exists");
//     } else {
//       console.log("❌ FAILED! Still have duplicate indexes");
//     }

//     // 5. Test the query
//     console.log("\n4. 🧪 TESTING GEOSPATIAL QUERY");
//     console.log("─".repeat(40));

//     const user1 = await UserLocation.findOne({ user_id: "user_1" });
//     if (user1) {
//       const nearby = await UserLocation.aggregate([
//         {
//           $geoNear: {
//             near: user1.location,
//             distanceField: "distance",
//             maxDistance: 500,
//             spherical: true,
//             query: {
//               user_id: { $ne: "user_1" },
//               location_sharing_enabled: true,
//               is_active: true,
//             },
//           },
//         },
//         { $sort: { distance: 1 } },
//         { $limit: 5 },
//       ]);

//       console.log(`✅ Found ${nearby.length} users within 500m:`);
//       nearby.forEach((user) => {
//         console.log(`   • ${user.user_id}: ${Math.round(user.distance)}m away`);
//       });
//     }
//   } catch (error) {
//     console.error("❌ Error:", error.message);
//   } finally {
//     await mongoose.disconnect();
//     console.log("\n📡 MongoDB connection closed");
//   }
// }

// permanentIndexFix();

// scripts/addMissingMySQLUsers.js
// import mysql from "mysql2/promise";
// import dotenv from "dotenv";
// dotenv.config();

// async function addMissingMySQLUsers() {
//   let connection;
//   try {
//     // Create MySQL connection
//     connection = await mysql.createConnection({
//       host: process.env.DB_HOST || "localhost",
//       port: process.env.DB_PORT || 3306,
//       user: process.env.DB_USER || "root",
//       password: process.env.DB_PASSWORD || "",
//       database: process.env.DB_NAME || "campus_connect",
//     });

//     console.log("🔧 ADDING MISSING USERS TO MYSQL\n");

//     // Users that exist in MongoDB but are missing in MySQL
//     const missingUsers = [
//       "user_near_1",
//       "user_near_2",
//       "user_medium_1",
//       "user_medium_2",
//       "user_random_1",
//       "user_random_2",
//       "user_random_3",
//       "user_random_4",
//       "user_random_5",
//       "user_edge_1",
//       "user_far_1",
//       "user_private_1",
//       "user_inactive_1",
//       "user_16",
//       "user_17",
//       "user_18",
//       "user_19",
//       "user_20",
//       "user_21",
//       "user_22",
//       "user_23",
//       "user_24",
//       "user_25",
//     ];

//     let usersAdded = 0;
//     let privacyAdded = 0;

//     for (const userId of missingUsers) {
//       try {
//         // Check if user already exists in MySQL
//         const [existing] = await connection.execute(
//           "SELECT user_id FROM users WHERE user_id = ?",
//           [userId]
//         );

//         if (existing.length > 0) {
//           console.log(`✅ ${userId} already exists in MySQL`);
//           continue;
//         }

//         // Add user to MySQL
//         const email = `${userId.replace("_", "")}@stanford.edu`;
//         const firstName = userId.split("_")[1]
//           ? userId.split("_")[1].charAt(0).toUpperCase() +
//             userId.split("_")[1].slice(1)
//           : "User";
//         const lastName = userId.split("_")[2]
//           ? userId.split("_")[2].charAt(0).toUpperCase() +
//             userId.split("_")[2].slice(1)
//           : "Test";

//         await connection.execute(
//           `INSERT INTO users (
//             user_id, university_id, email, password_hash, first_name, last_name, gender,
//             program, graduation_year, is_active, is_email_verified, privacy_profile
//           ) VALUES (?, 'uni_1', ?, '$2b$12$defaultpasswordhash', ?, ?, 'M', 'Computer Science', 2025, 1, 1, 'friends')`,
//           [userId, email, firstName, lastName]
//         );

//         console.log(`📍 Added ${userId} to MySQL`);
//         usersAdded++;

//         // Add privacy settings
//         const profileVisibility =
//           userId === "user_private_1" ? "private" : "geofenced";

//         await connection.execute(
//           `INSERT INTO user_privacy_settings (user_id, profile_visibility, custom_radius, show_exact_location, visible_fields)
//            VALUES (?, ?, 200, ?, ?)`,
//           [
//             userId,
//             profileVisibility,
//             profileVisibility !== "private",
//             JSON.stringify({
//               name: true,
//               photo: true,
//               bio: true,
//               program: true,
//               courses: false,
//               contact: false,
//             }),
//           ]
//         );

//         console.log(`   🔒 Added privacy settings for ${userId}`);
//         privacyAdded++;
//       } catch (error) {
//         console.error(`❌ Error adding ${userId}:`, error.message);
//       }
//     }

//     console.log(`\n📊 RESULTS:`);
//     console.log(`✅ Users added: ${usersAdded}`);
//     console.log(`✅ Privacy settings added: ${privacyAdded}`);
//     console.log(`🎯 Total processed: ${missingUsers.length}`);

//     // Verify the fix
//     console.log("\n🔍 VERIFYING FIX");
//     const [userCount] = await connection.execute(
//       "SELECT COUNT(*) as count FROM users"
//     );
//     console.log(`📊 Total users in MySQL: ${userCount[0].count}`);
//   } catch (error) {
//     console.error("❌ Database error:", error.message);
//   } finally {
//     if (connection) {
//       await connection.end();
//       console.log("\n🗄️ MySQL connection closed");
//     }
//   }
// }

// addMissingMySQLUsers();

// scripts/quickFixAllMissingUsers.js
import mongoose from "mongoose";
import mysql from "mysql2/promise";
import { UserLocation } from "../models/location.js";
import dotenv from "dotenv";
dotenv.config();

async function quickFixAllMissingUsers() {
  let mysqlConnection;

  try {
    // Connect to both databases
    await mongoose.connect(process.env.MONGO_URI);
    mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "new_user",
      password: process.env.DB_PASSWORD || "new_password",
      database: process.env.DB_NAME || "campus_connect",
      port: 8889,
    });

    console.log("🔧 QUICK FIX: Adding all missing users to MySQL\n");

    // Get all users from MongoDB
    const mongoUsers = await UserLocation.find({}).select("user_id").lean();
    const mongoUserIds = mongoUsers.map((user) => user.user_id);

    console.log(`📊 Found ${mongoUserIds.length} users in MongoDB`);

    let usersAdded = 0;
    let usersSkipped = 0;

    for (const userId of mongoUserIds) {
      try {
        // Check if user exists in MySQL
        const [existing] = await mysqlConnection.execute(
          "SELECT user_id FROM users WHERE user_id = ?",
          [userId]
        );

        if (existing.length > 0) {
          usersSkipped++;
          continue;
        }

        // Add missing user to MySQL
        const email = `${userId.replace("_", "")}@stanford.edu`;
        const nameParts = userId.split("_");
        const firstName = nameParts[1]
          ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
          : "User";
        const lastName = nameParts[2]
          ? nameParts[2].charAt(0).toUpperCase() + nameParts[2].slice(1)
          : "Test";

        await mysqlConnection.execute(
          `INSERT INTO users (
            user_id, university_id, email, password_hash, first_name, last_name, gender, 
            program, graduation_year, is_active, is_email_verified, privacy_profile
          ) VALUES (?, 'uni_1', ?, '$2b$12$defaultpasswordhash', ?, ?, 'M', 'Computer Science', 2025, 1, 1, 'friends')`,
          [userId, email, firstName, lastName]
        );

        // Add default privacy settings
        await mysqlConnection.execute(
          `INSERT INTO user_privacy_settings (user_id, profile_visibility, custom_radius, show_exact_location, visible_fields) 
           VALUES (?, 'geofenced', 200, 1, ?)`,
          [
            userId,
            JSON.stringify({
              name: true,
              photo: true,
              bio: true,
              program: true,
              courses: false,
              contact: false,
            }),
          ]
        );

        console.log(`✅ Added ${userId} to MySQL`);
        usersAdded++;
      } catch (error) {
        console.error(`❌ Error with ${userId}:`, error.message);
      }
    }

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ Users added to MySQL: ${usersAdded}`);
    console.log(`↻ Users already existed: ${usersSkipped}`);
    console.log(`🎯 Total processed: ${mongoUserIds.length}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    await mongoose.disconnect();
    console.log("\n📡 All connections closed");
  }
}

quickFixAllMissingUsers();
