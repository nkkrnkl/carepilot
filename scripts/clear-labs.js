#!/usr/bin/env node
/**
 * Clear all lab reports from the database
 * This script runs before npm run dev to clear data for debugging
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearLabs() {
  try {
    // Check if DATABASE_URL is set (required for Prisma)
    if (!process.env.DATABASE_URL) {
      console.log("⚠️  DATABASE_URL not set, skipping lab report cleanup");
      console.log("   (This is normal if you're not using Prisma for lab reports)");
      return;
    }

    const userId = "demo-user";
    const result = await prisma.labReport.deleteMany({
      where: { userId },
    });
    console.log(`✓ Cleared ${result.count} lab report(s) for debugging`);
  } catch (error) {
    // Don't exit on error - just log it and continue
    console.error("⚠️  Error clearing lab reports (non-fatal):", error.message || error);
    console.log("   Continuing with dev server startup...");
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  }
}

clearLabs();

