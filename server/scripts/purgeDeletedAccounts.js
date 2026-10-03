// Run the 30-day account purge by hand.
//
//   node scripts/purgeDeletedAccounts.js            dry run: list what would go
//   node scripts/purgeDeletedAccounts.js --execute  delete it, permanently
//
// The server runs the same purge on its own every day (services/accountPurge),
// so this is for checking what is due, or catching up after an outage. A dry
// run is the default because the real run cannot be undone.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { db } from "../config/db.js";
import { purgeExpiredAccounts, RETENTION_DAYS } from "../services/accountPurge.js";

dotenv.config();

const main = async () => {
  const execute = process.argv.includes("--execute");
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set.");
    await mongoose.connect(process.env.MONGO_URI);

    const summary = await purgeExpiredAccounts({ dryRun: !execute });

    console.log(`\n${execute ? "Purge" : "Dry run"}: accounts deleted more than ${RETENTION_DAYS} days ago\n`);
    if (!summary.candidates) {
      console.log("  Nothing is due.\n");
      return;
    }
    for (const a of summary.accounts) console.log(" ", JSON.stringify(a));
    const { accounts, ...totals } = summary;
    console.log("\n ", JSON.stringify(totals));
    if (!execute) console.log("\n  Nothing was deleted. Run again with --execute to purge.\n");
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
};

main();
