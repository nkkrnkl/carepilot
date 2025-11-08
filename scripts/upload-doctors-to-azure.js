/**
 * Script to upload mock doctors data to Azure Blob Storage
 * 
 * Prerequisites:
 * 1. Set AZURE_STORAGE_CONNECTION_STRING environment variable
 * 2. Set AZURE_BLOB_CONTAINER_NAME environment variable (optional, defaults to 'carepilot-data')
 * 
 * Run with: node scripts/upload-doctors-to-azure.js
 */

require('dotenv').config();
const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require('fs');
const path = require('path');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_BLOB_CONTAINER_NAME || "carepilot-data";
const DOCTORS_FILE_PATH = path.join(__dirname, '../data/doctors.json');

async function uploadDoctorsToAzure() {
  try {
    // Check if connection string is set
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      console.error("❌ Error: AZURE_STORAGE_CONNECTION_STRING environment variable is not set");
      console.log("\nPlease set it in your .env file:");
      console.log("AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here");
      process.exit(1);
    }

    // Check if doctors.json exists
    if (!fs.existsSync(DOCTORS_FILE_PATH)) {
      console.error("❌ Error: doctors.json file not found");
      console.log(`Expected location: ${DOCTORS_FILE_PATH}`);
      console.log("\nPlease run 'node scripts/generate-mock-doctors.js' first");
      process.exit(1);
    }

    // Read doctors data
    console.log("📖 Reading doctors data from file...");
    const doctorsData = fs.readFileSync(DOCTORS_FILE_PATH, 'utf-8');
    const doctors = JSON.parse(doctorsData);
    console.log(`✅ Found ${doctors.length} doctors in file`);

    // Initialize Blob Service Client
    console.log("🔌 Connecting to Azure Blob Storage...");
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    // Get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Create container if it doesn't exist
    console.log(`📦 Creating container '${CONTAINER_NAME}' if it doesn't exist...`);
    await containerClient.createIfNotExists({
      access: 'blob' // Public read access
    });
    console.log("✅ Container ready");

    // Upload blob
    const blobName = "doctors.json";
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    console.log(`📤 Uploading ${doctors.length} doctors to Azure Blob Storage...`);
    const uploadResponse = await blockBlobClient.upload(doctorsData, doctorsData.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      }
    });
    
    console.log("✅ Upload successful!");
    console.log(`\n📊 Upload details:`);
    console.log(`   - Container: ${CONTAINER_NAME}`);
    console.log(`   - Blob: ${blobName}`);
    console.log(`   - URL: ${blockBlobClient.url}`);
    console.log(`   - ETag: ${uploadResponse.etag}`);
    console.log(`   - Size: ${doctorsData.length} bytes`);
    
    console.log(`\n🌐 Your doctors data is now available at:`);
    console.log(`   ${blockBlobClient.url}`);
    
  } catch (error) {
    console.error("❌ Error uploading to Azure Blob Storage:", error.message);
    if (error.code === "InvalidConnectionString") {
      console.log("\n💡 Tip: Check your AZURE_STORAGE_CONNECTION_STRING in your .env file");
    }
    process.exit(1);
  }
}

// Run the upload
uploadDoctorsToAzure();

