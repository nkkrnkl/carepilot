/**
 * Migration script to update user_table schema
 * 
 * Changes:
 * - email -> emailAddress (PRIMARY KEY)
 * - address -> streetAddress
 * - city -> patientCity
 * - state -> patientState
 * - groupNumber -> insuranceGroupNumber
 * - planType -> insurancePlanType
 * - insuranceStreetAddress -> insuranceCompanyStreetAddress
 * - insuranceCity -> insuranceCompanyCity
 * - insuranceState -> insuranceCompanyState
 * - insurancePhone -> insuranceCompanyPhoneNumber
 * - Remove: middleName, preferredLanguage, phoneNumber, zipCode, insuranceCompany, accountNumber, insuranceZipCode
 * 
 * Usage: npx tsx scripts/migrate-user-table.ts [user=username] [password='password']
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

async function migrateTable() {
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
      console.error("   1. Command line: npx tsx scripts/migrate-user-table.ts -- user=username password='password'");
      console.error("   2. Environment variables in env file: AZURE_SQL_USER and AZURE_SQL_PASSWORD");
      console.error("   3. Connection string: AZURE_SQL_CONNECTION_STRING");
      process.exit(1);
    }

    // Create connection pool - prioritize individual credentials over connection string
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

    console.log("🔄 Starting migration of user_table...\n");

    // Step 1: Check if table exists
    console.log("1. Checking if user_table exists...");
    const tableCheck = await request.query(`
      SELECT COUNT(*) as count 
      FROM sys.tables 
      WHERE name = 'user_table'
    `);
    
    if (tableCheck.recordset[0].count === 0) {
      console.log("❌ user_table does not exist. Please create it first using create-sql-tables.ts");
      process.exit(1);
    }
    console.log("✅ user_table exists\n");

    // Step 2: Create backup of existing data (if any)
    console.log("2. Creating backup table...");
    await request.query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'user_table_backup')
        DROP TABLE user_table_backup;
      
      SELECT * INTO user_table_backup FROM user_table;
    `);
    console.log("✅ Backup created (user_table_backup)\n");

    // Step 3: Drop the existing table (since we're changing the PRIMARY KEY)
    console.log("3. Dropping existing user_table...");
    await request.query(`
      IF EXISTS (SELECT * FROM sys.tables WHERE name = 'user_table')
        DROP TABLE user_table;
    `);
    console.log("✅ Old user_table dropped\n");

    // Step 4: Create new user_table with updated schema
    console.log("4. Creating new user_table with updated schema...");
    await request.query(`
      CREATE TABLE user_table (
        emailAddress NVARCHAR(255) PRIMARY KEY,
        -- Personal Information
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        DateOfBirth DATE NOT NULL,
        -- Address
        StreetAddress NVARCHAR(500) NOT NULL,
        PatientCity NVARCHAR(100) NOT NULL,
        PatientState NVARCHAR(100) NOT NULL,
        -- Insurance Information
        providerId NVARCHAR(255),
        insurerId NVARCHAR(255),
        InsuranceGroupNumber NVARCHAR(255),
        InsurancePlanType NVARCHAR(50) NOT NULL CHECK (InsurancePlanType IN ('HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Other')),
        -- Insurance Company Address
        InsuranceCompanyStreetAddress NVARCHAR(500),
        InsuranceCompanyCity NVARCHAR(100),
        InsuranceCompanyState NVARCHAR(100),
        InsuranceCompanyPhoneNumber NVARCHAR(50),
        -- Documents (stored as JSON)
        documents NVARCHAR(MAX),
        -- Timestamps
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE(),
        -- Foreign Keys
        FOREIGN KEY (providerId) REFERENCES provider_table(provider_id),
        FOREIGN KEY (insurerId) REFERENCES insurer_table(unique_id)
      );
    `);
    console.log("✅ New user_table created\n");

    // Step 5: Migrate data from backup (if exists and has data)
    console.log("5. Migrating data from backup...");
    const backupCheck = await request.query(`
      SELECT COUNT(*) as count FROM user_table_backup
    `);
    
    if (backupCheck.recordset[0].count > 0) {
      await request.query(`
        INSERT INTO user_table (
          emailAddress, FirstName, LastName, DateOfBirth,
          StreetAddress, PatientCity, PatientState,
          providerId, insurerId, InsuranceGroupNumber, InsurancePlanType,
          InsuranceCompanyStreetAddress, InsuranceCompanyCity, InsuranceCompanyState, InsuranceCompanyPhoneNumber,
          documents, created_at, updated_at
        )
        SELECT 
          email as emailAddress,
          firstName as FirstName,
          lastName as LastName,
          dateOfBirth as DateOfBirth,
          address as StreetAddress,
          city as PatientCity,
          state as PatientState,
          providerId,
          insurerId,
          groupNumber as InsuranceGroupNumber,
          planType as InsurancePlanType,
          insuranceStreetAddress as InsuranceCompanyStreetAddress,
          insuranceCity as InsuranceCompanyCity,
          insuranceState as InsuranceCompanyState,
          insurancePhone as InsuranceCompanyPhoneNumber,
          documents,
          created_at,
          updated_at
        FROM user_table_backup
        WHERE email IS NOT NULL 
          AND firstName IS NOT NULL 
          AND lastName IS NOT NULL 
          AND dateOfBirth IS NOT NULL
          AND address IS NOT NULL
          AND city IS NOT NULL
          AND state IS NOT NULL
          AND planType IS NOT NULL;
      `);
      console.log("✅ Data migrated from backup\n");
    } else {
      console.log("ℹ️  No data to migrate (backup table is empty)\n");
    }

    // Step 6: Create indexes
    console.log("6. Creating indexes...");
    try {
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_table_providerId')
        BEGIN
          CREATE INDEX IX_user_table_providerId ON user_table(providerId);
        END
      `);
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_user_table_insurerId')
        BEGIN
          CREATE INDEX IX_user_table_insurerId ON user_table(insurerId);
        END
      `);
      console.log("✅ Indexes created\n");
    } catch (error: any) {
      console.log("ℹ️  Indexes may already exist:", error.message);
    }

    console.log("🎉 Migration completed successfully!");
    console.log("\nChanges applied:");
    console.log("  ✅ email -> emailAddress (PRIMARY KEY)");
    console.log("  ✅ address -> StreetAddress");
    console.log("  ✅ city -> PatientCity");
    console.log("  ✅ state -> PatientState");
    console.log("  ✅ groupNumber -> InsuranceGroupNumber");
    console.log("  ✅ planType -> InsurancePlanType");
    console.log("  ✅ insuranceStreetAddress -> InsuranceCompanyStreetAddress");
    console.log("  ✅ insuranceCity -> InsuranceCompanyCity");
    console.log("  ✅ insuranceState -> InsuranceCompanyState");
    console.log("  ✅ insurancePhone -> InsuranceCompanyPhoneNumber");
    console.log("  ✅ Removed: middleName, preferredLanguage, phoneNumber, zipCode, insuranceCompany, accountNumber, insuranceZipCode");
    console.log("\n⚠️  Backup table 'user_table_backup' was created. You can drop it after verifying the migration.");

  } catch (error: any) {
    console.error("❌ Error during migration:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    if (error.stack) {
      console.error("   Stack:", error.stack);
    }
    console.error("\n⚠️  If migration failed, you can restore from user_table_backup");
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Check if connection string or credentials are provided
if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
  console.error("❌ Error: Azure SQL connection credentials not found!");
  console.error("   Please set one of the following in your .env file:");
  console.error("   - AZURE_SQL_CONNECTION_STRING (recommended)");
  console.error("   - OR AZURE_SQL_USER and AZURE_SQL_PASSWORD");
  console.error("   - Also set AZURE_SQL_SERVER and AZURE_SQL_DATABASE if not using connection string");
  process.exit(1);
}

migrateTable();

