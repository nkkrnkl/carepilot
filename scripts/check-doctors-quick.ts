#!/usr/bin/env tsx
/**
 * Quick script to check doctorInformation_table
 */

import "dotenv/config";
import sql from "mssql";

async function quickCheck() {
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
    
    // Quick count
    const count = await pool.request().query("SELECT COUNT(*) as count FROM doctorInformation_table");
    console.log(`\n📊 Total doctors: ${count.recordset[0].count}\n`);
    
    if (count.recordset[0].count > 0) {
      // Get first 5
      const sample = await pool.request().query("SELECT TOP 5 id, name, specialty FROM doctorInformation_table");
      console.log("Sample doctors:");
      sample.recordset.forEach((d: any, i: number) => {
        console.log(`  ${i + 1}. ${d.name} - ${d.specialty || "N/A"}`);
      });
    }
    
    await pool.close();
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

quickCheck();

