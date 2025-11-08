# Claims Processing - Frontend Integration Setup

This guide explains how the claims processing page calls Python functions directly from Next.js.

## Architecture

Instead of running a separate API server, we:
1. **Next.js API Routes** (`app/api/claims/*`) - Handle HTTP requests
2. **Python Bridge** (`lib/python-bridge.ts`) - Executes Python scripts via `child_process`
3. **Python Scripts** (`scripts/*.py`) - Standalone Python scripts that can be executed
4. **Direct Function Calls** - Python functions are called directly from API routes

## How It Works

### 1. Frontend → API Route
```typescript
// Frontend calls Next.js API route
const response = await fetch("/api/claims/process", {
  method: "POST",
  body: JSON.stringify({ userId, docId, docType })
});
```

### 2. API Route → Python Script
```typescript
// API route executes Python script directly
const result = await executePython("scripts/process_claim.py", inputData);
```

### 3. Python Script → Python Functions
```python
# Python script imports and calls your Python functions
from claims_agent import ClaimsAgent
agent = ClaimsAgent()
result = agent.process_claim(user_id, doc_id, doc_type)
```

## Setup

### 1. Make Python Scripts Executable

```bash
chmod +x backend/scripts/process_claim.py
chmod +x backend/scripts/upload_document.py
```

### 2. Ensure Python is in PATH

The Node.js `child_process` needs to find Python. Make sure:
- Python 3 is installed
- `python` or `python3` command is available in your PATH
- Virtual environment is activated (if using one)

### 3. Install Dependencies

```bash
# Python dependencies
cd backend
pip install -r requirements.txt

# Or from root directory
pip install -r backend/requirements.txt

# Node.js dependencies (already installed)
npm install
```

## Files Created

### Frontend Components
- `components/claims/document-upload.tsx` - Document upload UI
- `components/claims/workflow-progress.tsx` - Workflow progress display
- `components/claims/claim-form.tsx` - Claim processing form

### API Routes
- `app/api/claims/upload/route.ts` - Upload documents
- `app/api/claims/process/route.ts` - Process claims

### Python Bridge
- `lib/python-bridge.ts` - Execute Python scripts from Node.js

### Python Backend
- `backend/api.py` - K2 API client
- `backend/claims_agent.py` - Claims processing agent
- `backend/pinecone_store.py` - Pinecone vector store
- `backend/rag_retriever.py` - RAG retriever
- `backend/scripts/process_claim.py` - Process claims script
- `backend/scripts/upload_document.py` - Upload documents script
- `backend/requirements.txt` - Python dependencies

## Usage

### 1. Upload Documents

Users can upload:
- Insurance plan documents
- Clinical notes
- Medical bills
- Lab reports
- EOBs (Explanation of Benefits)

### 2. Process Claims

The workflow executes:
1. **Pre-Check Coverage** - Verify insurance coverage
2. **Assemble Codes** - Extract CPT and ICD-10 codes
3. **Generate Clean Claim** - Create formatted claim
4. **Monitor Status** - Track claim status

## Benefits of This Approach

1. **No Separate Server** - Everything runs in Next.js
2. **Direct Function Calls** - Python functions called directly
3. **Simpler Deployment** - One application to deploy
4. **Type Safety** - TypeScript types throughout
5. **Easy Debugging** - All code in one codebase

## Environment Variables

Make sure these are set in `.env.local`:

```env
# Pinecone
PINECONE_API_KEY=your_key

# Azure AI Foundry
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2

# K2 API
K2_API_KEY=your_key
```

## Troubleshooting

### Python Not Found
```bash
# Check Python is available
which python
which python3

# If using virtual environment, activate it
source venv/bin/activate
```

### Permission Denied
```bash
# Make scripts executable
chmod +x scripts/*.py
```

### Import Errors
- Ensure Python files are in the `backend/` directory
- Scripts should be in `backend/scripts/` directory
- Check that all Python dependencies are installed (`pip install -r backend/requirements.txt`)
- Verify virtual environment is activated
- When running scripts, ensure you're in the correct directory or Python can find the backend modules

### File Not Found
- Ensure Python scripts are in `backend/scripts/` directory
- Check file paths in API routes (should point to `backend/scripts/`)
- Verify `process.cwd()` returns correct directory

## Next Steps

1. **PDF Text Extraction** - Implement proper PDF parsing (currently placeholder)
2. **Error Handling** - Add better error messages and retry logic
3. **File Validation** - Validate file types and sizes before upload
4. **Progress Tracking** - Add real-time progress updates for long-running operations
5. **Authentication** - Add user authentication to get actual userId
6. **Database** - Store claim status in a database for persistence

## Production Considerations

1. **Security** - Validate all inputs, sanitize file uploads
2. **Performance** - Consider caching, rate limiting
3. **Monitoring** - Add logging and error tracking
4. **Scaling** - Consider moving to a proper API server for high traffic
5. **File Storage** - Store uploaded files in cloud storage (S3, etc.)

