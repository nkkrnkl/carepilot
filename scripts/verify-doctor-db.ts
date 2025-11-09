/**
 * Verify the doctor database configuration and count
 */
import { listDoctors } from "../lib/azure/sql-storage";

async function verifyDatabase() {
  try {
    console.log("🔍 Verifying doctor database configuration...");
    console.log(`   Server: ${process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net"}`);
    console.log(`   Database: ${process.env.AZURE_SQL_DATABASE || "K2Database"}`);
    console.log(`   Table: doctorInformation_table\n`);

    const doctors = await listDoctors();
    
    console.log(`✅ Found ${doctors.length} doctors in database\n`);
    
    if (doctors.length === 20) {
      console.log("✅ Perfect! Found exactly 20 doctors as expected");
    } else {
      console.log(`⚠️  Expected 20 doctors, but found ${doctors.length}`);
    }
    
    if (doctors.length > 0) {
      console.log("\n📋 Sample doctors:");
      doctors.slice(0, 5).forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} - ${doctor.specialty}`);
      });
      if (doctors.length > 5) {
        console.log(`   ... and ${doctors.length - 5} more`);
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    const { closeConnection } = await import("../lib/azure/sql-storage");
    await closeConnection();
    process.exit(0);
  }
}

verifyDatabase();
