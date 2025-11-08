# Azure SQL Database Setup - Quick Start

## Overview

This project now supports Azure SQL Database for storing user, insurer, and provider data. The database is hosted on Azure SQL Server `k2sqldatabaseserver.database.windows.net`.

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

This installs the `mssql` package for SQL Server connectivity.

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Azure SQL Database Configuration
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password

# OR use a connection string (recommended)
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

**To get your SQL credentials:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to SQL Server: `k2sqldatabaseserver`
3. Go to **Settings** > **SQL administrators**
4. Set up an admin user and password

### 3. Create Tables

Run the migration script to create all tables:

```bash
npm run create-sql-tables
```

This creates:
- `insurer_table` - Stores insurer information
- `provider_table` - Stores provider information  
- `user_table` - Stores user information and documents

### 4. Test the Connection

Test the database connection and operations:

```bash
npm run test-sql-storage
```

## Database Schema

### insurer_table
- `unique_id` (PRIMARY KEY)
- `precheckcover_id`
- `created_at`, `updated_at`

### provider_table
- `provider_id` (PRIMARY KEY)
- `name`, `specialty`, `address`, `phone`, `email`
- `created_at`, `updated_at`

### user_table
- `email` (PRIMARY KEY)
- Personal info: `firstName`, `middleName`, `lastName`, `dateOfBirth`, `preferredLanguage`, `phoneNumber`
- Address: `address`, `city`, `state`, `zipCode`
- Insurance: `providerId`, `insurerId`, `insuranceCompany`, `accountNumber`, `groupNumber`, `planType`
- Insurance Company Address: `insuranceStreetAddress`, `insuranceCity`, `insuranceState`, `insuranceZipCode`, `insurancePhone`
- Documents: `documents` (JSON string)
- Timestamps: `created_at`, `updated_at`

## Usage

### Import Functions

```typescript
import {
  createUser,
  getUserByEmail,
  updateUser,
  createInsurer,
  createProvider,
  type Document,
} from "@/lib/azure/sql-storage";
```

### Create a User

```typescript
await createUser({
  email: "john.doe@example.com",
  firstName: "John",
  lastName: "Doe",
  dateOfBirth: "1990-01-01",
  preferredLanguage: "English",
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

### Add Documents

```typescript
const user = await getUserByEmail("john.doe@example.com");
const documents: Document[] = user?.documents ? JSON.parse(user.documents) : [];

documents.push({
  doc_type: "insurance_card",
  doc_name: "insurance_card_front.jpg",
  doc_url: "https://storage...",
  uploaded_at: new Date().toISOString(),
});

await updateUser("john.doe@example.com", {
  documents: JSON.stringify(documents),
});
```

## Migration from Table Storage

To migrate from Azure Table Storage to SQL Database:

1. **Update imports** in API routes:
   ```typescript
   // Change from:
   import { ... } from "@/lib/azure/table-storage";
   
   // To:
   import { ... } from "@/lib/azure/sql-storage";
   ```

2. **Update API routes**: All API routes should work with the same function signatures

3. **Migrate data**: Create a migration script to copy data from Table Storage to SQL Database

## Troubleshooting

### Connection Issues

1. **Check firewall rules**: Ensure your IP is allowed in Azure SQL Server firewall
2. **Verify credentials**: Double-check username and password
3. **Test connection**: Use Azure Portal to test the connection

### Firewall Setup

1. Go to Azure Portal
2. Navigate to SQL Server: `k2sqldatabaseserver`
3. Go to **Settings** > **Networking**
4. Add your IP address or enable "Allow Azure services"

## Files Created

- `lib/azure/sql-storage.ts` - SQL Database client
- `scripts/create-sql-tables.ts` - Table creation script
- `scripts/test-sql-storage.ts` - Test script
- `scripts/setup-sql-env.sh` - Environment setup script
- `README-SQL-DATABASE.md` - Detailed documentation

## Next Steps

1. Set up environment variables
2. Run `npm run create-sql-tables` to create tables
3. Run `npm run test-sql-storage` to test the connection
4. Update API routes to use SQL storage
5. Migrate data from Table Storage (if needed)

