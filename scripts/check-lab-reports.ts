#!/usr/bin/env tsx
/**
 * Script to check lab reports stored in Azure SQL Database
 * 
 * Usage:
 *   npm run check-lab-reports <userId>
 *   or
 *   tsx scripts/check-lab-reports.ts <userId>
 * 
 * If no userId is provided, it will list all lab reports
 */

import { getLabReportsByUserId, getLabReportById } from "../lib/azure/sql-storage";

async function main() {
  const args = process.argv.slice(2);
  const userId = args[0];
  const reportId = args[1];

  try {
    if (reportId) {
      // Get specific report
      console.log(`\n🔍 Fetching lab report: ${reportId}...\n`);
      const report = await getLabReportById(reportId);
      
      if (!report) {
        console.log(`❌ Lab report not found: ${reportId}`);
        process.exit(1);
      }

      console.log("✅ Lab Report Found:");
      console.log("=".repeat(80));
      console.log(`ID: ${report.id}`);
      console.log(`User ID: ${report.userId}`);
      console.log(`Title: ${report.title || "N/A"}`);
      console.log(`Date: ${report.date || "N/A"}`);
      console.log(`Hospital: ${report.hospital || "N/A"}`);
      console.log(`Doctor: ${report.doctor || "N/A"}`);
      console.log(`Created At: ${report.createdAt || "N/A"}`);
      console.log(`Updated At: ${report.updatedAt || "N/A"}`);
      
      if (report.parameters) {
        try {
          const params = JSON.parse(report.parameters);
          console.log("\n📊 Parameters:");
          console.log(JSON.stringify(params, null, 2));
        } catch (e) {
          console.log("\n📊 Parameters (raw):", report.parameters.substring(0, 200) + "...");
        }
      }
      
      if (report.rawExtract) {
        try {
          const raw = JSON.parse(report.rawExtract);
          console.log("\n🔬 Raw Extract (workflow completed):", raw.workflow_completed || false);
          if (raw.dashboard) {
            console.log("  - Dashboard data available");
            if (raw.dashboard.table_compact) {
              console.log(`  - Table rows: ${raw.dashboard.table_compact.rows?.length || 0}`);
            }
            if (raw.dashboard.summary_cards) {
              console.log(`  - Summary cards: ${raw.dashboard.summary_cards.length || 0}`);
            }
            if (raw.dashboard.condition_flags) {
              console.log(`  - Condition flags: ${raw.dashboard.condition_flags.length || 0}`);
            }
          }
          if (raw.steps) {
            console.log("  - Steps completed:", Object.keys(raw.steps).length);
          }
        } catch (e) {
          console.log("\n🔬 Raw Extract (raw, first 500 chars):", report.rawExtract.substring(0, 500) + "...");
        }
      }
      
      console.log("=".repeat(80));
      
    } else if (userId) {
      // Get all reports for user
      console.log(`\n🔍 Fetching lab reports for user: ${userId}...\n`);
      const reports = await getLabReportsByUserId(userId);
      
      if (reports.length === 0) {
        console.log(`❌ No lab reports found for user: ${userId}`);
        console.log("\n💡 This could mean:");
        console.log("   - No lab reports have been uploaded yet");
        console.log("   - The lab agent extraction failed");
        console.log("   - The user ID is incorrect");
        process.exit(0);
      }

      console.log(`✅ Found ${reports.length} lab report(s):\n`);
      console.log("=".repeat(80));
      
      reports.forEach((report, index) => {
        console.log(`\n${index + 1}. Lab Report: ${report.id}`);
        console.log(`   Title: ${report.title || "N/A"}`);
        console.log(`   Date: ${report.date || "N/A"}`);
        console.log(`   Hospital: ${report.hospital || "N/A"}`);
        console.log(`   Doctor: ${report.doctor || "N/A"}`);
        console.log(`   Created: ${report.createdAt || "N/A"}`);
        
        // Check if parameters exist
        if (report.parameters) {
          try {
            const params = JSON.parse(report.parameters);
            const hasData = params.table_compact || params.summary_cards || params.condition_flags;
            console.log(`   Status: ${hasData ? "✅ Extracted" : "⚠️  No parameters"}`);
            
            if (params.table_compact?.rows) {
              console.log(`   Parameters: ${params.table_compact.rows.length} rows`);
            }
            if (params.summary_cards) {
              console.log(`   Summary Cards: ${params.summary_cards.length}`);
            }
          } catch (e) {
            console.log(`   Status: ⚠️  Parameters JSON parse error`);
          }
        } else {
          console.log(`   Status: ⚠️  No parameters stored`);
        }
        
        // Check raw extract
        if (report.rawExtract) {
          try {
            const raw = JSON.parse(report.rawExtract);
            console.log(`   Workflow: ${raw.workflow_completed ? "✅ Completed" : "❌ Failed"}`);
          } catch (e) {
            console.log(`   Workflow: ⚠️  Could not parse raw extract`);
          }
        } else {
          console.log(`   Workflow: ⚠️  No raw extract stored`);
        }
      });
      
      console.log("\n" + "=".repeat(80));
      console.log(`\n💡 To view a specific report, run:`);
      console.log(`   npm run check-lab-reports ${userId} <reportId>`);
      
    } else {
      // List all users with lab reports (requires direct SQL query)
      console.log("\n📋 Listing all lab reports in database...\n");
      console.log("💡 Note: To check reports for a specific user, provide userId as argument");
      console.log("   Usage: npm run check-lab-reports <userId>\n");
      
      // For now, just show usage
      console.log("To query all reports, you can use Azure SQL directly:");
      console.log("  SELECT id, userId, title, date, hospital, doctor, createdAt FROM LabReport ORDER BY createdAt DESC;");
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:", error.stack);
    }
    process.exit(1);
  }
}

main();

