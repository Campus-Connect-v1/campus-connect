// scripts/test.js
// fixes this error
// {
//     "message": "Failed to retrieve nearby profiles",
//     "error": "There is more than one 2dsphere index on test.userlocations; unsure which to use for $geoNear"
// }

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function workingFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Use the correct method - listIndexes() instead of getIndexes()
    const collection = mongoose.connection.db.collection("userlocations");

    console.log("📋 Checking current indexes...");

    // Get indexes using cursor
    const indexesCursor = collection.listIndexes();
    const indexes = await indexesCursor.toArray();

    console.log("Found indexes:");
    indexes.forEach((index) => {
      console.log(`- ${index.name}:`, index.key);
    });

    // Find 2dsphere indexes
    const geoIndexes = indexes
      .filter((index) => Object.values(index.key).includes("2dsphere"))
      .map((index) => index.name);

    console.log("\n🎯 2DSPHERE INDEXES:", geoIndexes);

    if (geoIndexes.length > 1) {
      console.log("\n🗑️ REMOVING DUPLICATE 2DSPHERE INDEXES...");

      // Keep the first one, remove others
      const indexToKeep = geoIndexes[0];
      const indexesToRemove = geoIndexes.slice(1);

      console.log(`Keeping: ${indexToKeep}`);
      console.log(`Removing: ${indexesToRemove.join(", ")}`);

      for (const indexName of indexesToRemove) {
        try {
          await collection.dropIndex(indexName);
          console.log(`✅ Removed: ${indexName}`);
        } catch (error) {
          console.log(`⚠️ Could not remove ${indexName}:`, error.message);
        }
      }
    } else if (geoIndexes.length === 0) {
      console.log("📌 No 2dsphere index found, creating one...");
      await collection.createIndex({ location: "2dsphere" });
    }

    // Final verification
    const finalIndexesCursor = collection.listIndexes();
    const finalIndexes = await finalIndexesCursor.toArray();
    const finalGeoIndexes = finalIndexes
      .filter((index) => Object.values(index.key).includes("2dsphere"))
      .map((index) => index.name);

    console.log("\n✅ FINAL 2DSPHERE INDEXES:", finalGeoIndexes);
    console.log("🎉 Cleanup completed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

workingFix();

// passed with issues
