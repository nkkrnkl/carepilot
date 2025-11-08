/**
 * Migration script to move doctor data from Azure Blob Storage to SQL Database
 * 
 * Usage: npx tsx scripts/migrate-doctors-to-sql.ts [user=username] [password='password']
 */

// Parse command line arguments BEFORE importing dotenv
const args = process.argv.slice(2);
let SQL_USER = "";
let SQL_PASSWORD = "";

args.forEach(arg => {
  if (arg.startsWith("user=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
  } else if (arg.startsWith("password=")) {
    SQL_PASSWORD = arg.split("=").slice(1).join("=");
  } else if (arg.startsWith("username=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
  }
});

if (SQL_USER && SQL_PASSWORD) {
  process.env.AZURE_SQL_USER = SQL_USER;
  process.env.AZURE_SQL_PASSWORD = SQL_PASSWORD;
}

import "dotenv/config";
import { downloadDoctorsData } from "../lib/azure/blob-storage";
import { createDoctor, listDoctors, closeConnection } from "../lib/azure/sql-storage";

async function migrateDoctors() {
  try {
    console.log("🔄 Starting migration of doctors from Azure Blob Storage to SQL Database...\n");

    // Step 1: Download doctors from blob storage
    console.log("1. Downloading doctors from Azure Blob Storage...");
    const doctors = await downloadDoctorsData();
    
    if (doctors.length === 0) {
      console.error("❌ No doctors found in Azure Blob Storage");
      console.error("   Please verify that doctors.json exists in the blob storage container");
      process.exit(1);
    }
    
    console.log(`✅ Found ${doctors.length} doctors in blob storage\n`);

    // Step 2: Check existing doctors in SQL
    console.log("2. Checking existing doctors in SQL Database...");
    const existingDoctors = await listDoctors();
    console.log(`   Found ${existingDoctors.length} existing doctors in SQL Database\n`);

    // Step 3: Migrate doctors to SQL
    console.log("3. Migrating doctors to SQL Database...");
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const doctor of doctors) {
      try {
        // Check if doctor already exists
        const exists = existingDoctors.some(d => d.id === doctor.id);
        
        if (exists) {
          console.log(`   ⏭️  Skipping doctor ${doctor.id} (${doctor.name}) - already exists`);
          skipCount++;
          continue;
        }

        // Create doctor in SQL
        await createDoctor({
          id: doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          address: doctor.address,
          distance: doctor.distance,
          travelTime: doctor.travelTime,
          languages: doctor.languages || [],
          telehealth: doctor.telehealth || false,
          inNetwork: doctor.inNetwork || false,
          rating: doctor.rating,
          image: doctor.image,
          slots: doctor.slots || [],
          reasons: doctor.reasons || [],
          estimatedCost: doctor.estimatedCost,
          createdAt: doctor.createdAt,
          updatedAt: doctor.updatedAt,
        });

        console.log(`   ✅ Migrated doctor ${doctor.id} (${doctor.name})`);
        successCount++;
      } catch (error: any) {
        if (error.number === 2627) {
          // Duplicate key error
          console.log(`   ⏭️  Skipping doctor ${doctor.id} (${doctor.name}) - duplicate key`);
          skipCount++;
        } else {
          console.error(`   ❌ Error migrating doctor ${doctor.id} (${doctor.name}):`, error.message);
          errorCount++;
        }
      }
    }

    console.log("\n📊 Migration Summary:");
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total processed: ${doctors.length}`);

    // Step 4: Verify migration
    console.log("\n4. Verifying migration...");
    const finalDoctors = await listDoctors();
    console.log(`✅ Total doctors in SQL Database: ${finalDoctors.length}`);

    if (finalDoctors.length > 0) {
      console.log("\n📋 Sample doctors in SQL:");
      finalDoctors.slice(0, 5).forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} - ${doctor.specialty}`);
      });
    }

    console.log("\n🎉 Migration completed successfully!");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    console.error(error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Check if credentials are provided
const SQL_CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || "";
if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
  console.error("❌ Error: Azure SQL connection credentials not found!");
  console.error("   Please set one of the following:");
  console.error("   - AZURE_SQL_CONNECTION_STRING (recommended)");
  console.error("   - OR AZURE_SQL_USER and AZURE_SQL_PASSWORD");
  console.error("   - OR use command line: npx tsx scripts/migrate-doctors-to-sql.ts -- user=username password='password'");
  process.exit(1);
}

migrateDoctors();

