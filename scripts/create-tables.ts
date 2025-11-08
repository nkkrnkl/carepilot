/**
 * Script to create Azure Table Storage tables for CarePilot
 * 
 * Usage: npx tsx scripts/create-tables.ts
 */

import "dotenv/config";
import { createAllTables } from "../lib/azure/table-storage";

async function main() {
  try {
    console.log("🚀 Starting table creation...");
    await createAllTables();
    console.log("✅ All tables created successfully!");
  } catch (error: any) {
    console.error("❌ Error creating tables:", error.message);
    process.exit(1);
  }
}

main();

