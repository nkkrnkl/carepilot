# Repository Reorganization Summary

## Changes Made

All Python files have been moved to the `backend/` directory for better organization.

## New Structure

```
carepilot/
├── backend/                    # All Python files
│   ├── __init__.py
│   ├── api.py                  # K2 API client
│   ├── claims_agent.py         # Claims processing agent
│   ├── claims_agent_example.py # Example usage
│   ├── pinecone_store.py       # Pinecone vector store
│   ├── rag_retriever.py        # RAG retriever
│   ├── requirements.txt        # Python dependencies
│   ├── README.md               # Backend documentation
│   └── scripts/
│       ├── process_claim.py    # Process claims script
│       └── upload_document.py  # Upload documents script
├── app/                        # Next.js frontend
│   └── api/
│       └── claims/
│           ├── upload/
│           │   └── route.ts    # Updated to use backend/scripts
│           └── process/
│               └── route.ts    # Updated to use backend/scripts
├── components/                 # React components
├── lib/
│   └── python-bridge.ts        # Updated to use backend/scripts
└── requirements.txt            # Redirects to backend/requirements.txt
```

## Files Moved

### Root → Backend
- `api.py` → `backend/api.py`
- `claims_agent.py` → `backend/claims_agent.py`
- `claims_agent_example.py` → `backend/claims_agent_example.py`
- `pinecone_store.py` → `backend/pinecone_store.py`
- `rag_retriever.py` → `backend/rag_retriever.py`
- `requirements.txt` → `backend/requirements.txt`

### Scripts → Backend/Scripts
- `scripts/process_claim.py` → `backend/scripts/process_claim.py`
- `scripts/upload_document.py` → `backend/scripts/upload_document.py`

## Files Updated

### API Routes
- `app/api/claims/upload/route.ts` - Updated path to `backend/scripts/upload_document.py`
- `app/api/claims/process/route.ts` - Updated path to `backend/scripts/process_claim.py`

### Python Bridge
- `lib/python-bridge.ts` - Updated default path to `backend/scripts/`

### Python Scripts
- `backend/scripts/process_claim.py` - Updated import paths
- `backend/scripts/upload_document.py` - Updated import paths

### Documentation
- `README.md` - Updated installation instructions
- `CLAIMS_SETUP.md` - Updated file paths and instructions
- `CLAIMS_AGENT_README.md` - Updated installation instructions
- `backend/README.md` - New backend-specific documentation

## Installation

### Before
```bash
pip install -r requirements.txt
```

### After
```bash
# Option 1: From backend directory
cd backend
pip install -r requirements.txt

# Option 2: From root directory
pip install -r backend/requirements.txt
```

## Usage

### Running Python Scripts Directly

```bash
# From root directory
python backend/scripts/process_claim.py input.json output.json

# Or from backend directory
cd backend
python scripts/process_claim.py input.json output.json
```

### Running Python Examples

```bash
# From backend directory
cd backend
python claims_agent_example.py
```

### From Next.js API Routes

The API routes automatically use the correct paths:
- `/api/claims/upload` → `backend/scripts/upload_document.py`
- `/api/claims/process` → `backend/scripts/process_claim.py`

## Benefits

1. **Better Organization** - Clear separation between frontend and backend
2. **Easier Maintenance** - All Python code in one place
3. **Cleaner Root** - Root directory less cluttered
4. **Scalability** - Easy to add more backend modules
5. **Deployment** - Can deploy frontend and backend separately if needed

## Migration Notes

- All imports within Python files remain the same (they're all in the same directory)
- Scripts in `backend/scripts/` correctly import from parent `backend/` directory
- Next.js API routes updated to use new paths
- Documentation updated to reflect new structure
- Virtual environment can still be in root or backend directory

## Testing

After reorganization, test:

1. **Python Scripts**:
   ```bash
   cd backend
   python scripts/process_claim.py test_input.json test_output.json
   ```

2. **Python Modules**:
   ```bash
   cd backend
   python -c "from pinecone_store import PineconeVectorStore; print('OK')"
   ```

3. **Next.js API Routes**:
   - Start Next.js dev server: `npm run dev`
   - Test upload endpoint: `/api/claims/upload`
   - Test process endpoint: `/api/claims/process`

## No Breaking Changes

- All functionality remains the same
- Only file locations changed
- Imports updated automatically
- API endpoints work the same way

