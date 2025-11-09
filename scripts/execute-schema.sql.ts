/**
 * Script to execute database schema.sql file on Azure SQL Server
 * 
 * This script reads the schema.sql file and executes it to create all tables,
 * indexes, and triggers in the Azure SQL Database.
 * 
 * Usage: npx tsx scripts/execute-schema.sql.ts
 *        npm run execute-schema
 */

import "dotenv/config";
import sql from "mssql";
import { readFileSync } from "fs";
import { join } from "path";

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

/**
 * Extract SQL blocks by finding patterns for table/trigger creation
 * Separates table creation blocks from trigger creation blocks
 */
function extractSQLBlocks(sql: string): { tableBlocks: string[]; triggerBlocks: string[] } {
  const tableBlocks: string[] = [];
  const triggerBlocks: string[] = [];
  
  // Pattern for table/index creation: IF NOT EXISTS (SELECT * FROM sys.objects WHERE ... type in (N'U'))
  const tablePattern = /IF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+\*\s+FROM\s+sys\.objects\s+WHERE[^)]+type\s+in\s*\(\s*N'U'\s*\)[^)]*\)\s*BEGIN[\s\S]*?END\s*;?/gi;
  
  // Pattern for trigger creation: IF NOT EXISTS (SELECT * FROM sys.triggers WHERE ...)
  // Need to match the full EXEC() block which contains nested single quotes
  // Match from IF NOT EXISTS to the matching END; that closes the BEGIN
  const triggerPattern = /IF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+\*\s+FROM\s+sys\.triggers\s+WHERE[^)]+\)\s*BEGIN[\s\S]*?END\s*;?/gi;
  
  // But EXEC() with nested quotes is tricky - we need to match the full block
  // Let's use a more specific pattern that accounts for the EXEC('...') structure
  
  // Extract table blocks
  let match;
  while ((match = tablePattern.exec(sql)) !== null) {
    const block = match[0].trim();
    if (block.length > 50) {
      tableBlocks.push(block);
    }
  }
  
  // Extract trigger blocks - need to handle EXEC() with nested quotes carefully
  // The pattern: IF NOT EXISTS ... BEGIN EXEC('...CREATE TRIGGER...') END;
  // We'll match from IF NOT EXISTS to the closing END; but need to handle nested quotes in EXEC()
  let triggerMatch;
  const triggerStartPattern = /IF\s+NOT\s+EXISTS\s*\(\s*SELECT\s+\*\s+FROM\s+sys\.triggers\s+WHERE[^)]+\)\s*BEGIN/gi;
  
  while ((triggerMatch = triggerStartPattern.exec(sql)) !== null) {
    const startPos = triggerMatch.index;
    let pos = startPos + triggerMatch[0].length;
    let depth = 1; // We're inside one BEGIN
    let inString = false;
    let stringChar = '';
    let foundEnd = false;
    
    // Find the matching END;
    while (pos < sql.length && depth > 0) {
      const char = sql[pos];
      const nextChars = sql.substring(pos, pos + 5);
      
      // Handle string literals (single quotes)
      if ((char === "'" || char === '"') && (pos === 0 || sql[pos - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          // Check if it's an escaped quote (two single quotes in SQL Server)
          if (char === "'" && sql[pos + 1] === "'") {
            pos += 2; // Skip the escaped quote
            continue;
          }
          inString = false;
          stringChar = '';
        }
      }
      
      // Only check for BEGIN/END outside of strings
      if (!inString) {
        if (nextChars.match(/^\s+BEGIN\s/i)) {
          depth++;
          pos += 5;
          continue;
        } else if (nextChars.match(/^\s+END\s/i)) {
          depth--;
          if (depth === 0) {
            // Found matching END, check for semicolon
            let endPos = pos + 3;
            while (endPos < sql.length && (sql[endPos] === ' ' || sql[endPos] === ';')) {
              if (sql[endPos] === ';') {
                endPos++;
                break;
              }
              endPos++;
            }
            const block = sql.substring(startPos, endPos).trim();
            if (block.length > 50) {
              triggerBlocks.push(block);
            }
            foundEnd = true;
            break;
          }
          pos += 3;
          continue;
        }
      }
      
      pos++;
    }
  }
  
  return { tableBlocks, triggerBlocks };
}

/**
 * Extract trigger name from CREATE TRIGGER statement
 */
function extractTriggerName(triggerSQL: string): string {
  const match = triggerSQL.match(/CREATE\s+TRIGGER\s+\[?([^\s\[\]]+)\]?/i);
  return match ? match[1] : '';
}

