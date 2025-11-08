/**
 * Azure Blob Storage client for CarePilot
 * Handles uploading and downloading doctor/provider data
 */

import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const CONTAINER_NAME = process.env.AZURE_BLOB_CONTAINER_NAME || "doctor-data";

let blobServiceClient: BlobServiceClient | null = null;
let containerClient: ContainerClient | null = null;

/**
 * Initialize Azure Blob Storage client
 */
function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error("AZURE_STORAGE_CONNECTION_STRING environment variable is not set");
    }
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  }
  return blobServiceClient;
}

/**
 * Get container client, create if it doesn't exist
 */
async function getContainerClient(): Promise<ContainerClient> {
  if (!containerClient) {
    const serviceClient = getBlobServiceClient();
    containerClient = serviceClient.getContainerClient(CONTAINER_NAME);
    
    // Create container if it doesn't exist (only if we have permission)
    try {
      await containerClient.createIfNotExists({
        access: 'blob' // Public read access
      });
    } catch (error) {
      console.warn("Could not create container (may already exist or insufficient permissions):", error);
    }
  }
  return containerClient;
}

/**
 * Upload doctors data to Azure Blob Storage
 */
export async function uploadDoctorsData(doctors: any[]): Promise<string> {
  try {
    const container = await getContainerClient();
    const blobName = "doctors.json";
    const blockBlobClient = container.getBlockBlobClient(blobName);
    
    const data = JSON.stringify(doctors, null, 2);
    const uploadResponse = await blockBlobClient.upload(data, data.length, {
      blobHTTPHeaders: {
        blobContentType: "application/json"
      }
    });
    
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading doctors data to Azure Blob Storage:", error);
    throw error;
  }
}

/**
 * Download doctors data from Azure Blob Storage
 * Falls back to public URL if connection string is not available
 */
export async function downloadDoctorsData(): Promise<any[]> {
  // Try using Azure SDK first (if connection string is available)
  if (AZURE_STORAGE_CONNECTION_STRING) {
    try {
      console.log("🔍 Attempting to fetch doctors data using Azure SDK...");
      console.log(`📍 Container: ${CONTAINER_NAME}`);
      
      const container = await getContainerClient();
      const blobName = "doctors.json";
      const blockBlobClient = container.getBlockBlobClient(blobName);
      
      // Check if blob exists
      console.log("🔍 Checking if blob exists...");
      const exists = await blockBlobClient.exists();
      if (!exists) {
        console.error(`❌ Blob '${blobName}' does not exist in container '${CONTAINER_NAME}'`);
        console.error("   Please verify that the blob was uploaded successfully.");
        return [];
      }
      
      console.log("✅ Blob exists, downloading content...");
      // Download blob content
      const downloadResponse = await blockBlobClient.download(0);
      const content = await streamToText(downloadResponse.readableStreamBody);
      
      console.log(`📦 Downloaded ${content.length} bytes`);
      
      let doctors;
      try {
        doctors = JSON.parse(content);
      } catch (parseError: any) {
        console.error("❌ Failed to parse JSON:", parseError.message);
        console.error("Content preview:", content.substring(0, 200));
        return [];
      }
      
      if (!Array.isArray(doctors)) {
        console.error("❌ Data is not an array:", typeof doctors);
        return [];
      }
      
      console.log(`✅ Successfully loaded ${doctors.length} doctors from Azure Blob Storage (SDK)`);
      return doctors;
    } catch (error: any) {
      console.error("❌ Error downloading via Azure SDK:", error.message || error);
      console.error("Full error:", error);
      // Don't fall back to public URL if we have connection string - the error should be fixed
      return [];
    }
  } else {
    // Connection string not available
    console.warn("⚠️  AZURE_STORAGE_CONNECTION_STRING is not set in environment variables");
    console.warn("   Please run: ./scripts/setup-env.sh");
    console.warn("   Or set AZURE_STORAGE_CONNECTION_STRING in your .env file");
    
    // Try public URL as last resort (but it likely won't work if storage account doesn't allow public access)
    console.log("🔄 Attempting public URL as fallback...");
    return await fetchFromPublicUrl();
  }
}

/**
 * Fetch doctors data from public blob URL
 * This works when the container has public read access
 */
async function fetchFromPublicUrl(): Promise<any[]> {
  try {
    // Public URL for the doctors.json blob
    const PUBLIC_BLOB_URL = "https://hackstoragexz.blob.core.windows.net/doctor-data/doctors.json";
    
    console.log(`Fetching doctors data from public URL: ${PUBLIC_BLOB_URL}`);
    
    // Use standard fetch (no Next.js-specific options in API routes)
    const response = await fetch(PUBLIC_BLOB_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Disable caching to always get fresh data
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Public URL fetch failed: ${response.status} ${response.statusText}`);
      console.error(`Response: ${errorText.substring(0, 200)}`);
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Parse JSON
    let doctors;
    try {
      doctors = JSON.parse(text);
    } catch (parseError: any) {
      console.error("Failed to parse JSON response:", parseError.message);
      console.error("Response preview:", text.substring(0, 500));
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
    
    if (!Array.isArray(doctors)) {
      console.warn("Data from blob is not an array:", typeof doctors);
      return [];
    }
    
    console.log(`✅ Successfully loaded ${doctors.length} doctors from Azure Blob Storage (public URL)`);
    return doctors;
  } catch (error: any) {
    console.error("Error fetching doctors data from public URL:", error.message || error);
    console.error("Full error:", error);
    return [];
  }
}

/**
 * Convert stream to text
 */
async function streamToText(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    return "";
  }
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });
    readableStream.on('error', reject);
  });
}

/**
 * Get the public URL for the doctors data blob
 */
export async function getDoctorsDataUrl(): Promise<string | null> {
  try {
    const container = await getContainerClient();
    const blobName = "doctors.json";
    const blockBlobClient = container.getBlockBlobClient(blobName);
    
    const exists = await blockBlobClient.exists();
    if (!exists) {
      return null;
    }
    
    return blockBlobClient.url;
  } catch (error) {
    console.error("Error getting doctors data URL:", error);
    return null;
  }
}

