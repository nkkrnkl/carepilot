#!/usr/bin/env node
/**
 * Clear all lab reports from the database
 * This script runs before npm run dev to clear data for debugging
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function clearLabs() {
  try {
    const userId = "demo-user";
    const result = await prisma.labReport.deleteMany({
      where: { userId },
    });
    console.log(`✓ Cleared ${result.count} lab report(s) for debugging`);
  } catch (error) {
    console.error("Error clearing lab reports:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearLabs();

