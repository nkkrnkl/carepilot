# Lab Analysis ETL Migration Summary

## Overview
Successfully migrated lab-analysis upload workflow to match the claims ETL pipeline pattern from `niki.claims` branch.

## Changes Made

### 1. Upload Route (`app/api/labs/upload/route.ts`)
**Before:**
- Used non-existent `process_lab_report.py`
- Different workflow from claims

**After:**
- **Step 1**: Extract text using `extract_text.py` (same as claims)
- **Step 2**: Store in Pinecone using `upload_document.py` (same as claims)
- **Step 3**: Save to Prisma database with extracted text and vector IDs

**ETL Flow (Now Matching Claims):**
```
User Uploads PDF
    ↓
app/api/labs/upload/route.ts
    ↓
Step 1: Extract Text
    backend/scripts/extract_text.py
    → Uses DocumentProcessor.extract_text()
    → Returns raw text
    ↓
Step 2: Store in Pinecone
    backend/scripts/upload_document.py
    → Uses PineconeVectorStore.add_user_document()
    → Chunks text (sentence strategy, 1000 chars, 200 overlap)
    → Stores in Pinecone 'private' namespace
    → Returns vector IDs
    ↓
Step 3: Save to Database
    Prisma LabReport.create()
    → Stores extractedText, vectorIds, docId
```

### 2. Database Schema (`prisma/schema.prisma`)
**Added Fields:**
- `extractedText` (String?): Raw extracted text from PDF
- `vectorIds` (String?): JSON array of Pinecone vector IDs
- `docId` (String?): Document ID used in Pinecone (for linking)
- Index on `docId` for faster lookups

**Maintains Compatibility:**
- All existing fields preserved (title, date, hospital, doctor, parameters, rawExtract)
- UI components continue to work with existing data structure

### 3. Pinecone Storage Pattern
**Now Matches Claims:**
- **Namespace**: `private` (user-specific PHI)
- **doc_type**: `"lab_report"`
- **Metadata**: user_id, doc_type, doc_id, fileName, fileSize, text, chunk_index
- **Chunking**: Enabled (chunk_size=1000, chunk_overlap=200, strategy="sentence")

## Key Benefits

1. **Consistency**: Lab reports now use the same ETL pipeline as claims
2. **Maintainability**: Single pattern across all document types
3. **Searchability**: Raw text stored in Pinecone enables RAG/search
4. **Traceability**: Vector IDs stored in database for linking
5. **Compatibility**: Existing UI components continue to work

## Next Steps (Optional)

1. **Structured Data Extraction**: 
   - Can add LLM-based extraction for structured data (title, parameters) for UI display
   - This would be separate from Pinecone storage (for RAG) vs Prisma storage (for UI)

2. **Database Migration**:
   - Run `npx prisma db push` to apply schema changes
   - Or create a migration: `npx prisma migrate dev --name add_etl_fields`

3. **Testing**:
   - Test upload flow with PDF files
   - Verify Pinecone storage
   - Verify database storage
   - Verify UI compatibility

## Files Modified

1. `app/api/labs/upload/route.ts` - Updated to use claims ETL pattern
2. `prisma/schema.prisma` - Added ETL-related fields
3. `ETL_PIPELINE_ANALYSIS.md` - Documentation of ETL pipeline analysis

## Files Referenced (Unchanged)

1. `backend/scripts/extract_text.py` - Already in use
2. `backend/scripts/upload_document.py` - Now used for lab reports
3. `backend/document_processor.py` - Used by extract_text.py
4. `backend/pinecone_store.py` - Used by upload_document.py

