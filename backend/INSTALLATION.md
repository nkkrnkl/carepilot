# Backend Installation Guide

## Dependencies

Install all Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Or from the root directory:

```bash
pip install -r backend/requirements.txt
```

## Key Dependencies

### PDF Processing

The system uses **UnstructuredPDFLoader** from LangChain for PDF text extraction:

```bash
pip install langchain-community
pip install "unstructured[pdf]"
```

**System Dependencies** (required for unstructured PDF processing):

#### macOS:
```bash
brew install poppler tesseract
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install poppler-utils tesseract-ocr
```

#### Windows:
- Install Poppler: Download from https://github.com/oschwartz10612/poppler-windows/releases
- Install Tesseract: Download from https://github.com/UB-Mannheim/tesseract/wiki

**Fallback Options:**

If UnstructuredPDFLoader is not available, the system will fall back to:
- `pdfplumber` (installed by default)
- `PyPDF2` (installed by default)

### Other Dependencies

- **Pinecone**: `pinecone-client` - Vector database
- **Azure OpenAI**: `openai`, `azure-identity`, `azure-core` - Embeddings
- **LangChain**: `langchain`, `langchain-community`, `langchain-openai` - Document processing and AI workflows
- **LangGraph**: `langgraph` - Agent workflow orchestration

## Verification

After installation, verify that UnstructuredPDFLoader is available:

```bash
python3 -c "from langchain_community.document_loaders import UnstructuredPDFLoader; print('✓ UnstructuredPDFLoader installed')"
```

## Troubleshooting

### UnstructuredPDFLoader Import Error

If you get an import error for `UnstructuredPDFLoader`:

1. Install langchain-community:
   ```bash
   pip install langchain-community
   ```

2. Install unstructured with PDF support:
   ```bash
   pip install "unstructured[pdf]"
   ```

3. Install system dependencies (see above)

### PDF Extraction Fails

If PDF extraction fails:

1. Check system dependencies are installed (poppler, tesseract)
2. Verify unstructured is installed: `pip show unstructured`
3. The system will automatically fall back to pdfplumber or PyPDF2 if UnstructuredPDFLoader fails

### Permission Errors

If you encounter permission errors with temporary files:

- Ensure the system temp directory is writable
- On Linux/Mac: `chmod 777 /tmp` (or appropriate permissions)
- The system creates temporary PDF files during extraction

