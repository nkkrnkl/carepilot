/**
 * Script to delete the document table from Azure Table Storage
 * 
 * Usage: npx tsx scripts/delete-document-table.ts
 */

import "dotenv/config";
import { TableClient } from "@azure/data-tables";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME || "hackstoragexz";
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";

function getTableClient(tableName: string): TableClient {
  if (AZURE_STORAGE_CONNECTION_STRING) {
    return TableClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING, tableName);
  } else if (AZURE_STORAGE_ACCOUNT_KEY) {
    const { AzureNamedKeyCredential } = require("@azure/data-tables");
    const credential = new AzureNamedKeyCredential(AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY);
    return new TableClient(
      `https://${AZURE_STORAGE_ACCOUNT_NAME}.table.core.windows.net`,
      tableName,
      credential
    );
  } else {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_KEY must be set");
  }
}

async function deleteTable(tableName: string): Promise<void> {
  try {
    const tableClient = getTableClient(tableName);
    await tableClient.deleteTable();
    console.log(`✅ Table '${tableName}' deleted successfully`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log(`ℹ️  Table '${tableName}' does not exist (already deleted or never created)`);
    } else {
      console.error(`❌ Error deleting table '${tableName}':`, error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    console.log("🗑️  Deleting document table from Azure Table Storage...");
    await deleteTable("document");
    console.log("✅ Document table deletion completed!");
  } catch (error: any) {
    console.error("❌ Error deleting document table:", error.message);
    process.exit(1);
  }
}

main();

