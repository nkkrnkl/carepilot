# CarePilot Backend

Python backend for CarePilot claims processing system.

## Structure

```
backend/
├── __init__.py
├── api.py                    # K2 API client
├── claims_agent.py           # Claims processing agent (LangGraph)
├── claims_agent_example.py   # Example usage
├── pinecone_store.py         # Pinecone vector store manager
├── rag_retriever.py          # RAG retriever for dual-query flow
├── requirements.txt          # Python dependencies
└── scripts/
    ├── process_claim.py      # Script to process claims (called from Next.js)
    └── upload_document.py    # Script to upload documents (called from Next.js)
```

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or from root directory
pip install -r backend/requirements.txt
```

### PDF Processing Setup

The system uses **UnstructuredPDFLoader** for PDF text extraction. Additional setup may be required:

1. **Install system dependencies** (for unstructured PDF processing):
   - **macOS**: `brew install poppler tesseract`
   - **Ubuntu/Debian**: `sudo apt-get install poppler-utils tesseract-ocr`
   - **Windows**: Install Poppler and Tesseract from their respective websites

2. **Verify installation**:
   ```bash
   python3 -c "from langchain_community.document_loaders import UnstructuredPDFLoader; print('✓ Installed')"
   ```

See `INSTALLATION.md` for detailed setup instructions.

## Usage

### Direct Python Usage

```python
from claims_agent import ClaimsAgent
from pinecone_store import PineconeVectorStore

# Initialize
store = PineconeVectorStore()
agent = ClaimsAgent(vector_store=store)

# Process claim
result = agent.process_claim(
    user_id="user-123",
    doc_id="note-abc-456",
    doc_type="clinical_note"
)
```

### Called from Next.js

The scripts in `scripts/` are called directly from Next.js API routes via `python-bridge.ts`.

## Environment Variables

Set these in `.env` (in the root directory):

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

## Documentation

- See root `README.md` for overall project documentation
- See `CLAIMS_AGENT_README.md` for claims agent details
- See `CLAIMS_SETUP.md` for setup instructions

