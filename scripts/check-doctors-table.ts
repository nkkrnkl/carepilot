#!/usr/bin/env tsx
/**
 * Script to check what's in the doctorInformation_table in Azure SQL Database
 * 
 * Usage: npx tsx scripts/check-doctors-table.ts
 */

import "dotenv/config";
import { listDoctors, getConnectionPool, closeConnection } from "../lib/azure/sql-storage";
import sql from "mssql";

async function checkDoctorsTable() {
  try {
    console.log("🔍 Checking doctorInformation_table...\n");
    
    // Get connection pool
    const pool = await getConnectionPool();
    const request = pool.request();
    
    // Get total count
    console.log("📊 Getting row count...");
    const countResult = await request.query("SELECT COUNT(*) as count FROM doctorInformation_table");
    const totalCount = countResult.recordset[0].count;
    console.log(`✅ Total doctors in table: ${totalCount}\n`);
    
    if (totalCount === 0) {
      console.log("⚠️  Table is empty - no doctors found");
      console.log("\nTo populate the table, run:");
      console.log("  npx tsx scripts/migrate-doctors-to-sql.ts");
      await closeConnection();
      return;
    }
    
    // Get all doctors
    console.log("📋 Fetching all doctors...");
    const doctors = await listDoctors();
    console.log(`✅ Retrieved ${doctors.length} doctors\n`);
    
    // Display summary
    console.log("=" .repeat(80));
    console.log("DOCTORS IN doctorInformation_table");
    console.log("=" .repeat(80));
    console.log();
    
    // Group by specialty
    const bySpecialty: Record<string, number> = {};
    doctors.forEach(doctor => {
      const specialty = doctor.specialty || "Unknown";
      bySpecialty[specialty] = (bySpecialty[specialty] || 0) + 1;
    });
    
    console.log("📊 Breakdown by Specialty:");
    Object.entries(bySpecialty)
      .sort((a, b) => b[1] - a[1])
      .forEach(([specialty, count]) => {
        console.log(`  ${specialty.padEnd(30)}: ${count} doctor(s)`);
      });
    console.log();
    
    // Show first 10 doctors in detail
    console.log("📋 First 10 Doctors (detailed):");
    console.log("-".repeat(80));
    doctors.slice(0, 10).forEach((doctor, index) => {
      console.log(`\n${index + 1}. ID: ${doctor.id}`);
      console.log(`   Name: ${doctor.name || "N/A"}`);
      console.log(`   Specialty: ${doctor.specialty || "N/A"}`);
      console.log(`   Address: ${doctor.address || "N/A"}`);
      console.log(`   Distance: ${doctor.distance || "N/A"}`);
      console.log(`   Travel Time: ${doctor.travelTime || "N/A"}`);
      console.log(`   Telehealth: ${doctor.telehealth ? "Yes" : "No"}`);
      console.log(`   In Network: ${doctor.inNetwork ? "Yes" : "No"}`);
      console.log(`   Rating: ${doctor.rating || "N/A"}`);
      console.log(`   Estimated Cost: ${doctor.estimatedCost ? `$${doctor.estimatedCost}` : "N/A"}`);
      
      // Parse languages
      let languages: string[] = [];
      if (doctor.languages) {
        try {
          languages = typeof doctor.languages === 'string' 
            ? JSON.parse(doctor.languages) 
            : doctor.languages;
        } catch (e) {
          languages = [];
        }
      }
      console.log(`   Languages: ${languages.length > 0 ? languages.join(", ") : "N/A"}`);
      
      // Parse slots
      let slots: any[] = [];
      if (doctor.slots) {
        try {
          slots = typeof doctor.slots === 'string' 
            ? JSON.parse(doctor.slots) 
            : doctor.slots;
        } catch (e) {
          slots = [];
        }
      }
      console.log(`   Available Slots: ${slots.length}`);
      
      // Parse reasons
      let reasons: string[] = [];
      if (doctor.reasons) {
        try {
          reasons = typeof doctor.reasons === 'string' 
            ? JSON.parse(doctor.reasons) 
            : doctor.reasons;
        } catch (e) {
          reasons = [];
        }
      }
      console.log(`   Reasons: ${reasons.length > 0 ? reasons.join(", ") : "N/A"}`);
    });
    
    if (doctors.length > 10) {
      console.log(`\n... and ${doctors.length - 10} more doctor(s)`);
    }
    
    // Show table structure
    console.log("\n" + "=".repeat(80));
    console.log("TABLE STRUCTURE");
    console.log("=".repeat(80));
    const columnsResult = await request.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'doctorInformation_table'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log("\nColumns:");
    columnsResult.recordset.forEach((col: any) => {
      const maxLength = col.CHARACTER_MAXIMUM_LENGTH 
        ? `(${col.CHARACTER_MAXIMUM_LENGTH})` 
        : "";
      console.log(`  ${col.COLUMN_NAME.padEnd(25)} ${col.DATA_TYPE}${maxLength} ${col.IS_NULLABLE === "YES" ? "NULL" : "NOT NULL"}`);
    });
    
    console.log("\n✅ Check complete!");
    
  } catch (error: any) {
    console.error("❌ Error checking doctors table:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    console.error("\n💡 Make sure:");
    console.error("   1. AZURE_SQL_USER and AZURE_SQL_PASSWORD are set in .env");
    console.error("   2. You have network access to the database");
    console.error("   3. The database credentials are correct");
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Check if credentials are provided
const SQL_CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || "";
const SQL_USER = process.env.AZURE_SQL_USER || "";
const SQL_PASSWORD = process.env.AZURE_SQL_PASSWORD || "";

if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
  console.error("❌ Error: Azure SQL connection credentials not found!");
  console.error("   Please set one of the following in .env:");
  console.error("   - AZURE_SQL_CONNECTION_STRING (recommended)");
  console.error("   - OR AZURE_SQL_USER and AZURE_SQL_PASSWORD");
  process.exit(1);
}

checkDoctorsTable();

