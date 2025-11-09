# Labs Pipeline Implementation Summary

## Overview

Replaced the mock backend with a **schema-perfect clone** of the claims/appeals pipeline from `niki.claims`. The new pipeline uses Azure Document Intelligence for OCR, then follows the exact same ETL → Pinecone pattern as claims.

## Key Findings from `niki.claims`

### Pinecone Configuration
- **Index**: `care-pilot`
- **Namespaces: `kb` (knowledge base), `private` (user PHI)**
- **Dimension**: 3072 (text-embedding-3-large)
- **Metric**: cosine
- **API**: Direct Pinecone API (not through Azure)

### Embedding Configuration
- **Provider**: Azure OpenAI
- **Model**: text-embedding-3-large
- **Deployment**: `AZURE_OPENAI_DEPLOYMENT_NAME`
- **API Version**: 2023-05-15
- **Dimension**: 3072

### Chunking Settings
- **chunk_size**: 1000 characters
- **chunk_overlap**: 200 characters
- **strategy**: "sentence" (default), "paragraph" for structured docs

### Metadata Schema (from `add_user_document_chunks`)
```python
{
    "user_id": str,           # Required
    "doc_type": str,          # Required (e.g., "lab_report")
    "doc_id": str,            # Required
    "chunk_index": int,       # Required
    "text": str,              # Required
    "fileName": str,          # Optional
    "fileSize": int,          # Optional
}
```

### Vector ID Format
```
chunk_{user_id}_{doc_type}_{doc_id}_{chunk_idx}_{text_hash}
```

## New Files Created

### 1. `lib/azure/documentIntelligence.ts`
**Purpose**: Azure Document Intelligence OCR client

**Key Functions**:
```typescript
export async function ocrRead(
  buffer: Buffer | ArrayBuffer,
  contentType: string
): Promise<OCRResult>
```

**Snippet**:
```typescript
const poller = await client.beginAnalyzeDocument("prebuilt-read", uint8Array);
const result = await poller.pollUntilDone();
// Returns: { pages, content, paragraphs, lines }
```

### 2. `lib/labs/normalize.ts`
**Purpose**: Convert OCR JSON to canonical LabReport

**Key Functions**:
```typescript
export function toLabReport(ocrResult: OCRResult): LabReport
```

**Heuristics**:
- Hospital: First lines containing "Hospital", "Medical Center", "Clinic"
- Doctor: Lines with "Dr.", "Physician", "Provider" patterns
- Date: Regex for YYYY-MM-DD, MM/DD/YYYY, DD MMM YYYY
- Parameters: Pattern matching for `<name>: <value> <unit> (<range>)`

### 3. `lib/labs/chunk.ts`
**Purpose**: Chunking utilities (mirrors claims exactly)

**Key Functions**:
```typescript
export function buildLabsChunks(
  report: LabReport,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): { chunks: LabChunk[] }
```

**Chunk Structure**:
- Header chunk (index 0): Document metadata
- Parameter chunks: One per parameter with value/unit/range

**Settings**: **EXACT same as claims** (1000/200/sentence)

### 4. `lib/labs/embed.ts`
**Purpose**: Embeddings client (reuses claims config)

**Key Functions**:
```typescript
export async function embedTexts(texts: string[]): Promise<number[][]>
```

**Configuration**:
- Azure OpenAI (same as claims)
- Batch size: 16
- Max retries: 3 with exponential backoff
- Dimension: 3072

### 5. `lib/labs/pinecone.ts`
**Purpose**: Pinecone integration with exact claims metadata schema

**Key Functions**:
```typescript
export async function upsertLabsVectors(
  vectors: Array<{...}>
): Promise<string[]>
```

**Metadata Schema** (mirrors claims):
```typescript
{
  user_id: string,           // Required (same as claims)
  doc_type: "lab_report",   // Required (same as claims)
  doc_id: string,            // Required (same as claims)
  chunk_index: number,       // Required (same as claims)
  text: string,              // Required (same as claims)
  fileName?: string,         // Optional (same as claims)
  fileSize?: number,         // Optional (same as claims)
  // Labs-specific optional fields:
  hospital?: string,
  doctor?: string,
  date?: string,
  paramName?: string,
  unit?: string,
  referenceRange?: string,
}
```

**ID Format**: `chunk_{user_id}_lab_report_{doc_id}_{chunk_idx}_{hash}` (same pattern as claims)

### 6. `lib/labs/storage.ts`
**Purpose**: Structured JSON storage for UI

**Key Functions**:
```typescript
export interface LabsStorage {
  saveReport(userId: string, report: LabReport): Promise<LabReport>;
  listReports(userId: string): Promise<LabReport[]>;
  getReport(userId: string, id: string): Promise<LabReport | null>;
}
```

**Implementation**: Memory adapter (default), extensible to Azure/Cosmos/Postgres

### 7. Updated API Routes

#### `app/api/labs/upload/route.ts` (was `ingest`)
**Flow**:
1. OCR → `ocrRead(buffer, contentType)`
2. Normalize → `toLabReport(ocrResult)`
3. Chunk → `buildLabsChunks(report, 1000, 200)`
4. Embed → `embedTexts(chunkTexts)`
5. Upsert → `upsertLabsVectors(vectors)`
6. Store → `storage.saveReport(userId, report)`

#### `app/api/labs/list/route.ts`
**Flow**: `storage.listReports(userId)` → sorted newest first

#### `app/api/labs/timeseries/route.ts`
**Flow**: Aggregate from storage, filter by parameter name, sort by date

