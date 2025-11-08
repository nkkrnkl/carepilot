/**
 * Azure Table Storage client for CarePilot
 * Handles user data, insurer data, provider data, and documents
 */

import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME || "hackstoragexz";
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";

// Table names
export const TABLE_NAMES = {
  INSURER: "insurer",
  PROVIDER: "provider",
  USER: "user",
  DOCUMENT: "document",
} as const;

/**
 * Get table client
 */
function getTableClient(tableName: string): TableClient {
  if (AZURE_STORAGE_CONNECTION_STRING) {
    return TableClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING, tableName);
  } else if (AZURE_STORAGE_ACCOUNT_KEY) {
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

/**
 * Create table if it doesn't exist
 */
export async function createTableIfNotExists(tableName: string): Promise<void> {
  try {
    const tableClient = getTableClient(tableName);
    await tableClient.createTable();
    console.log(`✅ Table '${tableName}' created or already exists`);
  } catch (error: any) {
    if (error.statusCode === 409) {
      console.log(`ℹ️  Table '${tableName}' already exists`);
    } else {
      console.error(`❌ Error creating table '${tableName}':`, error.message);
      throw error;
    }
  }
}

/**
 * Create all tables
 */
export async function createAllTables(): Promise<void> {
  console.log("🔧 Creating Azure Table Storage tables...");
  await createTableIfNotExists(TABLE_NAMES.INSURER);
  await createTableIfNotExists(TABLE_NAMES.PROVIDER);
  await createTableIfNotExists(TABLE_NAMES.USER);
  await createTableIfNotExists(TABLE_NAMES.DOCUMENT);
  console.log("✅ All tables created successfully");
}

// ============================================================================
// INSURER TABLE
// ============================================================================

export interface InsurerEntity {
  partitionKey: string; // "insurer"
  rowKey: string; // unique_id
  unique_id: string;
  precheckcover_id: string;
  timestamp?: Date;
}

export async function createInsurer(insurer: Omit<InsurerEntity, "partitionKey" | "rowKey" | "timestamp">): Promise<void> {
  const tableClient = getTableClient(TABLE_NAMES.INSURER);
  const entity: InsurerEntity = {
    partitionKey: "insurer",
    rowKey: insurer.unique_id,
    ...insurer,
  };
  await tableClient.createEntity(entity);
}

export async function getInsurer(uniqueId: string): Promise<InsurerEntity | null> {
  try {
    const tableClient = getTableClient(TABLE_NAMES.INSURER);
    const entity = await tableClient.getEntity<InsurerEntity>("insurer", uniqueId);
    return entity;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function listInsurers(): Promise<InsurerEntity[]> {
  const tableClient = getTableClient(TABLE_NAMES.INSURER);
  const entities: InsurerEntity[] = [];
  for await (const entity of tableClient.listEntities<InsurerEntity>()) {
    entities.push(entity);
  }
  return entities;
}

// ============================================================================
// PROVIDER TABLE
// ============================================================================

export interface ProviderEntity {
  partitionKey: string; // "provider"
  rowKey: string; // provider_id
  provider_id: string;
  name?: string;
  specialty?: string;
  address?: string;
  phone?: string;
  email?: string;
  timestamp?: Date;
}

export async function createProvider(provider: Omit<ProviderEntity, "partitionKey" | "rowKey" | "timestamp">): Promise<void> {
  const tableClient = getTableClient(TABLE_NAMES.PROVIDER);
  const entity: ProviderEntity = {
    partitionKey: "provider",
    rowKey: provider.provider_id,
    ...provider,
  };
  await tableClient.createEntity(entity);
}

export async function getProvider(providerId: string): Promise<ProviderEntity | null> {
  try {
    const tableClient = getTableClient(TABLE_NAMES.PROVIDER);
    const entity = await tableClient.getEntity<ProviderEntity>("provider", providerId);
    return entity;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function listProviders(): Promise<ProviderEntity[]> {
  const tableClient = getTableClient(TABLE_NAMES.PROVIDER);
  const entities: ProviderEntity[] = [];
  for await (const entity of tableClient.listEntities<ProviderEntity>()) {
    entities.push(entity);
  }
  return entities;
}

// ============================================================================
// USER TABLE
// ============================================================================

export type PreferredLanguage = "English" | "Spanish" | "Chinese" | "French" | "Arabic";
export type PlanType = "HMO" | "PPO" | "EPO" | "POS" | "HDHP" | "Other";

export interface UserEntity {
  partitionKey: string; // "user"
  rowKey: string; // user_id (usually email or generated ID)
  // Basic Information
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string; // ISO date string
  preferredLanguage: PreferredLanguage;
  email: string;
  phoneNumber: string;
  // Address
  address: string;
  city: string;
  state: string;
  zipCode: string;
  // Insurance Information
  providerId?: string;
  insurerId?: string;
  insuranceCompany: string;
  accountNumber: string;
  groupNumber?: string;
  planType: PlanType;
  // Insurance Company Address
  insuranceStreetAddress?: string;
  insuranceCity?: string;
  insuranceState?: string;
  insuranceZipCode?: string;
  insurancePhone?: string;
  timestamp?: Date;
}

export async function createUser(user: Omit<UserEntity, "partitionKey" | "rowKey" | "timestamp">): Promise<void> {
  const tableClient = getTableClient(TABLE_NAMES.USER);
  // Use email as rowKey for uniqueness
  const userId = user.email.toLowerCase().trim();
  const entity: UserEntity = {
    partitionKey: "user",
    rowKey: userId,
    ...user,
  };
  await tableClient.createEntity(entity);
}

export async function getUser(userId: string): Promise<UserEntity | null> {
  try {
    const tableClient = getTableClient(TABLE_NAMES.USER);
    const entity = await tableClient.getEntity<UserEntity>("user", userId);
    return entity;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<UserEntity | null> {
  return getUser(email.toLowerCase().trim());
}

export async function updateUser(userId: string, updates: Partial<Omit<UserEntity, "partitionKey" | "rowKey" | "timestamp">>): Promise<void> {
  const tableClient = getTableClient(TABLE_NAMES.USER);
  await tableClient.updateEntity({
    partitionKey: "user",
    rowKey: userId,
    ...updates,
  }, "Merge");
}

export async function listUsers(): Promise<UserEntity[]> {
  const tableClient = getTableClient(TABLE_NAMES.USER);
  const entities: UserEntity[] = [];
  for await (const entity of tableClient.listEntities<UserEntity>()) {
    entities.push(entity);
  }
  return entities;
}

// ============================================================================
// DOCUMENT TABLE
// ============================================================================

export interface DocumentEntity {
  partitionKey: string; // user_id
  rowKey: string; // document_id (unique)
  user_id: string;
  doc_type: string;
  doc_name: string;
  doc_url?: string;
  doc_size?: number;
  uploaded_at?: string;
  timestamp?: Date;
}

export async function createDocument(document: Omit<DocumentEntity, "partitionKey" | "rowKey" | "timestamp">): Promise<void> {
  const tableClient = getTableClient(TABLE_NAMES.DOCUMENT);
  // Generate unique document ID
  const documentId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const entity: DocumentEntity = {
    partitionKey: document.user_id,
    rowKey: documentId,
    ...document,
  };
  await tableClient.createEntity(entity);
}

export async function getDocument(userId: string, documentId: string): Promise<DocumentEntity | null> {
  try {
    const tableClient = getTableClient(TABLE_NAMES.DOCUMENT);
    const entity = await tableClient.getEntity<DocumentEntity>(userId, documentId);
    return entity;
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function getUserDocuments(userId: string): Promise<DocumentEntity[]> {
  const tableClient = getTableClient(TABLE_NAMES.DOCUMENT);
  const entities: DocumentEntity[] = [];
  const queryOptions = {
    queryOptions: { filter: `PartitionKey eq '${userId}'` }
  };
  for await (const entity of tableClient.listEntities<DocumentEntity>(queryOptions)) {
    entities.push(entity);
  }
  return entities;
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const tableClient = getTableClient(TABLE_NAMES.DOCUMENT);
  await tableClient.deleteEntity(userId, documentId);
}

