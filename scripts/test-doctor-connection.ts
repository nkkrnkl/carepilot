/**
 * Test connection to doctor database
 */
import { listDoctors } from "../lib/azure/sql-storage";

async function testConnection() {
  try {
    console.log("🔍 Testing connection to Azure SQL Database...");
    console.log(`   Server: ${process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net"}`);
    console.log(`   Database: ${process.env.AZURE_SQL_DATABASE || "K2Database"}`);
    console.log(`   User: ${process.env.AZURE_SQL_USER || "NOT SET"}`);
    console.log(`   Password: ${process.env.AZURE_SQL_PASSWORD ? "***SET***" : "NOT SET"}\n`);

    if (!process.env.AZURE_SQL_USER || process.env.AZURE_SQL_USER.includes("your_")) {
      console.error("❌ Error: AZURE_SQL_USER is not set correctly in .env.local");
      console.error("   Please update .env.local with your actual Azure SQL credentials");
      process.exit(1);
    }

    if (!process.env.AZURE_SQL_PASSWORD || process.env.AZURE_SQL_PASSWORD.includes("your_")) {
      console.error("❌ Error: AZURE_SQL_PASSWORD is not set correctly in .env.local");
      console.error("   Please update .env.local with your actual Azure SQL credentials");
      process.exit(1);
    }

    const doctors = await listDoctors();
    console.log(`✅ Successfully connected! Found ${doctors.length} doctors\n`);
    
    if (doctors.length === 20) {
      console.log("✅ Perfect! Found exactly 20 doctors as expected");
    } else {
      console.log(`⚠️  Found ${doctors.length} doctors (expected 20)`);
    }
    
    if (doctors.length > 0) {
      console.log("\n📋 Sample doctors:");
      doctors.slice(0, 5).forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} - ${doctor.specialty}`);
      });
    }
    
  } catch (error: any) {
    console.error("❌ Connection failed:", error.message);
    if (error.message.includes("Login failed")) {
      console.error("\n💡 The credentials in .env.local are incorrect.");
      console.error("   Please verify your Azure SQL username and password.");
    } else if (error.message.includes("AZURE_SQL_USER")) {
      console.error("\n💡 Please set Azure SQL credentials in .env.local:");
      console.error("   AZURE_SQL_USER=your_username");
      console.error("   AZURE_SQL_PASSWORD=your_password");
    }
    process.exit(1);
  } finally {
    const { closeConnection } = await import("../lib/azure/sql-storage");
    await closeConnection();
    process.exit(0);
  }
}

testConnection();
