# Azure Blob Storage Integration - Setup Summary

## What Was Created

### 1. Mock Data Generation Script
- **File**: `scripts/generate-mock-doctors.js`
- **Purpose**: Generates 20 mock doctors with realistic data
- **Usage**: `npm run generate-doctors`
- **Output**: Creates `data/doctors.json` with provider data

### 2. Azure Blob Storage Client
- **File**: `lib/azure/blob-storage.ts`
- **Purpose**: Handles uploading and downloading data from Azure Blob Storage
- **Functions**:
  - `uploadDoctorsData()` - Upload doctors data to Azure
  - `downloadDoctorsData()` - Download doctors data from Azure
  - `getDoctorsDataUrl()` - Get public URL of doctors data

### 3. Upload Script
- **File**: `scripts/upload-doctors-to-azure.js`
- **Purpose**: Script to upload generated mock data to Azure Blob Storage
- **Usage**: `npm run upload-doctors`
- **Requirements**: Azure Storage connection string in `.env` file

### 4. API Route
- **File**: `app/api/doctors/route.ts`
- **Purpose**: API endpoint to fetch doctors data from Azure Blob Storage
- **Endpoint**: `GET /api/doctors`
- **Query Parameters**:
  - `search` - Search by name, specialty, or address
  - `specialty` - Filter by specialty
  - `telehealth` - Filter by telehealth availability
  - `language` - Filter by language

### 5. Updated Scheduling Page
- **File**: `app/features/scheduling/page.tsx`
- **Changes**:
  - Fetches providers from API on page load
  - Shows loading state while fetching
  - Falls back to mock data if API fails
  - Search functionality now calls API

## Setup Instructions

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Azure Blob Storage
1. Create a `.env` file in the root directory
2. Add your Azure Storage connection string:
   ```
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
   AZURE_BLOB_CONTAINER_NAME=carepilot-data
   ```

### Step 3: Generate Mock Data
```bash
npm run generate-doctors
```
This creates `data/doctors.json` with 20 mock doctors.

### Step 4: Upload to Azure Blob Storage
```bash
npm run upload-doctors
```
This uploads the doctors data to Azure Blob Storage.

### Step 5: Verify Setup
1. Start the development server: `npm run dev`
2. Visit the scheduling page: `http://localhost:3000/features/scheduling`
3. Check that doctors are loaded from Azure (check browser console)

## How It Works

1. **Data Generation**: The script generates realistic mock doctor data with:
   - Names, specialties, addresses
   - Languages, telehealth availability
   - Ratings, estimated costs
   - Available appointment slots
   - Provider images

2. **Azure Storage**: Data is stored in Azure Blob Storage as JSON
   - Container: `carepilot-data` (configurable)
   - Blob: `doctors.json`
   - Access: Public read access

3. **API Integration**: The API route fetches data from Azure:
   - Downloads `doctors.json` from blob storage
   - Applies filters (search, specialty, telehealth, language)
   - Returns filtered results

4. **Frontend**: The scheduling page:
   - Fetches providers on page load
   - Supports search and filtering
   - Falls back to mock data if Azure is unavailable

## File Structure

```
.
├── scripts/
│   ├── generate-mock-doctors.js      # Generate mock data
│   └── upload-doctors-to-azure.js    # Upload to Azure
├── lib/
│   └── azure/
│       └── blob-storage.ts           # Azure client
├── app/
│   ├── api/
│   │   └── doctors/
│   │       └── route.ts              # API endpoint
│   └── features/
│       └── scheduling/
│           └── page.tsx              # Updated scheduling page
├── data/
│   └── doctors.json                  # Generated mock data (local)
└── .env                               # Azure configuration (not in git)
```

## Next Steps

1. **Set up Azure Storage Account**:
   - Create storage account in Azure Portal
   - Get connection string from Access Keys
   - Add to `.env` file

2. **Generate and Upload Data**:
   - Run `npm run generate-doctors`
   - Run `npm run upload-doctors`

3. **Test the Integration**:
   - Start dev server
   - Visit scheduling page
   - Verify doctors load from Azure

4. **Production Deployment**:
   - Set environment variables in hosting platform
   - Ensure Azure Blob Storage is accessible
   - Test API endpoint after deployment

## Troubleshooting

- **No doctors showing**: Check browser console for errors, verify API endpoint is working
- **Connection string error**: Verify `.env` file has correct connection string
- **Upload fails**: Check Azure Storage account permissions
- **API returns empty**: Verify blob exists in Azure and has public read access

## Notes

- The system falls back to mock data if Azure is unavailable
- Data is stored as JSON in Azure Blob Storage
- The API supports filtering and search
- Provider images are from Unsplash (external URLs)

