# Labs Agent Implementation Plan

## ETL Pipeline Analysis from niki.claims

### Key Findings:

1. **Pinecone Configuration**:
   - Index: `care-pilot` (single index)
   - Namespaces: `kb` (knowledge base), `private` (user PHI)
   - Dimension: 3072 (text-embedding-3-large)
   - Metric: cosine
   - Spec: serverless (AWS, us-east-1)

2. **Embedding Model**:
   - Azure OpenAI: text-embedding-3-large
   - Endpoint: AZURE_OPENAI_ENDPOINT
   - API Key: AZURE_OPENAI_API_KEY
   - Deployment: AZURE_OPENAI_DEPLOYMENT_NAME
   - API Version: 2023-05-15
   - Dimension: 3072 (default)

3. **Chunking Strategy**:
   - chunk_size: 1000 characters
   - chunk_overlap: 200 characters
   - chunk_strategy: "sentence" (default) or "paragraph" for clinical_note/plan_document
   - Uses DocumentProcessor.chunk_text() method

4. **Metadata Schema** (for private namespace):
   ```python
   {
       "user_id": str,           # Required for multi-tenancy
       "doc_type": str,          # e.g., "lab_report", "bill", "clinical_note"
       "doc_id": str,            # Document identifier
       "chunk_index": int,       # For chunked documents
       "text": str,              # Chunk text content
       "fileName": str,          # Optional: from input
       "fileSize": int,          # Optional: from input
   }
   ```

5. **Vector ID Generation**:
   - Pattern: `{prefix}_{hash}`
   - For chunks: `chunk_{user_id}_{doc_type}_{doc_id}_{chunk_idx}_{text_hash}`
   - Uses MD5 hash of text content

6. **ETL Flow**:
   ```
   PDF/Image Upload
       ↓
   extract_text.py (DocumentProcessor.extract_text())
       → Returns raw text
       ↓
   upload_document.py (PineconeVectorStore.add_user_document())
       → Chunks text (if enabled)
       → Generates embeddings (Azure OpenAI)
       → Upserts to Pinecone 'private' namespace
       → Returns vector IDs
   ```

7. **Retrieval Pattern**:
   - `query_private(query_text, user_id, doc_types, top_k, additional_filter)`
   - Filter: `{"user_id": {"$eq": user_id}, "doc_type": {"$in": doc_types}}`
   - Returns: matches with id, score, metadata

## Implementation Strategy

Since the current branch (abhinav.lab_analysis) may not have all the backend infrastructure, I'll create a **Python-based Labs Agent** that mirrors the claims agent structure exactly, reusing the same PineconeVectorStore and DocumentProcessor.

### File Structure (mirroring claims):

```
backend/
├── labs_agent.py              # Main agent (mirrors claims_agent.py)
├── scripts/
│   ├── extract_text.py        # Already exists (reuse)
│   ├── upload_document.py     # Already exists (reuse)
│   └── process_lab.py          # New: Lab-specific processing
└── (pinecone_store.py)        # Should exist or be copied from niki.claims

app/api/labs/
├── ingest/route.ts            # New: ETL endpoint
├── search/route.ts            # New: RAG search
├── parameters/route.ts         # New: List parameters
└── timeseries/route.ts        # New: Time series data
```

### Key Implementation Details:

1. **Reuse Existing Infrastructure**:
   - `PineconeVectorStore` - same class, same config
   - `DocumentProcessor` - same chunking logic
   - Same embedding model and dimension

2. **Labs-Specific Adaptations**:
   - doc_type: "lab_report" (instead of "clinical_note", "bill")
   - Additional metadata: `reportDate`, `hospital`, `doctor` (if available)
   - Parameter extraction for time-series queries

3. **Namespace Policy**:
   - Use same `private` namespace as claims
   - Filter by `doc_type: "lab_report"` for labs-specific queries
   - No new namespace needed

