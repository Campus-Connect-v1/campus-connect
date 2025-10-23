// remove duplicates
// scripts/test5.js

// solves this error
// {
//     "message": "Failed to retrieve nearby profiles",
//     "error": "There is more than one 2dsphere index on test.userlocations; unsure which to use for $geoNear"
// }
// and passed

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function nukeDuplicateIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.db.collection("userlocations");

    console.log("🔍 Finding ALL indexes...");
    const indexesCursor = collection.listIndexes();
    const indexes = await indexesCursor.toArray();

    console.log("📋 ALL INDEXES FOUND:");
    indexes.forEach((index) => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    // Group indexes by their key structure to find duplicates
    const indexGroups = {};

    indexes.forEach((index) => {
      const keyString = JSON.stringify(index.key);
      if (!indexGroups[keyString]) {
        indexGroups[keyString] = [];
      }
      indexGroups[keyString].push(index.name);
    });

    console.log("\n🎯 DUPLICATE INDEX GROUPS:");
    let totalRemoved = 0;

    for (const [keyString, indexNames] of Object.entries(indexGroups)) {
      if (indexNames.length > 1) {
        console.log(`\n🗑️ Duplicate group for key: ${keyString}`);
        console.log(`   Indexes: ${indexNames.join(", ")}`);

        // Keep the first index, remove others
        const indexToKeep = indexNames[0];
        const indexesToRemove = indexNames.slice(1);

        console.log(`   Keeping: ${indexToKeep}`);
        console.log(`   Removing: ${indexesToRemove.join(", ")}`);

        for (const indexName of indexesToRemove) {
          try {
            await collection.dropIndex(indexName);
            console.log(`   ✅ Removed: ${indexName}`);
            totalRemoved++;
          } catch (error) {
            console.log(`   ⚠️ Could not remove ${indexName}:`, error.message);
          }
        }
      }
    }

    if (totalRemoved === 0) {
      console.log("\n✅ No duplicate indexes found!");
    } else {
      console.log(`\n🎉 Removed ${totalRemoved} duplicate indexes!`);
    }

    // Final verification
    console.log("\n🔍 FINAL INDEXES:");
    const finalIndexesCursor = collection.listIndexes();
    const finalIndexes = await finalIndexesCursor.toArray();

    finalIndexes.forEach((index) => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    // Check specifically for 2dsphere indexes
    const geoIndexes = finalIndexes
      .filter((index) => Object.values(index.key).includes("2dsphere"))
      .map((index) => index.name);

    console.log("\n🎯 FINAL 2DSPHERE INDEXES:", geoIndexes);

    if (geoIndexes.length !== 1) {
      console.log("❌ Still have multiple 2dsphere indexes!");
      console.log("💡 Running nuclear option...");

      // Remove ALL 2dsphere indexes and create one clean one
      for (const indexName of geoIndexes) {
        try {
          await collection.dropIndex(indexName);
          console.log(`   🗑️ Removed: ${indexName}`);
        } catch (error) {
          console.log(`   ⚠️ Could not remove ${indexName}:`, error.message);
        }
      }

      // Create one clean 2dsphere index
      await collection.createIndex({ location: "2dsphere" });
      console.log("✅ Created clean location_2dsphere index");
    }

    console.log("\n🚀 DUPLICATE INDEX CLEANUP COMPLETED!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

nukeDuplicateIndexes();