#### `app/api/labs/report/[id]/route.ts` (new)
**Flow**: `storage.getReport(userId, id)`

## File Mapping: Claims → Labs

| Claims (niki.claims) | Labs (abhinav.lab_analysis) | Status |
|---------------------|---------------------------|--------|
| `backend/pinecone_store.py` | `lib/labs/pinecone.ts` | ✅ Created (TypeScript) |
| `backend/document_processor.py` | `lib/azure/documentIntelligence.ts` | ✅ Created (Azure DI) |
| `backend/scripts/upload_document.py` | `app/api/labs/upload/route.ts` | ✅ Replaced |
| N/A (Python chunking) | `lib/labs/chunk.ts` | ✅ Created (mirrors logic) |
| N/A (Python embeddings) | `lib/labs/embed.ts` | ✅ Created (mirrors config) |
| N/A | `lib/labs/normalize.ts` | ✅ Created (OCR → LabReport) |
| N/A | `lib/labs/storage.ts` | ✅ Created (memory adapter) |

## Schema Parity Checklist

### Pinecone
| Aspect | Claims | Labs | Match |
|--------|--------|------|-------|
| Index Name | `care-pilot` | `care-pilot` | ✅ |
| Dimension | 3072 | 3072 | ✅ |
| Metric | cosine | cosine | ✅ |
| Namespace | `private` | `private` | ✅ |

### Metadata Keys
| Key | Claims | Labs | Match |
|-----|--------|------|-------|
| `user_id` | ✅ Required | ✅ Required | ✅ |
| `doc_type` | ✅ Required | ✅ Required | ✅ |
| `doc_id` | ✅ Required | ✅ Required | ✅ |
| `chunk_index` | ✅ Required | ✅ Required | ✅ |
| `text` | ✅ Required | ✅ Required | ✅ |
| `fileName` | Optional | Optional | ✅ |
| `fileSize` | Optional | Optional | ✅ |
| `hospital` | N/A | Optional | ✅ (labs-only) |
| `doctor` | N/A | Optional | ✅ (labs-only) |
| `date` | N/A | Optional | ✅ (labs-only) |
| `paramName` | N/A | Optional | ✅ (labs-only) |
| `unit` | N/A | Optional | ✅ (labs-only) |
| `referenceRange` | N/A | Optional | ✅ (labs-only) |

### ID Policy
| Format | Claims | Labs | Match |
|--------|--------|------|-------|
| Pattern | `chunk_{user_id}_{doc_type}_{doc_id}_{chunk_idx}_{hash}` | `chunk_{user_id}_lab_report_{doc_id}_{chunk_idx}_{hash}` | ✅ |

### Chunker Settings
| Setting | Claims | Labs | Match |
|---------|--------|------|-------|
| chunk_size | 1000 | 1000 | ✅ |
| chunk_overlap | 200 | 200 | ✅ |
| strategy | "sentence" | "sentence" | ✅ |

### Embedding Config
| Setting | Claims | Labs | Match |
|---------|--------|------|-------|
| Provider | Azure OpenAI | Azure OpenAI | ✅ |
| Model | text-embedding-3-large | text-embedding-3-large | ✅ |
| Dimension | 3072 | 3072 | ✅ |
| API Version | 2023-05-15 | 2023-05-15 | ✅ |
| Batch Size | 16 | 16 | ✅ |
| Retries | 3 | 3 | ✅ |

## Environment Variables

### Updated `.env.example`
```env
# Azure Document Intelligence (OCR)
AZURE_DI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_DI_KEY=your_azure_di_key

# Pinecone (SAME as claims)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=care-pilot

# Embeddings (SAME as claims)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
EMBEDDING_DEPLOYMENT=text-embedding-3-large-2

# Storage (optional)
LABS_STORAGE_ADAPTER=memory
```

## Quick Start (Labs)

```bash
# 1. Install dependencies
npm install @azure/ai-form-recognizer @pinecone-database/pinecone openai

# 2. Set environment variables
export AZURE_DI_ENDPOINT=your_endpoint
export AZURE_DI_KEY=your_key
export PINECONE_API_KEY=your_key
export AZURE_OPENAI_ENDPOINT=your_endpoint
export AZURE_OPENAI_API_KEY=your_key
export AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2

# 3. Run dev server
npm run dev

# 4. Upload a lab report PDF
curl -X POST http://localhost:3000/api/labs/upload \
  -F "file=@lab_report.pdf" \
  -F "userId=demo-user"

# 5. List reports
curl http://localhost:3000/api/labs/list?userId=demo-user

# 6. Get time series
curl "http://localhost:3000/api/labs/timeseries?name=Glucose&userId=demo-user"
```

## Testing Checklist

- [ ] Upload 2 PDFs with same parameter → Past Visits shows 2 data points
- [ ] Verify Pinecone index has vectors in `private` namespace
- [ ] Verify metadata keys match claims schema
- [ ] Verify chunk count matches expected (based on 1000/200 settings)
- [ ] Verify embeddings dimension is 3072
- [ ] Test timeseries aggregation and sorting

## Assumptions

1. **Azure Document Intelligence**: Using `prebuilt-read` model (general OCR)
2. **Normalization**: Heuristic-based extraction (may need LLM refinement for complex formats)
3. **Storage**: Memory adapter for dev (can be extended to persistent storage)
4. **Error Handling**: Basic retry logic for embeddings (mirrors claims pattern)

## Next Steps

1. Test with real lab report PDFs
2. Refine normalization heuristics if needed
3. Add persistent storage adapter (Azure/Cosmos/Postgres) if required
4. Add search route that queries Pinecone (mirror claims retrieval)

