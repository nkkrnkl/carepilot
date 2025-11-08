# CarePilot Setup Instructions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Azure Blob Storage environment:**
   ```bash
   ./scripts/setup-env.sh
   ```
   This will create a `.env` file with your Azure Storage connection string.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Visit the scheduling page:**
   ```
   http://localhost:3000/features/scheduling
   ```

## Azure Blob Storage Setup

The scheduling page fetches doctor data from Azure Blob Storage. To set this up:

### Option 1: Automatic Setup (Recommended)
```bash
./scripts/setup-env.sh
```

### Option 2: Manual Setup
1. Get your Azure Storage connection string:
   ```bash
   az storage account show-connection-string \
     --name hackstoragexz \
     --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e \
     --query "connectionString" \
     --output tsv
   ```

2. Create a `.env` file in the project root:
   ```env
   AZURE_STORAGE_CONNECTION_STRING="your-connection-string-here"
   AZURE_BLOB_CONTAINER_NAME="doctor-data"
   ```

3. Restart your dev server:
   ```bash
   npm run dev
   ```

## Verify Setup

### Check if doctors are loaded:
```bash
curl http://localhost:3000/api/doctors
```

You should see a JSON response with `success: true` and a `data` array containing 20 doctors.

### Check blob storage directly:
```bash
npm run check-doctors
```

Or use the verification script:
```bash
./scripts/verify-doctors.sh
```

## Troubleshooting

### API returns empty array
1. **Check if .env file exists:**
   ```bash
   test -f .env && echo "✅ .env exists" || echo "❌ .env missing"
   ```

2. **Check if connection string is set:**
   ```bash
   grep -q "AZURE_STORAGE_CONNECTION_STRING" .env && echo "✅ Connection string set" || echo "❌ Connection string missing"
   ```

3. **Restart the dev server** after creating/updating `.env`:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

4. **Check server logs** for error messages when accessing `/api/doctors`

### Public URL doesn't work
The storage account doesn't allow public access, so you **must** use the connection string method. Make sure:
- `.env` file exists with `AZURE_STORAGE_CONNECTION_STRING` set
- Dev server is restarted after creating `.env`
- Connection string is valid (run `./scripts/setup-env.sh` to regenerate it)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run check-doctors` - Check doctors count in blob storage
- `npm run generate-doctors` - Generate mock doctor data
- `npm run upload-doctors` - Upload doctors to Azure Blob Storage
- `./scripts/setup-env.sh` - Set up .env file with Azure credentials

## Environment Variables

Required environment variables (set in `.env` file):
- `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage account connection string
- `AZURE_BLOB_CONTAINER_NAME` - Container name (default: "doctor-data")

## Notes

- The `.env` file is gitignored for security
- The storage account doesn't allow public access, so connection string is required
- The API endpoint `/api/doctors` fetches from Azure Blob Storage
- The scheduling page (`/features/scheduling`) uses this API to display doctors

