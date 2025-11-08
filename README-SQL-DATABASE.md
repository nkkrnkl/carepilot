# Azure SQL Database Setup for CarePilot

This document explains how to set up and use Azure SQL Database for CarePilot's data storage.

## Database Details

- **Server**: `k2sqldatabaseserver.database.windows.net`
- **Database**: `K2Database`
- **Subscription**: `41f56be4-b097-45ca-b7a6-b064a0c7189e`

## Tables

CarePilot uses 3 tables in the Azure SQL Database:

### 1. **insurer_table**
- `unique_id` (NVARCHAR(255), PRIMARY KEY) - Unique identifier for the insurer
  - **Note**: This `unique_id` is used as `insurerId` in the `user_table` (foreign key relationship)
- `precheckcover_id` (NVARCHAR(255), NOT NULL) - Pre-check coverage ID
- `created_at` (DATETIME2) - Creation timestamp
- `updated_at` (DATETIME2) - Last update timestamp

### 2. **provider_table**
- `provider_id` (NVARCHAR(255), PRIMARY KEY) - Unique identifier for the provider
- `name` (NVARCHAR(255)) - Provider name
- `specialty` (NVARCHAR(255)) - Provider specialty
- `address` (NVARCHAR(500)) - Provider address
- `phone` (NVARCHAR(50)) - Provider phone number
- `email` (NVARCHAR(255)) - Provider email
- `created_at` (DATETIME2) - Creation timestamp
- `updated_at` (DATETIME2) - Last update timestamp

### 3. **user_table**
- `email` (NVARCHAR(255), PRIMARY KEY) - User's email address (used as unique identifier)
- **Personal Information:**
  - `firstName` (NVARCHAR(100), NOT NULL)
  - `middleName` (NVARCHAR(100))
  - `lastName` (NVARCHAR(100), NOT NULL)
  - `dateOfBirth` (DATE, NOT NULL)
  - `preferredLanguage` (NVARCHAR(50), NOT NULL) - CHECK constraint: 'English', 'Spanish', 'Chinese', 'French', 'Arabic'
  - `phoneNumber` (NVARCHAR(50), NOT NULL)
- **Address:**
  - `address` (NVARCHAR(500), NOT NULL)
  - `city` (NVARCHAR(100), NOT NULL)
  - `state` (NVARCHAR(100), NOT NULL)
  - `zipCode` (NVARCHAR(20), NOT NULL)
- **Insurance Information:**
  - `providerId` (NVARCHAR(255)) - FOREIGN KEY to `provider_table.provider_id`
  - `insurerId` (NVARCHAR(255)) - FOREIGN KEY to `insurer_table.unique_id`
    - **Important**: `insurerId` in `user_table` references `unique_id` in `insurer_table`
  - `insuranceCompany` (NVARCHAR(255), NOT NULL)
  - `accountNumber` (NVARCHAR(255), NOT NULL)
  - `groupNumber` (NVARCHAR(255))
  - `planType` (NVARCHAR(50), NOT NULL) - CHECK constraint: 'HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Other'
  - `insuranceStreetAddress` (NVARCHAR(500))
  - `insuranceCity` (NVARCHAR(100))
  - `insuranceState` (NVARCHAR(100))
  - `insuranceZipCode` (NVARCHAR(20))
  - `insurancePhone` (NVARCHAR(50))
- **Documents:**
  - `documents` (NVARCHAR(MAX)) - JSON string containing an array of Document objects
  - Each Document has: `doc_type`, `doc_name`, `doc_url`, `doc_size`, `uploaded_at`
- **Timestamps:**
  - `created_at` (DATETIME2) - Creation timestamp
  - `updated_at` (DATETIME2) - Last update timestamp

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install `mssql` and `@types/mssql` packages.

### 2. Configure Environment Variables

Create or update your `.env` file with Azure SQL Database credentials:

```bash
# Option 1: Use connection string (recommended)
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false

# Option 2: Use individual credentials
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
```

**Note:** To get your SQL credentials:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your SQL Server: `k2sqldatabaseserver`
3. Go to **Settings** > **SQL administrators**
4. Set up an admin user and password, or use existing credentials

### 3. Create Tables

Run the migration script to create all tables:

```bash
npm run create-sql-tables
```

This will:
- Connect to Azure SQL Database
- Create `insurer_table`, `provider_table`, and `user_table` if they don't exist
- Create indexes for better performance
- Display success messages for each table

### 4. Test the Connection

Test the database connection and operations:

```bash
npm run test-sql-storage
```

This will:
- Create test data (insurer, provider, user)
- Test CRUD operations
- Verify document storage
- Display test results

## Usage

### Import the functions

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

### Add Documents to a User

Documents are stored as a JSON string in the user table:

```typescript
const user = await getUserByEmail("john.doe@example.com");
const documents: Document[] = user?.documents ? JSON.parse(user.documents) : [];

// Add a new document
documents.push({
  doc_type: "insurance_card",
  doc_name: "insurance_card_front.jpg",
  doc_url: "https://storage...",
  uploaded_at: new Date().toISOString(),
});

// Update user with documents
await updateUser("john.doe@example.com", {
  documents: JSON.stringify(documents),
});
```

### Get User Documents

```typescript
const user = await getUserByEmail("john.doe@example.com");
const documents: Document[] = user?.documents ? JSON.parse(user.documents) : [];
```

## API Routes

You can use the same API routes that were created for Azure Table Storage. They will automatically work with SQL Database if you update the imports:

### Update `app/api/users/route.ts`

```typescript
// Change from:
import { createUser, getUserByEmail, updateUser } from "@/lib/azure/table-storage";

// To:
import { createUser, getUserByEmail, updateUser } from "@/lib/azure/sql-storage";
```

## Migration from Azure Table Storage

If you're migrating from Azure Table Storage to Azure SQL Database:

1. **Update imports**: Change all imports from `@/lib/azure/table-storage` to `@/lib/azure/sql-storage`
2. **Update API routes**: Update all API routes to use SQL storage functions
3. **Migrate data**: Create a migration script to copy data from Table Storage to SQL Database
4. **Test thoroughly**: Run tests to ensure all functionality works correctly

## Troubleshooting

### Connection Issues

If you're having connection issues:

1. **Check firewall rules**: Ensure your IP address is allowed in Azure SQL Server firewall rules
2. **Verify credentials**: Double-check your username and password
3. **Check connection string**: Ensure the connection string format is correct
4. **Test connection**: Use Azure Portal to test the connection

### Firewall Rules

To allow your IP address:

1. Go to Azure Portal
2. Navigate to your SQL Server: `k2sqldatabaseserver`
3. Go to **Settings** > **Networking**
4. Add your IP address or enable "Allow Azure services and resources to access this server"

### SSL/TLS Issues

If you encounter SSL/TLS errors:

1. Ensure `encrypt: true` is set in the connection configuration
2. Set `trustServerCertificate: false` for production
3. For development, you can set `trustServerCertificate: true` (not recommended for production)

## Performance Considerations

- **Connection pooling**: The SQL client uses connection pooling to manage connections efficiently
- **Indexes**: Indexes are created on `providerId` and `insurerId` for faster queries
- **JSON documents**: Documents are stored as JSON strings, which is efficient for small to medium-sized documents

## Security

- **Encryption**: All connections are encrypted using TLS
- **Credentials**: Store credentials in environment variables, never in code
- **SQL Injection**: All queries use parameterized statements to prevent SQL injection
- **Access Control**: Use Azure SQL Database access control to restrict who can access the database

