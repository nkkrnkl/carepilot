/**
 * Simple script to test SQL Database connection
 * Usage: npx tsx scripts/test-sql-connection.ts
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
    SQL_USER = arg.split("=").slice(1).join("="); // Handle passwords with = in them
    useCommandLineArgs = true;
  } else if (arg.startsWith("password=")) {
    SQL_PASSWORD = arg.split("=").slice(1).join("="); // Handle passwords with = in them
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

async function testConnection() {
  console.log("🔌 Testing SQL Database Connection...");
  console.log("");
  console.log("📋 Connection Details:");
  console.log(`   Server: ${SQL_SERVER}`);
  console.log(`   Database: ${SQL_DATABASE}`);
  console.log(`   User: ${SQL_USER || "(from connection string)"}`);
  console.log("");

  // Check if credentials are provided
  if (!SQL_CONNECTION_STRING && (!SQL_USER || !SQL_PASSWORD)) {
    console.error("❌ Error: SQL credentials not found!");
    console.error("");
    console.error("Please set one of the following in your env file:");
    console.error("   - AZURE_SQL_CONNECTION_STRING");
    console.error("   - OR AZURE_SQL_USER and AZURE_SQL_PASSWORD");
    console.error("");
    console.error("Example:");
    console.error("   AZURE_SQL_USER=your_username");
    console.error("   AZURE_SQL_PASSWORD=your_password");
    process.exit(1);
  }

  let pool: sql.ConnectionPool | null = null;

  try {
    console.log("🔄 Connecting to Azure SQL Database...");

    // Always use individual credentials if provided (prioritize over connection string)
    // Only use connection string if individual credentials are not available
    let config: sql.config;
    
    if (SQL_USER && SQL_PASSWORD) {
      // Use individual credentials (preferred)
      console.log("   Using individual credentials");
      config = {
        server: SQL_SERVER,
        database: SQL_DATABASE,
        user: SQL_USER,
        password: SQL_PASSWORD,
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
        pool: {
          max: 1,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };
    } else if (SQL_CONNECTION_STRING) {
      // Parse connection string only if individual credentials not available
      console.log("   Using connection string");
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
        pool: {
          max: 1,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };
    } else {
      throw new Error("No credentials provided");
    }

    // Create connection pool
    pool = new sql.ConnectionPool(config);
    
    // Connect with timeout
    console.log("   Attempting connection...");
    await Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Connection timeout after 30 seconds")), 30000)
      )
    ]);

    console.log("✅ Connected successfully!");
    console.log("");

    // Test query
    console.log("🧪 Running test query...");
    const request = pool.request();
    const result = await request.query("SELECT @@VERSION AS Version, DB_NAME() AS DatabaseName, SYSTEM_USER AS CurrentUser");
    
    if (result.recordset && result.recordset.length > 0) {
      const row = result.recordset[0];
      console.log("✅ Test query successful!");
      console.log("");
      console.log("📊 Database Information:");
      console.log(`   Database: ${row.DatabaseName}`);
      console.log(`   Current User: ${row.CurrentUser}`);
      console.log(`   SQL Server Version: ${(row.Version as string).split('\n')[0]}`);
      console.log("");
    }

    console.log("🎉 Connection test passed!");
    console.log("");
    console.log("✅ Your SQL Database credentials are working correctly!");
    console.log("");
    console.log("Next steps:");
    console.log("   1. Run: npm run create-sql-tables");
    console.log("   2. Run: npm run test-sql-storage");

  } catch (error: any) {
    console.error("");
    console.error("❌ Connection failed!");
    console.error("");
    console.error("Error details:");
    console.error(`   Message: ${error.message}`);
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    
    if (error.number) {
      console.error(`   SQL Error Number: ${error.number}`);
    }

    console.error("");
    console.error("🔍 Troubleshooting:");
    
    if (error.message.includes("Login failed")) {
      console.error("   ❌ Login failed - Check your username and password");
      console.error("   💡 Make sure SQL authentication is enabled in Azure Portal");
      console.error("   💡 Verify credentials in your env file");
    } else if (error.message.includes("Cannot open server")) {
      console.error("   ❌ Cannot open server - Check firewall rules");
      console.error("   💡 Add your IP address in Azure Portal > Networking");
      console.error("   💡 Enable 'Allow Azure services' if needed");
    } else if (error.message.includes("timeout")) {
      console.error("   ❌ Connection timeout - Check network/firewall");
      console.error("   💡 Verify server name is correct");
      console.error("   💡 Check firewall rules in Azure Portal");
    } else if (error.message.includes("getaddrinfo")) {
      console.error("   ❌ DNS resolution failed - Check server name");
      console.error("   💡 Verify server name: k2sqldatabaseserver.database.windows.net");
    }
    
    console.error("");
    console.error("📚 For help, see:");
    console.error("   - GET-SQL-CREDENTIALS.md");
    console.error("   - FIND-SQL-ADMINISTRATORS.md");
    console.error("   - ALTERNATIVE-SETUP-METHODS.md");
    
    process.exit(1);
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log("🔌 Connection closed");
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
}

// Run the test
testConnection();

