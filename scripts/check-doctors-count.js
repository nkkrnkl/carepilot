/**
 * Script to check how many doctors are in Azure Blob Storage
 * 
 * Usage: node scripts/check-doctors-count.js
 */

require('dotenv').config();
const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require('fs');
const path = require('path');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_BLOB_CONTAINER_NAME || "doctor-data";
const PUBLIC_BLOB_URL = "https://hackstoragexz.blob.core.windows.net/doctor-data/doctors.json";

async function checkDoctorsCount() {
  console.log("🔍 Checking doctors in Azure Blob Storage...\n");
  
  // Method 1: Try using Azure SDK (if connection string is available)
  if (AZURE_STORAGE_CONNECTION_STRING) {
    try {
      console.log("Method 1: Using Azure SDK...");
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient("doctors.json");
      
      const exists = await blockBlobClient.exists();
      if (exists) {
        const downloadResponse = await blockBlobClient.download(0);
        const content = await streamToText(downloadResponse.readableStreamBody);
        const doctors = JSON.parse(content);
        console.log(`✅ Found ${doctors.length} doctors in blob storage (via SDK)`);
        console.log(`📊 Blob size: ${content.length} bytes`);
        console.log(`🔗 URL: ${blockBlobClient.url}`);
        return doctors.length;
      }
    } catch (error) {
      console.log(`⚠️  SDK method failed: ${error.message}`);
      console.log("Trying public URL method...\n");
    }
  }
  
  // Method 2: Fetch from public URL
  try {
    console.log("Method 2: Fetching from public URL...");
    const https = require('https');
    const url = require('url');
    
    const doctors = await fetchFromPublicUrl();
    console.log(`✅ Found ${doctors.length} doctors in blob storage (via public URL)`);
    console.log(`🔗 URL: ${PUBLIC_BLOB_URL}`);
    return doctors.length;
  } catch (error) {
    console.error(`❌ Public URL method failed: ${error.message}`);
  }
  
  // Method 3: Check local file
  const localFile = path.join(__dirname, '../data/doctors.json');
  if (fs.existsSync(localFile)) {
    const localData = JSON.parse(fs.readFileSync(localFile, 'utf-8'));
    console.log(`\n📁 Local file has ${localData.length} doctors`);
    console.log(`💡 Note: This is the local file, not from blob storage`);
  }
  
  return 0;
}

function streamToText(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    readableStream.on('error', reject);
  });
}

async function fetchFromPublicUrl() {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const url = require('url');
    
    const options = url.parse(PUBLIC_BLOB_URL);
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const doctors = JSON.parse(data);
          resolve(doctors);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Run the check
checkDoctorsCount().then((count) => {
  if (count > 0) {
    console.log(`\n✅ Successfully verified: ${count} doctors in Azure Blob Storage`);
  } else {
    console.log(`\n⚠️  Could not verify doctors count from blob storage`);
  }
  process.exit(count > 0 ? 0 : 1);
});

