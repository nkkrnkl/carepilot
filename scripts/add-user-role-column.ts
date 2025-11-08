/**
 * Migration script to add userRole column to user_table
 * Run with: tsx scripts/add-user-role-column.ts
 * Or with credentials: npm run add-user-role-column -- user=username password='password'
 */

import "dotenv/config";
import sql from "mssql";

// Get credentials from command line arguments (prioritized) or environment variables
const args = process.argv.slice(2);
let SQL_USER = "";
let SQL_PASSWORD = "";
let useCommandLineArgs = false;

// Parse command line arguments: user=username password=password
args.forEach(arg => {
  if (arg.startsWith("user=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
    useCommandLineArgs = true;
  } else if (arg.startsWith("password=")) {
    SQL_PASSWORD = arg.split("=").slice(1).join("=");
    useCommandLineArgs = true;
  } else if (arg.startsWith("username=")) {
    SQL_USER = arg.split("=").slice(1).join("=");
    useCommandLineArgs = true;
  }
});

// Only use env variables if command line args weren't provided
if (!useCommandLineArgs) {
  SQL_USER = process.env.AZURE_SQL_USER || "";
  SQL_PASSWORD = process.env.AZURE_SQL_PASSWORD || "";
}

const SQL_SERVER = process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net";
const SQL_DATABASE = process.env.AZURE_SQL_DATABASE || "K2Database";

// Only use connection string if command line args weren't provided
let SQL_CONNECTION_STRING = "";
if (!useCommandLineArgs) {
  SQL_CONNECTION_STRING = process.env.AZURE_SQL_CONNECTION_STRING || "";
}

async function addUserRoleColumn() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log("🔧 Connecting to Azure SQL Database...");
    console.log(`   Server: ${SQL_SERVER}`);
    console.log(`   Database: ${SQL_DATABASE}`);
    if (SQL_USER) {
      console.log(`   User: ${SQL_USER}`);
    }
    console.log("");

    // Check if credentials are provided
    if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
      console.error("❌ Error: SQL credentials not found!");
      console.error("");
      console.error("Please provide credentials using one of these methods:");
      console.error("   1. Command line: npm run add-user-role-column -- user=username password='password'");
      console.error("   2. Environment variables in env file: AZURE_SQL_USER and AZURE_SQL_PASSWORD");
      console.error("   3. Connection string: AZURE_SQL_CONNECTION_STRING");
      process.exit(1);
    }

    // Create connection pool - prioritize individual credentials over connection string
    let config: sql.config;
    
    if (SQL_USER && SQL_PASSWORD) {
      // Use individual credentials (preferred)
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
      // Parse connection string
      const params = new URLSearchParams(SQL_CONNECTION_STRING.replace(/;/g, "&"));
      const server = params.get("Server") || params.get("server") || SQL_SERVER;
      const database = params.get("Database") || params.get("database") || SQL_DATABASE;
      const user = params.get("User Id") || params.get("User") || params.get("user") || SQL_USER;
      const password = params.get("Password") || params.get("password") || SQL_PASSWORD;

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
      throw new Error("SQL credentials not provided");
    }

    pool = await sql.connect(config);
    console.log("✅ Connected to SQL Database");

    const request = pool.request();

    // Check if column already exists
    console.log("1. Checking if userRole column exists...");
    const columnCheck = await request.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'user_table' AND COLUMN_NAME = 'userRole'
    `);

    if (columnCheck.recordset.length > 0) {
      console.log("✅ userRole column already exists");
      return;
    }

    // Add userRole column
    console.log("2. Adding userRole column to user_table...");
    await request.query(`
      ALTER TABLE user_table
      ADD userRole NVARCHAR(20) CHECK (userRole IN ('patient', 'doctor'))
    `);
    console.log("✅ userRole column added successfully");

    console.log("\n🎉 Migration completed successfully!");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    if (error.stack) {
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log("✅ Connection closed");
      } catch (closeError) {
        console.error("⚠️  Error closing connection:", closeError);
      }
    }
  }
}

addUserRoleColumn();

