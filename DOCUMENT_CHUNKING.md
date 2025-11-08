# Document Chunking and Vectorization

## Overview

When users upload documents through the claims page, the system automatically:
1. **Extracts text** from PDFs and other document formats
2. **Chunks the text** into smaller, manageable pieces
3. **Vectorizes each chunk** using Azure OpenAI embeddings
4. **Stores all chunks** in Pinecone vector store

## Flow Diagram

```
User Uploads Document (page.tsx)
    ↓
Next.js API Route (app/api/claims/upload/route.ts)
    ↓
Step 1: Extract Text (backend/scripts/extract_text.py)
    ├─ PDF → pdfplumber/PyPDF2
    ├─ Text → UTF-8 decode
    └─ Returns extracted text
    ↓
Step 2: Chunk & Store (backend/scripts/upload_document.py)
    ├─ Chunk text by sentence/paragraph
    ├─ For each chunk:
    │   ├─ Generate embedding (Azure OpenAI)
    │   ├─ Create vector ID
    │   └─ Add metadata (user_id, doc_type, doc_id, chunk_index)
    └─ Batch upsert to Pinecone
```

## Components

### 1. Document Processor (`backend/document_processor.py`)

Handles text extraction from various file formats:

- **PDF**: Uses `UnstructuredPDFLoader` from LangChain (preferred) for robust PDF processing
  - Better handling of complex PDF layouts, tables, and document structures
  - Falls back to `pdfplumber` or `PyPDF2` if UnstructuredPDFLoader is unavailable
- **Text files**: UTF-8 decoding with fallback encodings
- **Other formats**: Attempts plain text extraction

**Chunking Strategies:**
- `sentence`: Chunks by sentence boundaries (default for most documents)
- `paragraph`: Chunks by paragraph breaks (better for structured documents like clinical notes)
- `fixed`: Fixed-size chunks with sentence boundary preference

### 2. Text Extraction Script (`backend/scripts/extract_text.py`)

- Receives base64-encoded file content from Next.js
- Uses `DocumentProcessor` to extract text
- Returns extracted text to Next.js API route

### 3. Upload Script (`backend/scripts/upload_document.py`)

- Receives extracted text from API route
- Determines chunking strategy based on document type:
  - `clinical_note`, `plan_document` → `paragraph` strategy
  - Others → `sentence` strategy
- Calls `PineconeVectorStore.add_user_document()` with chunking enabled

### 4. Pinecone Vector Store (`backend/pinecone_store.py`)

**Chunking Methods:**
- `_chunk_by_sentence()`: Splits text at sentence boundaries
- `_chunk_by_paragraph()`: Splits text at paragraph breaks
- `_chunk_fixed()`: Fixed-size chunks with smart boundary detection

**Storage Process:**
1. Text is chunked using selected strategy
2. Each chunk is processed:
   - Embedded using `_get_embedding()` (Azure OpenAI)
   - Assigned unique vector ID
   - Tagged with metadata:
     - `user_id`: Owner of the document
     - `doc_type`: Type of document (lab_report, bill, clinical_note, etc.)
     - `doc_id`: Document identifier
     - `chunk_index`: Position of chunk in document
     - `text`: The chunk text itself
     - Additional metadata (fileName, fileSize, etc.)
3. All chunks are batch-upserted to Pinecone `private` namespace

## Configuration

### Chunking Parameters

Default values (can be customized in API route):
- **chunk_size**: 1000 characters per chunk
- **chunk_overlap**: 200 characters overlap between chunks
- **chunk_strategy**: Automatically selected based on document type

### Why Chunking?

1. **Better Retrieval**: Smaller chunks improve semantic search accuracy
2. **Token Limits**: Embedding models have token limits
3. **Context Precision**: Retrieves only relevant portions of documents
4. **Overlap**: Ensures context isn't lost at chunk boundaries

## Example

### Input Document
```
Patient: John Doe
Date: 2024-01-15

Chief Complaint: Patient presents with acute pharyngitis.

Assessment: 
- Acute pharyngitis (J02.9)
- Patient reports sore throat for 3 days

Plan:
- Prescribe antibiotics
- Follow-up in 1 week
```

### After Chunking (sentence strategy, chunk_size=200)

**Chunk 1:**
```
Patient: John Doe
Date: 2024-01-15

Chief Complaint: Patient presents with acute pharyngitis.
```

**Chunk 2:**
```
Patient presents with acute pharyngitis.

Assessment: 
- Acute pharyngitis (J02.9)
```

**Chunk 3:**
```
- Acute pharyngitis (J02.9)
- Patient reports sore throat for 3 days

Plan:
```

**Chunk 4:**
```
Plan:
- Prescribe antibiotics
- Follow-up in 1 week
```

Each chunk is:
- Vectorized independently
- Stored with metadata linking it to the original document
- Queryable individually or as part of the document

## Querying Chunked Documents

When querying, Pinecone returns individual chunks. The system can:
1. Retrieve top-k most relevant chunks
2. Filter by `user_id`, `doc_type`, `doc_id`
3. Reconstruct context from multiple chunks
4. Use `chunk_index` to maintain document order

## Benefits

1. **Accurate Retrieval**: Smaller chunks = more precise semantic matches
2. **Scalability**: Can handle documents of any size
3. **Efficiency**: Only relevant chunks are retrieved, not entire documents
4. **Context Preservation**: Overlap ensures no information loss at boundaries
5. **Multi-document Support**: Each chunk is tagged with its source document

## Troubleshooting

### PDF Extraction Fails
- Ensure `pdfplumber` or `PyPDF2` is installed: `pip install pdfplumber PyPDF2`
- Some PDFs may be image-based (requires OCR - not currently implemented)

### Chunks Too Large/Small
- Adjust `chunk_size` parameter in API route
- Change `chunk_strategy` based on document type

### Missing Context
- Increase `chunk_overlap` to preserve more context between chunks
- Use `paragraph` strategy for structured documents

## Future Enhancements

1. **OCR Support**: Extract text from image-based PDFs
2. **Table Extraction**: Preserve table structure in PDFs
3. **Medical Entity Recognition**: Tag chunks with medical entities
4. **Smart Chunking**: Use ML to determine optimal chunk boundaries
5. **Chunk Summarization**: Generate summaries for very long documents