async function executeSchema() {
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
      console.error("   1. Command line: npx tsx scripts/execute-schema.sql.ts -- user=username password='password'");
      console.error("   2. Environment variables in .env file: AZURE_SQL_USER and AZURE_SQL_PASSWORD");
      console.error("   3. Connection string: AZURE_SQL_CONNECTION_STRING");
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
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
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
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
      };
    } else {
      throw new Error("No credentials provided");
    }

    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("✅ Connected to Azure SQL Database\n");

    // Read schema.sql file
    const schemaPath = join(process.cwd(), "database", "schema.sql");
    console.log(`📖 Reading schema file: ${schemaPath}`);
    
    let schemaSQL: string;
    try {
      schemaSQL = readFileSync(schemaPath, "utf-8");
      console.log(`✅ Schema file read successfully (${schemaSQL.length} characters)\n`);
    } catch (error) {
      console.error(`❌ Error reading schema file: ${error}`);
      throw error;
    }

    // Execute the schema SQL
    console.log("🚀 Executing schema SQL...\n");
    const request = pool.request();
    
    let executed = false;

    // First, try executing the entire SQL file as a single batch
    // SQL Server should handle IF NOT EXISTS blocks correctly
    try {
      console.log("   Attempting to execute entire schema file as single batch...");
      await request.query(schemaSQL);
      console.log("✅ Schema SQL executed successfully as single batch!\n");
      executed = true;
    } catch (error: any) {
      console.log(`⚠️  Single batch execution failed: ${error.message.substring(0, 200)}`);
      console.log("   Falling back to block-by-block execution...\n");
    }

    // If single batch failed, execute block by block
    if (!executed) {
      console.log("   Extracting SQL blocks...");
      const { tableBlocks, triggerBlocks } = extractSQLBlocks(schemaSQL);
      console.log(`   Found ${tableBlocks.length} table blocks and ${triggerBlocks.length} trigger blocks\n`);

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      // Execute table blocks first (tables must exist before triggers)
      console.log("   Executing table creation blocks...");
      for (let i = 0; i < tableBlocks.length; i++) {
        const block = tableBlocks[i];
        
        try {
          await request.query(block);
          successCount++;
          console.log(`   ✅ Table block ${i + 1}/${tableBlocks.length} executed`);
        } catch (blockError: any) {
          const errorMsg = blockError.message || "";
          const errorNumber = blockError.number;
          
          // Check if error is because object already exists (expected and OK)
          if (
            errorNumber === 2714 || // Object already exists
            errorNumber === 1913 || // Object already exists
            errorNumber === 1750 || // Could not create constraint
            errorMsg.includes("already exists") ||
            errorMsg.includes("already an object") ||
            errorMsg.includes("duplicate key") ||
            errorMsg.includes("There is already an object named") ||
            (errorMsg.includes("Cannot create") && errorMsg.includes("because it already exists"))
          ) {
            skipCount++;
            console.log(`   ℹ️  Table block ${i + 1}/${tableBlocks.length}: Already exists (skipped)`);
          } else {
            errorCount++;
            console.error(`   ❌ Table block ${i + 1}/${tableBlocks.length} failed:`);
            console.error(`      ${errorMsg.substring(0, 200)}`);
            // Show table name if we can extract it
            const tableMatch = block.match(/\[dbo\]\.\[([^\]]+)\]/);
            if (tableMatch) {
              console.error(`      Table: ${tableMatch[1]}`);
            }
          }
        }
      }

      // Execute trigger blocks after tables are created
      console.log("\n   Executing trigger creation blocks...");
      for (let i = 0; i < triggerBlocks.length; i++) {
        const block = triggerBlocks[i];
        
        try {
          // Triggers with EXEC() need special handling
          // Extract the CREATE TRIGGER statement from inside EXEC('...')
          // and execute it directly instead of through EXEC()
          let triggerSQL = block;
          
          // Try to extract the CREATE TRIGGER statement from EXEC('...')
          const execMatch = block.match(/EXEC\s*\(\s*'([\s\S]*?)'\s*\)/i);
          if (execMatch && execMatch[1]) {
            // Found EXEC('...'), extract the SQL inside
            const innerSQL = execMatch[1]
              .replace(/''/g, "'") // Unescape single quotes (SQL Server uses '' for ')
              .trim();
            
            // Replace the EXEC() with direct CREATE TRIGGER
            // But we still need the IF NOT EXISTS check
            const ifNotExistsMatch = block.match(/(IF\s+NOT\s+EXISTS[^B]*BEGIN)/i);
            if (ifNotExistsMatch) {
              // Use a simpler approach: just execute the CREATE TRIGGER directly
              // SQL Server will error if it exists, which is fine
              triggerSQL = `IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = '${extractTriggerName(innerSQL)}')\nBEGIN\n${innerSQL}\nEND;`;
            } else {
              triggerSQL = innerSQL;
            }
          }
          
          await request.query(triggerSQL);
          successCount++;
          console.log(`   ✅ Trigger block ${i + 1}/${triggerBlocks.length} executed`);
        } catch (blockError: any) {
          const errorMsg = blockError.message || "";
          const errorNumber = blockError.number;
          
          // Check if error is because object already exists
          if (
            errorNumber === 2714 || // Object already exists
            errorNumber === 1913 || // Object already exists
            errorMsg.includes("already exists") ||
            errorMsg.includes("already an object") ||
            errorMsg.includes("There is already an object named")
          ) {
            skipCount++;
            console.log(`   ℹ️  Trigger block ${i + 1}/${triggerBlocks.length}: Already exists (skipped)`);
          } else {
            errorCount++;
            console.error(`   ❌ Trigger block ${i + 1}/${triggerBlocks.length} failed:`);
            console.error(`      ${errorMsg.substring(0, 200)}`);
            // Show trigger name if we can extract it
            const triggerMatch = block.match(/name\s*=\s*['"]([^'"]+)['"]/i);
            if (triggerMatch) {
              console.error(`      Trigger: ${triggerMatch[1]}`);
            }
          }
        }
      }

      console.log(`\n✅ Block execution complete!`);
      console.log(`   - Successfully executed: ${successCount}`);
      console.log(`   - Skipped (already exists): ${skipCount}`);
      console.log(`   - Errors: ${errorCount}\n`);
    }

    // Verify tables were created
    console.log("🔍 Verifying tables...");
    const verifyRequest = pool.request();
    const tablesResult = await verifyRequest.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_SCHEMA = 'dbo'
      ORDER BY TABLE_NAME
    `);

    const existingTables = tablesResult.recordset.map((r: any) => r.TABLE_NAME);
    console.log(`\n📊 Found ${existingTables.length} tables in database:`);
    existingTables.forEach((table: string) => {
      console.log(`   - ${table}`);
    });

    // Expected tables from schema
    const expectedTables = [
      "insurer_table",
      "provider_table",
      "user_table",
      "doctorInformation_table",
      "userAppointmentScheduled_table",
      "LabReport",
      "insurance_benefits",
      "eob_records"
    ];

    console.log("\n✅ Expected tables status:");
    const missingTables: string[] = [];
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        missingTables.push(table);
      }
    });

    // Verify triggers
    console.log("\n🔍 Verifying triggers...");
    const triggersResult = await verifyRequest.query(`
      SELECT name 
      FROM sys.triggers 
      WHERE is_ms_shipped = 0
      ORDER BY name
    `);

    const existingTriggers = triggersResult.recordset.map((r: any) => r.name);
    console.log(`\n📊 Found ${existingTriggers.length} triggers in database:`);
    existingTriggers.forEach((trigger: string) => {
      console.log(`   - ${trigger}`);
    });

    const expectedTriggers = [
      "trg_insurer_updated_at",
      "trg_provider_updated_at",
      "trg_user_updated_at",
      "trg_doctor_updated_at",
      "trg_appointment_updated_at",
      "trg_labreport_updated_at",
      "trg_benefits_updated_at",
      "trg_eob_updated_at"
    ];

    console.log("\n✅ Expected triggers status:");
    const missingTriggers: string[] = [];
    expectedTriggers.forEach(trigger => {
      if (existingTriggers.includes(trigger)) {
        console.log(`   ✅ ${trigger}`);
      } else {
        console.log(`   ❌ ${trigger} - MISSING`);
        missingTriggers.push(trigger);
      }
    });

    console.log("\n🎉 Schema execution completed!");
    console.log("\n📋 Summary:");
    console.log(`   - Tables: ${existingTables.length} found, ${expectedTables.length} expected`);
    if (missingTables.length > 0) {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(", ")}`);
    }
    console.log(`   - Triggers: ${existingTriggers.length} found, ${expectedTriggers.length} expected`);
    if (missingTriggers.length > 0) {
      console.log(`   ⚠️  Missing triggers: ${missingTriggers.join(", ")}`);
    }

    if (missingTables.length === 0 && missingTriggers.length === 0) {
      console.log("\n✅ All tables and triggers are present!");
    } else {
      console.log("\n⚠️  Some tables or triggers are missing. Check errors above.");
      if (missingTables.length > 0 || missingTriggers.length > 0) {
        process.exit(1);
      }
    }

  } catch (error: any) {
    console.error("\n❌ Error executing schema:", error.message);
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
      console.log("\n🔌 Connection closed");
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

executeSchema();
