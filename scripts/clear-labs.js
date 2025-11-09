#!/usr/bin/env node
/**
 * Clear all lab reports from the database
 * This script runs before npm run dev to clear data for debugging
 * 
 * NOTE: Prisma has been removed. This script is now a no-op.
 * Lab reports are now stored in SQL Server via the document upload system.
 */

async function clearLabs() {
  console.log("ℹ️  Lab clearing script: Prisma has been removed.");
  console.log("   Lab reports are now managed through SQL Server and the document upload system.");
    console.log("   Continuing with dev server startup...");
}

clearLabs();
