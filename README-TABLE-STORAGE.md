# Azure Table Storage Setup for CarePilot

This document explains how to set up and use Azure Table Storage for CarePilot's data storage.

## Tables

CarePilot uses 4 Azure Table Storage tables:

### 1. **insurer** table
- `unique_id` (RowKey) - Unique identifier for the insurer
- `precheckcover_id` - Pre-check coverage ID
- `partitionKey` - Always "insurer"

### 2. **provider** table
- `provider_id` (RowKey) - Unique identifier for the provider
- Additional fields: name, specialty, address, phone, email
- `partitionKey` - Always "provider"

### 3. **user** table
- `email` (RowKey) - User's email address (used as unique identifier)
- **Personal Information:**
  - `firstName` (required)
  - `middleName` (optional)
  - `lastName` (required)
  - `dateOfBirth` (required)
  - `preferredLanguage` (English, Spanish, Chinese, French, Arabic)
  - `email` (required)
  - `phoneNumber` (required)
- **Address:**
  - `address` (required)
  - `city` (required)
  - `state` (required)
  - `zipCode` (required)
- **Insurance Information:**
  - `providerId` (optional) - Links to provider table
  - `insurerId` (optional) - Links to insurer table
  - `insuranceCompany` (required)
  - `accountNumber` (required)
  - `groupNumber` (optional)
  - `planType` (HMO, PPO, EPO, POS, HDHP, Other)
  - `insuranceStreetAddress` (optional)
  - `insuranceCity` (optional)
  - `insuranceState` (optional)
  - `insuranceZipCode` (optional)
  - `insurancePhone` (optional)
- `partitionKey` - Always "user"

### 4. **document** table
- `document_id` (RowKey) - Unique document ID
- `user_id` (PartitionKey) - Links to user
- `doc_type` - Type of document
- `doc_name` - Name of the document
- `doc_url` (optional) - URL to the document
- `doc_size` (optional) - Size of the document
- `uploaded_at` (optional) - Upload timestamp

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install `@azure/data-tables` package.

### 2. Configure Environment Variables

Add the following to your `.env` file:

```env
# Azure Storage Configuration
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_ACCOUNT_NAME="hackstoragexz"
AZURE_STORAGE_ACCOUNT_KEY="your-account-key-here"
```

**Option 1: Get Connection String**
```bash
./scripts/get-connection-string.sh
```

**Option 2: Get Storage Account Key**
```bash
./scripts/get-storage-account-key.sh
```

### 3. Create Tables

Run the script to create all tables:

```bash
npm run create-tables
```

Or directly:
```bash
npx tsx scripts/create-tables.ts
```

This will create:
- `insurer` table
- `provider` table
- `user` table
- `document` table

## Usage

### Import the functions

```typescript
import {
  createUser,
  getUserByEmail,
  updateUser,
  createDocument,
  getUserDocuments,
  createInsurer,
  createProvider,
} from "@/lib/azure/table-storage";
```

### Create a User

```typescript
await createUser({
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  preferredLanguage: "English",
  email: "john.doe@example.com",
  phoneNumber: "+1234567890",
  address: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  insuranceCompany: "Blue Cross",
  accountNumber: "ABC123",
  planType: "PPO",
});
```

### Get a User

```typescript
const user = await getUserByEmail("john.doe@example.com");
```

### Update a User

```typescript
await updateUser("john.doe@example.com", {
  phoneNumber: "+1987654321",
  city: "Los Angeles",
});
```

### Create a Document

```typescript
await createDocument({
  user_id: "john.doe@example.com",
  doc_type: "insurance_card",
  doc_name: "insurance_card_front.jpg",
  doc_url: "https://storage...",
});
```

### Get User Documents

```typescript
const documents = await getUserDocuments("john.doe@example.com");
```

## API Routes

You can create API routes to interact with these tables. Example:

### `app/api/users/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createUser, getUserByEmail, listUsers } from "@/lib/azure/table-storage";

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    await createUser(userData);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    
    if (email) {
      const user = await getUserByEmail(email);
      return NextResponse.json({ user });
    }
    
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## Notes

- Table Storage uses `partitionKey` and `rowKey` as composite primary keys
- `rowKey` must be unique within a partition
- Maximum entity size is 1MB
- Tables are automatically created if they don't exist (with proper permissions)
- All timestamps are automatically managed by Azure Table Storage

## Troubleshooting

### Error: "Table not found"
- Make sure tables are created: `npm run create-tables`
- Check that you have proper permissions on the storage account

### Error: "Authentication failed"
- Verify your `AZURE_STORAGE_CONNECTION_STRING` or `AZURE_STORAGE_ACCOUNT_KEY` is correct
- Make sure the storage account name matches: `hackstoragexz`

### Error: "Invalid entity property"
- Make sure all required fields are provided
- Check that field names match the interface definitions
- Verify data types (dates should be ISO strings)

