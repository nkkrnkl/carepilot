/**
 * Script to create Azure SQL Database tables for CarePilot
 * 
 * Usage: npx tsx scripts/create-sql-tables.ts
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

async function createTables() {
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
      console.error("   1. Command line: npm run create-sql-tables -- user=username password='password'");
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

    // Create insurer_table
    console.log("1. Creating insurer_table...");
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'insurer_table')
      BEGIN
        CREATE TABLE insurer_table (
          unique_id NVARCHAR(255) PRIMARY KEY,
          precheckcover_id NVARCHAR(255) NOT NULL,
          created_at DATETIME2 DEFAULT GETUTCDATE(),
          updated_at DATETIME2 DEFAULT GETUTCDATE()
        );
        PRINT 'insurer_table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'insurer_table already exists';
      END
    `);
    console.log("✅ insurer_table ready\n");

    // Create provider_table
    console.log("2. Creating provider_table...");
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'provider_table')
      BEGIN
        CREATE TABLE provider_table (
          provider_id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255),
          specialty NVARCHAR(255),
          address NVARCHAR(500),
          phone NVARCHAR(50),
          email NVARCHAR(255),
          created_at DATETIME2 DEFAULT GETUTCDATE(),
          updated_at DATETIME2 DEFAULT GETUTCDATE()
        );
        PRINT 'provider_table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'provider_table already exists';
      END
    `);
    console.log("✅ provider_table ready\n");

    // Create user_table
    console.log("3. Creating user_table...");
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_table')
      BEGIN
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
        PRINT 'user_table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'user_table already exists';
      END
    `);
    console.log("✅ user_table ready\n");

    // Create doctorInformation_table
    console.log("4. Creating doctorInformation_table...");
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'doctorInformation_table')
      BEGIN
        CREATE TABLE doctorInformation_table (
          id NVARCHAR(255) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          specialty NVARCHAR(255) NOT NULL,
          address NVARCHAR(500) NOT NULL,
          distance NVARCHAR(50),
          travelTime NVARCHAR(50),
          languages NVARCHAR(MAX) NOT NULL DEFAULT '[]', -- JSON array of strings
          telehealth BIT NOT NULL DEFAULT 0,
          inNetwork BIT NOT NULL DEFAULT 0,
          rating FLOAT,
          image NVARCHAR(500),
          slots NVARCHAR(MAX) NOT NULL DEFAULT '[]', -- JSON array of slot objects
          reasons NVARCHAR(MAX) NOT NULL DEFAULT '[]', -- JSON array of strings
          estimatedCost FLOAT,
          createdAt DATETIME2 DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 DEFAULT GETUTCDATE()
        );
        PRINT 'doctorInformation_table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'doctorInformation_table already exists';
      END
    `);
    console.log("✅ doctorInformation_table ready\n");

    // Create userAppointmentScheduled_table
    console.log("5. Creating userAppointmentScheduled_table...");
    await request.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'userAppointmentScheduled_table')
      BEGIN
        CREATE TABLE userAppointmentScheduled_table (
          appointment_id NVARCHAR(255) PRIMARY KEY,
          userEmailAddress NVARCHAR(255) NOT NULL,
          doctorId NVARCHAR(255) NOT NULL,
          appointmentDate DATETIME2 NOT NULL,
          appointmentTime NVARCHAR(50),
          appointmentType NVARCHAR(50) NOT NULL CHECK (appointmentType IN ('in-person', 'telehealth')),
          status NVARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
          confirmationCode NVARCHAR(100),
          notes NVARCHAR(MAX),
          estimatedCost FLOAT,
          createdAt DATETIME2 DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 DEFAULT GETUTCDATE(),
          -- Foreign Keys
          FOREIGN KEY (userEmailAddress) REFERENCES user_table(emailAddress),
          FOREIGN KEY (doctorId) REFERENCES doctorInformation_table(id)
        );
        PRINT 'userAppointmentScheduled_table created successfully';
      END
      ELSE
      BEGIN
        PRINT 'userAppointmentScheduled_table already exists';
      END
    `);
    console.log("✅ userAppointmentScheduled_table ready\n");

    // Create indexes
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
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointment_userEmailAddress')
        BEGIN
          CREATE INDEX IX_appointment_userEmailAddress ON userAppointmentScheduled_table(userEmailAddress);
        END
      `);
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointment_doctorId')
        BEGIN
          CREATE INDEX IX_appointment_doctorId ON userAppointmentScheduled_table(doctorId);
        END
      `);
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointment_date')
        BEGIN
          CREATE INDEX IX_appointment_date ON userAppointmentScheduled_table(appointmentDate);
        END
      `);
      await request.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_appointment_status')
        BEGIN
          CREATE INDEX IX_appointment_status ON userAppointmentScheduled_table(status);
        END
      `);
      console.log("✅ Indexes created\n");
    } catch (error: any) {
      console.log("ℹ️  Indexes may already exist or could not be created:", error.message);
    }

    console.log("🎉 All tables created successfully!");
    console.log("\nTables created:");
    console.log("  - insurer_table");
    console.log("  - provider_table");
    console.log("  - user_table");
    console.log("  - doctorInformation_table");
    console.log("  - userAppointmentScheduled_table");

  } catch (error: any) {
    console.error("❌ Error creating tables:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    if (error.number) {
      console.error("   SQL Error number:", error.number);
    }
    if (error.stack) {
      console.error("   Stack:", error.stack);
    }
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

createTables();

