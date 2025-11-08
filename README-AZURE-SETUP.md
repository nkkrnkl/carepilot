# Azure Blob Storage Setup for CarePilot

This guide explains how to set up Azure Blob Storage to store and retrieve doctor/provider data.

## Prerequisites

1. Azure account with a Storage Account
2. Node.js and npm installed
3. Azure Storage connection string

## Setup Steps

### 1. Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new Storage Account
3. Go to **Access Keys** in the left sidebar
4. Copy the **Connection string** from Key1 or Key2

### 2. Configure Environment Variables

1. Create a `.env` file in the root directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Add your Azure Storage connection string:
   ```
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
   AZURE_BLOB_CONTAINER_NAME=carepilot-data
   ```

### 3. Install Dependencies

Install the Azure Storage Blob package:

```bash
npm install @azure/storage-blob
```

### 4. Generate Mock Doctor Data

Generate mock doctor/provider data:

```bash
npm run generate-doctors
```

This creates a `data/doctors.json` file with 20 mock doctors.

### 5. Upload to Azure Blob Storage

Upload the generated data to Azure:

```bash
npm run upload-doctors
```

This will:
- Create a container named `carepilot-data` (if it doesn't exist)
- Upload `doctors.json` to the container
- Display the public URL of the uploaded file

### 6. Verify Setup

1. Check Azure Portal to confirm the blob was uploaded
2. Visit the scheduling page to see doctors loaded from Azure
3. Check browser console for any errors

## API Endpoint

The application uses the `/api/doctors` endpoint to fetch doctor data:

- **GET** `/api/doctors` - Returns all doctors
- **GET** `/api/doctors?specialty=Endocrinology` - Filter by specialty
- **GET** `/api/doctors?telehealth=true` - Filter by telehealth availability
- **GET** `/api/doctors?language=Spanish` - Filter by language

## File Structure

```
.
├── scripts/
│   ├── generate-mock-doctors.js    # Generates mock doctor data
│   └── upload-doctors-to-azure.js  # Uploads data to Azure
├── lib/
│   └── azure/
│       └── blob-storage.ts         # Azure Blob Storage client
├── app/
│   └── api/
│       └── doctors/
│           └── route.ts            # API endpoint for doctors
└── data/
    └── doctors.json                # Generated mock data (local)
```

## Troubleshooting

### Error: Connection string not set
- Make sure `.env` file exists and contains `AZURE_STORAGE_CONNECTION_STRING`
- Restart your development server after adding environment variables

### Error: Container not found
- The script will automatically create the container if it doesn't exist
- Make sure your Azure Storage account has permission to create containers

### Error: Blob not found
- Run `npm run upload-doctors` to upload the data
- Check Azure Portal to verify the blob exists

### No doctors showing on the page
- Check browser console for errors
- Verify the API endpoint is working: `http://localhost:3000/api/doctors`
- The app will fall back to mock data if Azure is unavailable

## Security Notes

- Never commit `.env` file to git
- Keep your Azure Storage connection string secure
- Consider using Azure Key Vault for production environments
- Use SAS (Shared Access Signature) tokens for limited access

## Production Deployment

For production:
1. Set environment variables in your hosting platform (Vercel, Azure, etc.)
2. Upload doctors data to Azure Blob Storage
3. Ensure the container has public read access (or use SAS tokens)
4. Test the API endpoint after deployment

