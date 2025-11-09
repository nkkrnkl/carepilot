#!/usr/bin/env tsx
/**
 * Quick script to check all tables for doctors
 */

import "dotenv/config";
import sql from "mssql";

async function checkAllTables() {
  const config = {
    server: process.env.AZURE_SQL_SERVER || "k2sqldatabaseserver.database.windows.net",
    database: process.env.AZURE_SQL_DATABASE || "K2Database",
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false, connectTimeout: 5000 }
  };

  try {
    console.log("🔌 Connecting...");
    const pool = await sql.connect(config);
    
    // Get all tables
    const tables = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log("\n📋 All tables and row counts:\n");
    for (const table of tables.recordset) {
      try {
        const count = await pool.request().query(`SELECT COUNT(*) as count FROM [${table.TABLE_NAME}]`);
        const rowCount = count.recordset[0].count;
        if (rowCount > 0) {
          console.log(`  ${table.TABLE_NAME.padEnd(40)}: ${rowCount} rows`);
          
          // If it has 27 rows, show sample
          if (rowCount === 27 || (rowCount >= 20 && rowCount <= 30)) {
            try {
              const sample = await pool.request().query(`SELECT TOP 1 * FROM [${table.TABLE_NAME}]`);
              if (sample.recordset.length > 0) {
                const cols = Object.keys(sample.recordset[0]);
                console.log(`    ⭐ Columns: ${cols.slice(0, 8).join(", ")}${cols.length > 8 ? "..." : ""}`);
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }
    
    // Specifically check doctorInformation_table
    console.log(`\n🔍 doctorInformation_table:`);
    const doctorCount = await pool.request().query("SELECT COUNT(*) as count FROM doctorInformation_table");
    console.log(`   Total: ${doctorCount.recordset[0].count} rows`);
    
    await pool.close();
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

checkAllTables();

