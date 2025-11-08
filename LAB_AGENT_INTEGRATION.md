# Lab Agent Integration - Frontend to Python Connection

## ✅ Integration Complete!

The frontend (`page.tsx`) is now connected to the Python `LabAgent` class (`lab_agent.py`) **without using FastAPI**.

## How It Works

### Architecture Flow

```
Frontend (page.tsx)
    ↓ (upload file)
Next.js API Route (app/api/labs/upload/route.ts)
    ↓ (executePython)
Python Bridge (lib/python-bridge.ts)
    ↓ (child_process.exec)
Python Script (backend/scripts/process_lab_with_agent.py)
    ↓ (import & call)
LabAgent Class (backend/lab_agent.py)
    ↓ (LangGraph workflow)
Pinecone Vector Store
```

### Step-by-Step Process

1. **User uploads file** → `page.tsx` → `UploadDropzone` component
2. **File sent to API** → `POST /api/labs/upload`
3. **File saved** → Saved to `uploads/{userId}/{filename}`
4. **Lab Agent called** → `executePython()` calls `process_lab_with_agent.py`
5. **Agent processes** → LangGraph workflow:
   - Step 1: Extract text (PDF/PNG)
   - Step 2: Parse parameters (LLM)
   - Step 3: Store in Pinecone
6. **Results returned** → Agent returns parsed parameters
7. **Database saved** → Prisma saves to SQLite
8. **Frontend updated** → User sees extracted parameters

## Key Files

### Frontend
- `app/features/lab-analysis/page.tsx` - Main page component
- `components/labs/UploadDropzone.tsx` - File upload UI
- `components/labs/CurrentDataCards.tsx` - Display parameters
- `components/labs/PastVisitsCharts.tsx` - Time series graphs

### API Route
- `app/api/labs/upload/route.ts` - Handles file upload and calls lab agent

### Python Bridge
- `lib/python-bridge.ts` - Executes Python scripts from Node.js

### Python Script
- `backend/scripts/process_lab_with_agent.py` - Wrapper script that calls LabAgent

### Lab Agent
- `backend/lab_agent.py` - LangGraph-based agent that processes lab reports

## How the Connection Works

### 1. Python Bridge (`lib/python-bridge.ts`)

Uses Node.js `child_process` to execute Python scripts:

```typescript
const result = await executePython(scriptPath, {
  userId: "demo-user",
  filePath: "/path/to/file.pdf",
  fileType: "pdf",
  docId: "lab-123"
});
```

### 2. Python Script (`process_lab_with_agent.py`)

Receives JSON input, calls LabAgent, returns JSON output:

```python
from lab_agent import LabAgent

agent = LabAgent()
result = agent.process_lab(
    user_id=input_data["userId"],
    file_path=input_data["filePath"],
    file_type=input_data["fileType"],
    doc_id=input_data.get("docId")
)
```

### 3. Lab Agent (`lab_agent.py`)

Processes the file using LangGraph workflow and saves to Pinecone.

## Fallback Mechanism

The integration includes a smart fallback:

1. **Primary**: Try Lab Agent (LangGraph workflow)
2. **Fallback**: If agent fails, use OpenAI Vision (original method)
3. **Both save to Pinecone** using the same pattern

## Testing

1. **Start dev server**: `npm run dev`
2. **Go to**: `http://localhost:3000/features/lab-analysis`
3. **Upload a PDF or PNG** lab report
4. **Check console** for:
   - `"Lab agent processed successfully"` - Agent worked!
   - `"Lab agent failed, falling back..."` - Using OpenAI Vision

## Troubleshooting

### Agent Not Running?

Check:
- Python dependencies installed: `pip install -r backend/requirements.txt`
- Script is executable: `chmod +x backend/scripts/process_lab_with_agent.py`
- Environment variables set in `.env`
- Check console logs for Python errors

### Agent Fails?

The system automatically falls back to OpenAI Vision, so uploads will still work.

## Benefits

✅ **No FastAPI needed** - Direct Python execution from Next.js  
✅ **Same pattern as claims** - Consistent architecture  
✅ **Automatic fallback** - Always works even if agent fails  
✅ **LangGraph workflow** - Structured 3-step processing  
✅ **Pinecone integration** - Same storage pattern as claims_agent  

