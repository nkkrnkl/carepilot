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
 */
export async function downloadDoctorsData(): Promise<any[]> {
  try {
    const container = await getContainerClient();
    const blobName = "doctors.json";
    const blockBlobClient = container.getBlockBlobClient(blobName);
    
    // Check if blob exists
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.warn("Doctors data blob does not exist in Azure Blob Storage");
      return [];
    }
    
    // Download blob content
    const downloadResponse = await blockBlobClient.download(0);
    const content = await streamToText(downloadResponse.readableStreamBody);
    const doctors = JSON.parse(content);
    
    return doctors;
  } catch (error) {
    console.error("Error downloading doctors data from Azure Blob Storage:", error);
    // Return empty array on error to prevent app crash
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

