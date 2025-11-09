# ETL Pipeline Analysis: niki.claims → lab-analysis

## Claims ETL Pipeline (niki.claims branch)

### Flow:
```
User Uploads PDF
    ↓
app/api/claims/upload/route.ts
    ↓
Step 1: Extract Text
    backend/scripts/extract_text.py
    → Uses DocumentProcessor.extract_text()
    → Returns raw text
    ↓
Step 2: Store in Pinecone
    backend/scripts/upload_document.py
    → Uses PineconeVectorStore.add_user_document()
    → Chunks text (sentence/paragraph strategy)
    → Stores chunks in Pinecone 'private' namespace
    → Returns vector IDs
```

### Key Components:

1. **DocumentProcessor** (`backend/document_processor.py`):
   - Extracts text from PDFs using UnstructuredPDFLoader (preferred) or pdfplumber/PyPDF2
   - Supports chunking strategies: sentence, paragraph, fixed
   - Handles various file formats

2. **extract_text.py**:
   - Receives base64-encoded file content
   - Uses DocumentProcessor to extract text
   - Returns extracted text

3. **upload_document.py**:
   - Receives extracted text
   - Uses PineconeVectorStore.add_user_document()
   - Chunks text automatically
   - Stores in Pinecone with metadata (user_id, doc_type, doc_id, fileName, fileSize)
   - Returns vector IDs

### Pinecone Storage Pattern:
- **Namespace**: `private` (user-specific PHI)
- **doc_type**: e.g., "bill", "clinical_note", "plan_document"
- **Metadata**: user_id, doc_type, doc_id, fileName, fileSize, text, chunk_index
- **Chunking**: Enabled by default (chunk_size=1000, chunk_overlap=200, strategy="sentence")

## Current Lab-Analysis Implementation

### Current Flow:
```
User Uploads PDF
    ↓
app/api/labs/upload/route.ts
    ↓
Step 1: Extract Text (✓ Already using extract_text.py)
    backend/scripts/extract_text.py
    ↓
Step 2: Process Lab Report (❌ References non-existent process_lab_report.py)
    Should use upload_document.py instead
```

### Issues:
1. Route references `process_lab_report.py` which doesn't exist
2. Not following the same ETL pattern as claims
3. Database schema doesn't store extracted text or vector IDs

## Required Changes

### 1. Update Upload Route
- Use `upload_document.py` instead of `process_lab_report.py`
- Follow same 2-step pattern as claims
- Store extracted text and vector IDs in database

### 2. Update Database Schema
- Add `extractedText` field to store raw extracted text
- Add `vectorIds` field to store Pinecone vector IDs
- Keep existing fields for UI compatibility

### 3. Maintain UI Compatibility
- Keep Prisma storage for structured data (title, date, hospital, doctor, parameters)
- Lab-analysis page expects structured data from Prisma
- Vector storage in Pinecone is for RAG/search, not direct UI display

