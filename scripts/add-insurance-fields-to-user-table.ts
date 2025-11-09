/**
 * Script to add InsuranceCompanyName and InsuranceAccountNumber columns to user_table in Azure SQL Database
 * 
 * Usage: npx tsx scripts/add-insurance-fields-to-user-table.ts
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

async function addInsuranceFields() {
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

    // Check if InsuranceCompanyName column exists
    console.log("1. Checking if InsuranceCompanyName column exists...");
    const checkNameResult = await request.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'user_table' AND COLUMN_NAME = 'InsuranceCompanyName'
    `);

    if (checkNameResult.recordset.length === 0) {
      console.log("2. Adding InsuranceCompanyName column to user_table...");
      await request.query(`
        ALTER TABLE user_table
        ADD InsuranceCompanyName NVARCHAR(255) NULL
      `);
      console.log("✅ InsuranceCompanyName column added successfully!\n");
    } else {
      console.log("✅ InsuranceCompanyName column already exists\n");
    }

    // Check if InsuranceAccountNumber column exists
    console.log("3. Checking if InsuranceAccountNumber column exists...");
    const checkAccountResult = await request.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'user_table' AND COLUMN_NAME = 'InsuranceAccountNumber'
    `);

    if (checkAccountResult.recordset.length === 0) {
      console.log("4. Adding InsuranceAccountNumber column to user_table...");
      await request.query(`
        ALTER TABLE user_table
        ADD InsuranceAccountNumber NVARCHAR(255) NULL
      `);
      console.log("✅ InsuranceAccountNumber column added successfully!\n");
    } else {
      console.log("✅ InsuranceAccountNumber column already exists\n");
    }

    console.log("🎉 Script completed successfully!");
    console.log("\nThe user_table now has InsuranceCompanyName and InsuranceAccountNumber columns.");

  } catch (error: any) {
    console.error("❌ Error adding insurance fields:", error.message);
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

addInsuranceFields();

