/**
 * Script to list all containers in an Azure Storage Account
 * 
 * Usage: node scripts/list-azure-containers.js
 * 
 * Make sure AZURE_STORAGE_CONNECTION_STRING is set in your .env file
 */

require('dotenv').config();
const { BlobServiceClient } = require("@azure/storage-blob");

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

async function listContainers() {
  try {
    // Check if connection string is set
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      console.error("❌ Error: AZURE_STORAGE_CONNECTION_STRING environment variable is not set");
      console.log("\nPlease set it in your .env file:");
      console.log("AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here");
      process.exit(1);
    }

    console.log("🔌 Connecting to Azure Blob Storage...");
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    console.log("📦 Listing containers...\n");
    
    let containerCount = 0;
    for await (const container of blobServiceClient.listContainers()) {
      containerCount++;
      console.log(`Container ${containerCount}:`);
      console.log(`  Name: ${container.name}`);
      console.log(`  Public Access: ${container.properties.publicAccess || 'Private'}`);
      console.log(`  Last Modified: ${container.properties.lastModified ? new Date(container.properties.lastModified).toLocaleString() : 'N/A'}`);
      console.log(`  Lease State: ${container.properties.leaseState || 'N/A'}`);
      console.log(`  Has Immutability Policy: ${container.properties.hasImmutabilityPolicy || false}`);
      console.log(`  Has Legal Hold: ${container.properties.hasLegalHold || false}`);
      console.log("");
    }

    if (containerCount === 0) {
      console.log("No containers found in the storage account.");
    } else {
      console.log(`✅ Found ${containerCount} container(s)`);
    }

    // Also show account info
    console.log("\n📊 Account Information:");
    const accountName = AZURE_STORAGE_CONNECTION_STRING.match(/AccountName=([^;]+)/)?.[1] || 'Unknown';
    console.log(`  Account Name: ${accountName}`);
    
  } catch (error) {
    console.error("❌ Error listing containers:", error.message);
    if (error.code === "InvalidConnectionString") {
      console.log("\n💡 Tip: Check your AZURE_STORAGE_CONNECTION_STRING in your .env file");
    } else if (error.statusCode === 403) {
      console.log("\n💡 Tip: Check your storage account permissions");
    }
    process.exit(1);
  }
}

// Run the script
listContainers();

