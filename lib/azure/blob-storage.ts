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
      const container = await getContainerClient();
      const blobName = "doctors.json";
      const blockBlobClient = container.getBlockBlobClient(blobName);
      
      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) {
        console.warn("Doctors data blob does not exist in Azure Blob Storage, trying public URL");
        return await fetchFromPublicUrl();
      }
      
      // Download blob content
      const downloadResponse = await blockBlobClient.download(0);
      const content = await streamToText(downloadResponse.readableStreamBody);
      const doctors = JSON.parse(content);
      
      console.log(`✅ Successfully loaded ${doctors.length} doctors from Azure Blob Storage (SDK)`);
      return doctors;
    } catch (error) {
      console.warn("Error downloading via Azure SDK, trying public URL:", error);
      return await fetchFromPublicUrl();
    }
  } else {
    // Connection string not available, use public URL
    console.log("No connection string available, fetching from public blob URL");
    return await fetchFromPublicUrl();
  }
}

/**
 * Fetch doctors data from public blob URL
 */
async function fetchFromPublicUrl(): Promise<any[]> {
  try {
    // Public URL for the doctors.json blob
    const PUBLIC_BLOB_URL = "https://hackstoragexz.blob.core.windows.net/doctor-data/doctors.json";
    
    console.log(`Fetching doctors data from: ${PUBLIC_BLOB_URL}`);
    const response = await fetch(PUBLIC_BLOB_URL, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const doctors = await response.json();
    console.log(`✅ Successfully loaded ${doctors.length} doctors from Azure Blob Storage (public URL)`);
    return Array.isArray(doctors) ? doctors : [];
  } catch (error) {
    console.error("Error fetching doctors data from public URL:", error);
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

