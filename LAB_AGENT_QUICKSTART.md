# Lab Agent Quick Start Guide

This guide shows you how to run the LangGraph-based lab agent for processing lab reports.

## Prerequisites

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**Key dependencies:**
- `langgraph` - For the agent workflow
- `pinecone` - For vector storage
- `openai` / `azure-identity` - For embeddings
- `Pillow` / `pytesseract` - For image OCR (PNG/JPG files)
- `pdfplumber` / `PyPDF2` / `unstructured[pdf]` - For PDF extraction

### 2. Install System Dependencies (for PDF/image processing)

**macOS:**
```bash
brew install poppler tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install poppler-utils tesseract-ocr
```

### 3. Set Up Environment Variables

Create a `.env` file in the project root with:

```env
# Pinecone (Direct API - not through Azure)
PINECONE_API_KEY=your_pinecone_api_key_here

# Azure AI Foundry Service (for embeddings)
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# K2 API (for LLM calls in the agent)
K2_API_KEY=your_k2_api_key_here
```

## Running the Lab Agent

### Option 1: Direct Python Usage

Test the lab agent directly from Python:

```python
from lab_agent import LabAgent

# Initialize the agent
agent = LabAgent()

# Process a lab report
result = agent.process_lab(
    user_id="user-123",
    file_path="path/to/your/lab_report.pdf",  # or .png, .jpg
    file_type="pdf",  # or "png", "jpg" (auto-detected if not provided)
    doc_id="lab-abc-456",  # Optional: will be generated if not provided
    task_description="Process the lab report and extract all parameters"
)

# Print results
print(f"Workflow completed: {result.get('workflow_completed')}")
print(f"Parameters extracted: {result.get('parameter_count')}")
print(f"Pinecone stored: {result.get('pinecone_stored')}")
print(f"Lab metadata: {result.get('lab_metadata')}")
print(f"Parameters: {result.get('parameters')}")
```

### Option 2: Run from Command Line (Test Script)

Create a test file `test_lab_agent.py`:

```python
#!/usr/bin/env python3
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from lab_agent import LabAgent
import json

if __name__ == "__main__":
    # Initialize agent
    agent = LabAgent()
    
    # Process a lab report (update path to your file)
    result = agent.process_lab(
        user_id="demo-user",
        file_path="path/to/your/lab_report.pdf",
        file_type="pdf"
    )
    
    # Print results
    print(json.dumps(result, indent=2))
```

Run it:
```bash
python test_lab_agent.py
```

### Option 3: Use from Next.js Frontend

The frontend already uses the lab agent workflow! The upload route at `/app/api/labs/upload/route.ts` processes files and saves to Pinecone.

**To use the lab agent instead of the current OpenAI Vision approach:**

1. The current route uses OpenAI Vision for extraction
2. To use the lab agent, you can modify the route to call the Python script:

```typescript
// In app/api/labs/upload/route.ts
// After saving the file, call the lab agent script:

const scriptPath = join(process.cwd(), "backend", "scripts", "process_lab_with_agent.py");
const agentResult = await executePython(scriptPath, {
  userId,
  filePath: filePath,  // Path to saved file
  fileType: file.type === "application/pdf" ? "pdf" : "png",
  docId: report.id,
});

if (agentResult.success) {
  // Use agentResult.data.parameters instead of normalized.parameters
  // The agent already saved to Pinecone, so you can skip the upload_lab_report.py call
}
```

### Option 4: Use the Backend FastAPI Server

Start the FastAPI server:

```bash
cd backend
python main.py
```

Or with uvicorn:

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Then use the `/api/labs/process` endpoint:

```bash
curl -X POST "http://localhost:8000/api/labs/process" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "file_path": "uploads/user-123/lab_report.pdf"
  }'
```

## Testing the Lab Agent

### Quick Test

1. **Prepare a test lab report** (PDF or PNG)

2. **Run the test script:**

```bash
cd backend
python -c "
from lab_agent import LabAgent
import json

agent = LabAgent()
result = agent.process_lab(
    user_id='test-user',
    file_path='../test_lab_report.pdf',  # Update path
    file_type='pdf'
)
print(json.dumps(result, indent=2))
"
```

### Expected Output

```json
{
  "workflow_completed": true,
  "steps": {
    "step1": {
      "step": 1,
      "status": "Completed",
      "extracted_text": "...",
      "method": "pdf_extraction"
    },
    "step2": {
      "step": 2,
      "status": "Completed",
      "lab_metadata": {
        "title": "Complete Blood Count",
        "date": "2024-01-15",
        "hospital": "General Hospital",
        "doctor": "Dr. Smith"
      },
      "parameters": [
        {
          "name": "Creatinine",
          "value": "1.2",
          "unit": "mg/dL",
          "referenceRange": "0.6-1.2"
        }
      ]
    },
    "step3": {
      "step": 3,
      "status": "Completed",
      "vector_id": "chunk_abc123...",
      "chunk_count": 5
    }
  },
  "user_id": "test-user",
  "doc_id": "lab-abc-456",
  "lab_metadata": {...},
  "parameters": [...],
  "parameter_count": 10,
  "pinecone_stored": true
}
```

## Troubleshooting

### Import Errors

If you get `ImportError: cannot import name 'LabAgent'`:
- Make sure you're in the backend directory or have it in your Python path
- Check that `langgraph` is installed: `pip install langgraph`

### Pinecone Connection Errors

If you get Pinecone connection errors:
- Verify `PINECONE_API_KEY` is set in `.env`
- Check that the Pinecone index `care-pilot` exists (it will be created automatically)

### OCR Errors (for PNG/JPG)

If OCR fails:
- Install tesseract: `brew install tesseract` (macOS) or `sudo apt-get install tesseract-ocr` (Linux)
- Verify pytesseract can find tesseract: `pytesseract.pytesseract.tesseract_cmd = '/usr/local/bin/tesseract'` (adjust path if needed)

### PDF Extraction Errors

If PDF extraction fails:
- Install system dependencies: `brew install poppler` (macOS)
- Try installing unstructured: `pip install "unstructured[pdf]"`

## Next Steps

- The lab agent is now integrated and ready to use
- The frontend at `/app/features/lab-analysis/page.tsx` already displays lab reports
- Data is automatically saved to Pinecone using the same pattern as `claims_agent`
- You can query lab reports from Pinecone using `query_private()` with `doc_type="lab_report"`

