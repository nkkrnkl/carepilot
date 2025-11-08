# Azure Table Storage Quick Start

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Run the setup script to automatically configure your `.env` file:
```bash
./scripts/setup-env.sh
```

Or manually add to your `.env` file:
```env
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_ACCOUNT_NAME="hackstoragexz"
AZURE_STORAGE_ACCOUNT_KEY="your-account-key"
```

### 3. Create Tables
```bash
npm run create-tables
```

This creates 4 tables:
- `insurer` - Insurance company information
- `provider` - Healthcare provider information
- `user` - User profile and insurance information
- `document` - User documents

### 4. Test the Setup
```bash
npm run test-tables
```

## Table Schemas

### Insurer Table
- **PartitionKey**: `"insurer"`
- **RowKey**: `unique_id`
- **Fields**: `unique_id`, `precheckcover_id`

### Provider Table
- **PartitionKey**: `"provider"`
- **RowKey**: `provider_id`
- **Fields**: `provider_id`, `name`, `specialty`, `address`, `phone`, `email`

### User Table
- **PartitionKey**: `"user"`
- **RowKey**: `email` (user's email address)

**Required Fields:**
- `firstName`, `lastName`, `dateOfBirth`
- `email`, `phoneNumber`
- `address`, `city`, `state`, `zipCode`
- `insuranceCompany`, `accountNumber`, `planType`
- `preferredLanguage`

**Optional Fields:**
- `middleName`
- `providerId`, `insurerId`
- `groupNumber`
- `insuranceStreetAddress`, `insuranceCity`, `insuranceState`, `insuranceZipCode`, `insurancePhone`

### Document Table
- **PartitionKey**: `user_id` (user's email)
- **RowKey**: `document_id` (auto-generated)
- **Fields**: `user_id`, `doc_type`, `doc_name`, `doc_url`, `doc_size`, `uploaded_at`

## API Endpoints

### Users API
- **GET** `/api/users` - List all users
- **GET** `/api/users?email=user@example.com` - Get user by email
- **POST** `/api/users` - Create a new user
- **PUT** `/api/users` - Update user (requires email in body)

### Documents API
- **GET** `/api/users/documents?userId=user@example.com` - Get all documents for a user
- **POST** `/api/users/documents` - Create a new document
- **DELETE** `/api/users/documents?userId=...&documentId=...` - Delete a document

## Example Usage

### Create a User
```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
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
  }),
});
```

### Get User
```typescript
const response = await fetch('/api/users?email=john.doe@example.com');
const { user } = await response.json();
```

### Create Document
```typescript
const response = await fetch('/api/users/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: "john.doe@example.com",
    doc_type: "insurance_card",
    doc_name: "insurance_card_front.jpg",
    doc_url: "https://storage...",
  }),
});
```

## Next Steps

1. Integrate with the profile page to save user data
2. Add file upload functionality for documents
3. Connect insurer and provider tables to user records
4. Add validation and error handling

## Troubleshooting

### Tables not created
- Check your Azure credentials in `.env`
- Verify you have permissions on the storage account
- Run `npm run create-tables` again

### Authentication errors
- Verify `AZURE_STORAGE_CONNECTION_STRING` or `AZURE_STORAGE_ACCOUNT_KEY` is correct
- Make sure the storage account name matches: `hackstoragexz`

### API errors
- Check server logs for detailed error messages
- Verify all required fields are provided
- Ensure email is unique (it's used as the user ID)

