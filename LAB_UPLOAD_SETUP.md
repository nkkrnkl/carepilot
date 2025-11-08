# Lab Upload Setup & Usage Guide

## Prerequisites

1. **Python 3.8+** (you have Python 3.11.5 ✓)
2. **Node.js 18+** (for Next.js)
3. **Environment variables** configured in `.env`

## Setup Steps

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or if you prefer a virtual environment:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Verify Environment Variables

Make sure your `.env` file has:

```env
# OpenAI (for lab report extraction)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Pinecone
PINECONE_API_KEY=your_pinecone_key

# Azure OpenAI (for embeddings)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15
```

### 3. Install Node.js Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## How to Use

### 1. Access the Lab Analysis Page

Navigate to: `http://localhost:3000/features/lab-analysis`

### 2. Upload a Lab Report

1. Click the upload area or drag and drop a file
2. Supported formats: PDF, PNG, JPG, JPEG
3. Maximum file size: 10MB
4. Click "Upload & Analyze"

### 3. What Happens

1. **Text Extraction**: The system extracts text from your PDF/image
2. **Structured Extraction**: OpenAI analyzes the text and extracts:
   - Test names (analytes)
   - Values and units
   - Reference ranges
   - Flags (H/L/High/Low)
   - Dates and doctor information
3. **Storage**: Data is stored in Pinecone in two formats:
   - Full text chunks (for RAG retrieval)
   - Individual lab results (for lab_agent.py queries)

### 4. Success Feedback

You'll see:
- Success message
- Number of lab results extracted
- The file is cleared and ready for next upload

## Testing the Lab Agent

After uploading, you can test the lab agent:

```python
from backend.lab_agent import LabAgent

# Initialize agent
agent = LabAgent()

# Analyze lab report
result = agent.analyze_lab_report(
    user_id="default-user",
    doc_id=None,  # Analyze all reports, or specify a doc_id
    analyte=None,  # Analyze all analytes, or specify "A1C"
    task_description="Analyze the lab report and provide insights"
)

print(result)
```

## Troubleshooting

### Python Script Errors

If you see Python errors:
1. Check that all dependencies are installed: `pip list | grep -E "(openai|pinecone|langgraph)"`
2. Verify Python path: `which python3`
3. Check environment variables are loaded: `python3 -c "import os; print(os.getenv('OPENAI_API_KEY')[:10])"`

### Upload Fails

1. Check browser console for errors
2. Check server logs for Python script errors
3. Verify file size is under 10MB
4. Check file format is PDF, PNG, or JPG

### No Results Extracted

1. Check OpenAI API key is valid
2. Verify the document has readable text (not just images)
3. Check server logs for extraction errors

## File Structure

```
carepilot/
├── app/
│   ├── api/
│   │   └── labs/
│   │       └── upload/
│   │           └── route.ts          # Upload API endpoint
│   └── features/
│       └── lab-analysis/
│           └── page.tsx              # Frontend upload UI
├── backend/
│   └── scripts/
│       ├── extract_text.py           # Text extraction
│       └── process_lab_report.py      # Lab report processing
├── lib/
│   └── python-bridge.ts              # Python script executor
└── .env                               # Environment variables
```

## Next Steps

After uploading, you can:
1. Use `lab_agent.py` to analyze the results
2. Query Pinecone directly for lab data
3. Build additional features on top of the stored data


