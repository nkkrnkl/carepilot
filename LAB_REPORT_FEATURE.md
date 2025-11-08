# Lab Report Ingest + Timeline Feature

## Overview

This feature allows users to upload lab test reports (PDF/PNG/JPG), extract structured data using OpenAI Vision API, store it in both Prisma (SQLite) and Pinecone, and visualize it through dashboard cards and time-series charts.

## Architecture

### Tech Stack
- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma** (SQLite for local persistence)
- **Pinecone** (Vector storage, matching existing Python pipeline structure)
- **OpenAI Vision API** (gpt-4o for extraction)
- **Azure OpenAI** (for embeddings, matching existing pipeline)
- **shadcn/ui** + **Tailwind CSS** (UI components)
- **recharts** (Time-series visualization)

### Data Flow

1. **Upload**: User uploads PDF/PNG/JPG file
2. **Extraction**: OpenAI Vision API extracts structured data (hospital, doctor, date, parameters)
3. **Normalization**: Data is normalized (dates to ISO, parameter names to Title Case, numeric values parsed)
4. **Storage**: 
   - Saved to Prisma (SQLite) for quick listing and retrieval
   - Saved to Pinecone (using existing pipeline structure) for semantic search
5. **Display**: 
   - "Current Data" tab shows selected report as dashboard cards
   - "Past Visits" tab shows time-series charts per parameter

## Setup

### 1. Environment Variables

Add to `.env.local`:

```env
# OpenAI (for vision extraction)
OPENAI_API_KEY=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

# Azure OpenAI (for embeddings, matching existing pipeline)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=EWHEqNFG4lLBRe9D99C5JNq6Lw8UtvHycJzpLyU4C93481z0f5kpJQQJ99BKACYeBjFXJ3w3AAAAACOGVzY1
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# Pinecone (matching existing pipeline)
PINECONE_API_KEY=IFM-GcZbhYqNGoKWcIuJ
PINECONE_INDEX_NAME=care-pilot

# Database
DATABASE_URL="file:./dev.db"
```

### 2. Database Setup

```bash
# Create database and tables
npm run db:push

# Seed with sample data (optional)
npm run db:seed
```

### 3. Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000/labs`

## File Structure

```
app/
  labs/
    page.tsx                    # Main labs page with tabs
  api/
    labs/
      upload/route.ts           # POST - Upload and process lab report
      list/route.ts             # GET - List all reports for user
      get/route.ts              # GET - Get single report by ID

components/
  labs/
    UploadDropzone.tsx          # File upload with drag-and-drop
    PreviousReports.tsx          # List of previous reports with eye icon
    CurrentDataCards.tsx        # Dashboard cards for selected report
    PastVisitsCharts.tsx        # Time-series charts per parameter

lib/
  schemas.ts                    # Zod schemas for LabExtract/LabParameter
  openai.ts                     # OpenAI Vision API wrapper
  normalize.ts                  # Data normalization functions
  pinecone.ts                   # Pinecone client (matching Python structure)
  pinecone-lab.ts               # Lab-specific Pinecone adapter
  prisma.ts                     # Prisma client singleton

prisma/
  schema.prisma                 # LabReport model
  seed.ts                       # Seed script for testing

fixtures/
  labs/
    cbc_sample.json             # Sample lab extract for testing
```

## Pinecone Integration

The feature uses the **exact same structure** as the existing Python pipeline:

- **Index**: `care-pilot`
- **Namespace**: `private` (for user-specific PHI)
- **Metadata structure**:
  ```typescript
  {
    user_id: string,
    doc_type: "lab_report",
    doc_id: string,
    text: string,  // Full text for embedding
    title: string,
    date: string | null,
    hospital: string | null,
    doctor: string | null
  }
  ```
- **Embedding**: Uses Azure OpenAI (text-embedding-3-large-2, 3072 dimensions)
- **Vector ID format**: `doc_${md5(userId_docType_docId_text)}`

## API Endpoints

### POST `/api/labs/upload`

Upload and process a lab report.

**Request**: `multipart/form-data`
- `file`: File (PDF/PNG/JPG, max 10MB)
- `userId`: string (optional, defaults to "demo-user")

**Response**:
```json
{
  "id": "clx...",
  "userId": "demo-user",
  "title": "CBC Panel — Cleveland Clinic",
  "date": "2024-01-15T00:00:00.000Z",
  "hospital": "Cleveland Clinic",
  "doctor": "Dr. Smith",
  "parameters": {
    "Hemoglobin": {
      "value": 13.2,
      "unit": "g/dL",
      "referenceRange": "12-16"
    }
  }
}
```

### GET `/api/labs/list?userId=demo-user`

List all reports for a user, ordered by date desc.

**Response**:
```json
[
  {
    "id": "clx...",
    "title": "CBC Panel — Cleveland Clinic",
    "date": "2024-01-15T00:00:00.000Z",
    "hospital": "Cleveland Clinic",
    "doctor": "Dr. Smith"
  }
]
```

### GET `/api/labs/get?id=clx...`

Get full report data including parameters.

**Response**: Same as upload response, plus `rawExtract`, `fileUrl`, `createdAt`, `updatedAt`.

## Features

### 1. File Upload
- Drag-and-drop or click to upload
- Supports PDF, PNG, JPG (max 10MB)
- Real-time validation
- Progress indicators

### 2. Data Extraction
- Uses OpenAI Vision API (gpt-4o)
- Extracts: hospital, doctor, date, title, parameters
- Validates with Zod schemas
- Normalizes data (dates, parameter names, numeric values)

### 3. Current Data View
- Header cards: Hospital, Doctor, Date
- Parameter cards: Grid of all parameters with values, units, reference ranges

### 4. Past Visits View
- Time-series charts per parameter (using recharts)
- Only shows numeric parameters
- Shows "units vary" badge if units differ across visits
- Requires at least 2 data points per parameter

### 5. Previous Reports Panel
- Lists all reports with title and date
- Eye icon button to load report into "Current Data" view
- Auto-refreshes after new upload

## Error Handling

- **Invalid file type**: Returns 415 with error message
- **File too large**: Returns 413 with error message
- **OpenAI extraction failure**: Shows toast "Couldn't parse this file. Try a clearer scan."
- **Pinecone save failure**: Non-blocking warning (DB record still saved)
- **Invalid JSON from OpenAI**: Validated with Zod, shows error toast

## Testing

### Seed Database

```bash
npm run db:seed
```

This creates 3 historical lab reports for "demo-user" to test time-series charts.

### Test Normalization

See `lib/__tests__/normalize.test.ts` for unit tests.

## Known Limitations

1. **PDF Support**: Currently returns error for PDFs. To add PDF support:
   - Use `pdf-lib` or similar to convert PDF pages to images
   - Process each page through OpenAI Vision API
   - Merge results

2. **File Storage**: Files are saved to `uploads/{userId}/` directory. For production, consider:
   - Object storage (S3, Azure Blob)
   - CDN for file URLs

3. **Authentication**: Currently uses hardcoded "demo-user". Integrate with your auth system.

## Demo Flow

1. Navigate to `/labs`
2. Upload a lab test image (PNG/JPG)
3. View extracted data in "Current Data" tab
4. Upload 2+ more reports with same parameters
5. Switch to "Past Visits" tab to see time-series charts
6. Click eye icon in "Previous Reports" to load any report

## Future Enhancements

- PDF support (convert to images)
- Parameter trend analysis (flagging abnormal values)
- Export reports as PDF
- Multi-user support with proper authentication
- Parameter reference range validation and flagging

