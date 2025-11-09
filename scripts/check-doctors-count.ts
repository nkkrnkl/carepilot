/**
 * Script to check the number of doctors in the database
 */

import { listDoctors } from "../lib/azure/sql-storage";
import * as readline from "readline";

// Prompt for credentials if not in environment
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkDoctorsCount() {
  try {
    console.log("🔍 Checking doctors in database...");
    console.log(`   Server: ${process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net"}`);
    console.log(`   Database: ${process.env.AZURE_SQL_DATABASE || "K2Database"}`);
    console.log(`   Table: doctorInformation_table\n`);

    // Fetch all doctors
    const doctors = await listDoctors();
    
    console.log(`✅ Found ${doctors.length} doctors in database\n`);
    
    if (doctors.length > 0) {
      console.log("📋 Doctors list:");
      doctors.forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} - ${doctor.specialty}`);
      });
    } else {
      console.log("⚠️  No doctors found in the database");
      console.log("   Make sure the doctorInformation_table has data");
    }
    
    // Check if we have 20 doctors
    if (doctors.length === 20) {
      console.log("\n✅ Perfect! Found exactly 20 doctors as expected");
    } else if (doctors.length < 20) {
      console.log(`\n⚠️  Expected 20 doctors, but found only ${doctors.length}`);
    } else {
      console.log(`\n📊 Found ${doctors.length} doctors (more than expected 20)`);
    }
    
  } catch (error: any) {
    console.error("❌ Error checking doctors:", error.message);
    if (error.message.includes("AZURE_SQL_USER")) {
      console.error("\n💡 Make sure to set Azure SQL credentials:");
      console.error("   AZURE_SQL_USER=your_username");
      console.error("   AZURE_SQL_PASSWORD=your_password");
      console.error("   AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net");
      console.error("   AZURE_SQL_DATABASE=K2Database");
    }
    process.exit(1);
  } finally {
    // Close connection
    const { closeConnection } = await import("../lib/azure/sql-storage");
    await closeConnection();
    process.exit(0);
  }
}

checkDoctorsCount();

