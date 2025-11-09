/**
 * Script to add PhoneNumber column to user_table in Azure SQL Database
 * 
 * Usage: npx tsx scripts/add-phone-column-to-user-table.ts
 */

import "dotenv/config";
import sql from "mssql";

// Get SQL configuration
function getSQLConfig(): {
  server: string;
  database: string;
  user?: string;
  password?: string;
} {
  const SQL_SERVER = process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net";
  const SQL_DATABASE = process.env.AZURE_SQL_DATABASE || "K2Database";
  const SQL_USER = process.env.AZURE_SQL_USER || "";
  const SQL_PASSWORD = process.env.AZURE_SQL_PASSWORD || "";

  if (!SQL_USER || !SQL_PASSWORD) {
    throw new Error("AZURE_SQL_USER and AZURE_SQL_PASSWORD must be set");
  }

  return {
    server: SQL_SERVER,
    database: SQL_DATABASE,
    user: SQL_USER,
    password: SQL_PASSWORD,
  };
}

async function addPhoneNumberColumn() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log("🔧 Connecting to Azure SQL Database...");
    const sqlConfig = getSQLConfig();
    
    const config: sql.config = {
      server: sqlConfig.server,
      database: sqlConfig.database,
      user: sqlConfig.user,
      password: sqlConfig.password,
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    };

    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connected to Azure SQL Database\n");

    const request = pool.request();

    // Check if column already exists
    console.log("1. Checking if PhoneNumber column exists...");
    const checkResult = await request.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'user_table' AND COLUMN_NAME = 'PhoneNumber'
    `);

    if (checkResult.recordset.length > 0) {
      console.log("✅ PhoneNumber column already exists in user_table\n");
      return;
    }

    // Add PhoneNumber column
    console.log("2. Adding PhoneNumber column to user_table...");
    await request.query(`
      ALTER TABLE user_table
      ADD PhoneNumber NVARCHAR(50) NULL
    `);
    console.log("✅ PhoneNumber column added successfully!\n");

    console.log("🎉 Script completed successfully!");
    console.log("\nThe user_table now has a PhoneNumber column.");

  } catch (error: any) {
    console.error("❌ Error adding PhoneNumber column:", error.message);
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
    }
  }
}

addPhoneNumberColumn();

