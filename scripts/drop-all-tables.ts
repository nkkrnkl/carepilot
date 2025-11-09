/**
 * Script to drop all tables from Azure SQL Database
 * Drops tables in the correct order to respect foreign key constraints
 * 
 * Usage: npx tsx scripts/drop-all-tables.ts
 */

import "dotenv/config";
import sql from "mssql";

// Get credentials
const SQL_USER = process.env.AZURE_SQL_USER || "";
const SQL_PASSWORD = process.env.AZURE_SQL_PASSWORD || "";
const SQL_SERVER = process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net";
const SQL_DATABASE = process.env.AZURE_SQL_DATABASE || "K2Database";
const SQL_CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || "";

async function dropAllTables() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log("🔧 Connecting to Azure SQL Database...");
    console.log(`   Server: ${SQL_SERVER}`);
    console.log(`   Database: ${SQL_DATABASE}\n`);

    // Check if credentials are provided
    if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
      console.error("❌ Error: SQL credentials not found!");
      process.exit(1);
    }

    // Create connection pool
    let config: sql.config;
    
    if (SQL_USER && SQL_PASSWORD) {
      config = {
        server: SQL_SERVER,
        database: SQL_DATABASE,
        user: SQL_USER,
        password: SQL_PASSWORD,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      };
    } else if (SQL_CONNECTION_STRING) {
      const parts = SQL_CONNECTION_STRING.split(";").reduce((acc, part) => {
        const [key, value] = part.split("=").map(s => s.trim());
        if (key && value) {
          acc[key.toLowerCase()] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const server = parts["server"] || SQL_SERVER;
      const database = parts["database"] || SQL_DATABASE;
      const user = parts["user id"] || parts["user"] || SQL_USER;
      const password = parts["password"] || SQL_PASSWORD;
      
      config = {
        server: server,
        database: database,
        user: user,
        password: password,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      };
    } else {
      throw new Error("No credentials provided");
    }

    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connected to Azure SQL Database\n");

    const request = pool.request();

    // Drop tables in reverse dependency order (children first, then parents)
    // This order respects foreign key constraints
    const tablesToDrop = [
      "eob_records",
      "insurance_benefits",
      "LabReport",
      "userAppointmentScheduled_table",
      "user_table",
      "doctorInformation_table",
      "provider_table",
      "insurer_table",
      // Also drop any backup tables
      "user_table_backup"
    ];

    console.log("🗑️  Dropping tables...\n");

    // First, disable foreign key checks by dropping constraints
    console.log("   Dropping foreign key constraints...");
    try {
      await request.query(`
        -- Drop foreign keys from eob_records
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_eob_user')
          ALTER TABLE [dbo].[eob_records] DROP CONSTRAINT [FK_eob_user];
        
        -- Drop foreign keys from insurance_benefits
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_benefits_user')
          ALTER TABLE [dbo].[insurance_benefits] DROP CONSTRAINT [FK_benefits_user];
        
        -- Drop foreign keys from LabReport
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_labreport_user')
          ALTER TABLE [dbo].[LabReport] DROP CONSTRAINT [FK_labreport_user];
        
        -- Drop foreign keys from userAppointmentScheduled_table
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_appointment_user')
          ALTER TABLE [dbo].[userAppointmentScheduled_table] DROP CONSTRAINT [FK_appointment_user];
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_appointment_doctor')
          ALTER TABLE [dbo].[userAppointmentScheduled_table] DROP CONSTRAINT [FK_appointment_doctor];
        
        -- Drop foreign keys from user_table
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_provider')
          ALTER TABLE [dbo].[user_table] DROP CONSTRAINT [FK_user_provider];
        IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_insurer')
          ALTER TABLE [dbo].[user_table] DROP CONSTRAINT [FK_user_insurer];
      `);
      console.log("   ✅ Foreign key constraints dropped\n");
    } catch (error: any) {
      console.log(`   ℹ️  Some constraints may not exist: ${error.message.substring(0, 100)}\n`);
    }

    // Drop triggers first (they depend on tables)
    console.log("   Dropping triggers...");
    const triggersToDrop = [
      "trg_eob_updated_at",
      "trg_benefits_updated_at",
      "trg_labreport_updated_at",
      "trg_appointment_updated_at",
      "trg_user_updated_at",
      "trg_doctor_updated_at",
      "trg_provider_updated_at",
      "trg_insurer_updated_at"
    ];

    for (const trigger of triggersToDrop) {
      try {
        await request.query(`DROP TRIGGER IF EXISTS [dbo].[${trigger}];`);
        console.log(`   ✅ Dropped trigger: ${trigger}`);
      } catch (error: any) {
        // Trigger might not exist, that's OK
        if (!error.message.includes("does not exist")) {
          console.log(`   ℹ️  Could not drop trigger ${trigger}: ${error.message.substring(0, 100)}`);
        }
      }
    }
    console.log("");

    // Drop tables
    for (const table of tablesToDrop) {
      try {
        await request.query(`DROP TABLE IF EXISTS [dbo].[${table}];`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to drop table ${table}: ${error.message.substring(0, 150)}`);
      }
    }

    console.log("\n✅ All tables dropped successfully!");
    
    // Verify tables are gone
    console.log("\n🔍 Verifying tables are dropped...");
    const verifyResult = await request.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME
    `);

    const remainingTables = verifyResult.recordset.map((r: any) => r.TABLE_NAME);
    if (remainingTables.length === 0) {
      console.log("   ✅ All tables successfully dropped!");
    } else {
      console.log(`   ⚠️  ${remainingTables.length} table(s) still exist:`);
      remainingTables.forEach((table: string) => {
        console.log(`      - ${table}`);
      });
    }

  } catch (error: any) {
    console.error("\n❌ Error dropping tables:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log("\n🔌 Connection closed");
    }
  }
}

dropAllTables();

