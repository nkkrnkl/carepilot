"""
FastAPI backend for Lab Analysis feature
Endpoints: /api/labs/upload, /api/labs/process, /api/labs/history, /api/labs/timeseries
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
import shutil
import json
from datetime import datetime
import os

# Optional import - lab_agent may not exist if using Next.js API routes instead
try:
    from lab_agent import LabAgent
    LAB_AGENT_AVAILABLE = True
except ImportError:
    LAB_AGENT_AVAILABLE = False
    LabAgent = None  # type: ignore

app = FastAPI(title="CarePilot Lab Analysis API")

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent lazily (on first use)
agent: Optional[Any] = None

def get_agent():
    """Get or create the lab analysis agent"""
    global agent
    if not LAB_AGENT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="LabAgent not available. This feature now uses Next.js API routes."
        )
    if agent is None:
        agent = LabAgent()
    return agent

# Paths
UPLOAD_ROOT = Path("uploads")
UPLOAD_ROOT.mkdir(exist_ok=True)

DATA_ROOT = Path("data")
DATA_ROOT.mkdir(exist_ok=True)

ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/jpg"}

# ==================== REQUEST/RESPONSE MODELS ====================

class ProcessRequest(BaseModel):
    user_id: str
    file_path: str

class HistoryItem(BaseModel):
    id: str
    date: str
    file_path: str
    summary: Optional[str] = None

class TimeSeriesResponse(BaseModel):
    series: Dict[str, List[Dict[str, Any]]]

# ==================== STORAGE HELPERS ====================

def get_history_file(user_id: str) -> Path:
    """Get history JSON file path for user"""
    return DATA_ROOT / f"history_{user_id}.json"

def load_history(user_id: str) -> List[Dict[str, Any]]:
    """Load history for user"""
    hist_file = get_history_file(user_id)
    if hist_file.exists():
        try:
            with open(hist_file, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_history(user_id: str, history: List[Dict[str, Any]]):
    """Save history for user"""
    hist_file = get_history_file(user_id)
    with open(hist_file, "w") as f:
        json.dump(history, f, indent=2)

def append_history(user_id: str, file_path: str, summary: Optional[str] = None):
    """Append a new history record"""
    history = load_history(user_id)
    new_record = {
        "id": str(uuid.uuid4()),
        "date": datetime.now().isoformat(),
        "file_path": file_path,
        "summary": summary
    }
    history.append(new_record)
    save_history(user_id, history)
    return new_record

def extract_numeric_value(cell: Any) -> Optional[float]:
    """Extract numeric value from table cell (string or number)"""
    if isinstance(cell, (int, float)):
        return float(cell)
    if isinstance(cell, str):
        # Try to extract first number (allow decimals)
        import re
        match = re.search(r'(\d+\.?\d*)', cell.replace(',', ''))
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                pass
    return None

# ==================== API ENDPOINTS ====================

@app.post("/api/labs/upload")
async def upload_lab_file(
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Upload a lab report file (PDF/PNG/JPG)
    Returns: { "file_path": "uploads/<user_id>/<file>.pdf" }
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, PNG, JPG"
        )
    
    # Check file size (10MB limit)
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")
    
    # Create user directory
    user_dir = UPLOAD_ROOT / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    ext = Path(file.filename).suffix or ".pdf"
    dest = user_dir / f"{uuid.uuid4().hex}{ext}"
    
    # Save file
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)
    
    # Return relative path
    relative_path = f"uploads/{user_id}/{dest.name}"
    return {"file_path": relative_path}

@app.post("/api/labs/process")
async def process_lab_endpoint(request: ProcessRequest):
    """
    Process a lab report using LabAnalysisAgent
    Returns: { "dashboard": DashboardPayload, "workflow_completed": boolean }
    """
    try:
        # Resolve file path (handle both relative and absolute)
        file_path = request.file_path
        if not os.path.isabs(file_path):
            file_path = str(UPLOAD_ROOT.parent / file_path) if file_path.startswith("uploads/") else str(UPLOAD_ROOT / file_path)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Determine file type
        ext = Path(file_path).suffix.lower()
        file_type = None
        if ext == ".pdf":
            file_type = "pdf"
        elif ext in (".png", ".jpg", ".jpeg"):
            file_type = ext[1:]  # Remove dot
        
        # Process with agent
        agent_instance = get_agent()
        result = agent_instance.process_lab(
            user_id=request.user_id,
            file_path=file_path,
            file_type=file_type,
            task_description="Process the lab report and generate dashboard"
        )
        
        # Extract dashboard payload
        dashboard = result.get("dashboard", {})
        workflow_completed = result.get("workflow_completed", False)
        
        if not dashboard:
            # If no dashboard, create minimal structure
            dashboard = {
                "summary_cards": [],
                "condition_flags": [],
                "table_compact": {"columns": [], "rows": []}
            }
        
        # Generate summary for history
        summary = None
        if dashboard.get("summary_cards"):
            first_card = dashboard["summary_cards"][0]
            title = first_card.get("title", "")
            value = first_card.get("value", "")
            unit = first_card.get("unit", "")
            summary = f"{title}: {value} {unit}".strip()
        
        # Save to history
        append_history(request.user_id, request.file_path, summary)
        
        return {
            "dashboard": dashboard,
            "workflow_completed": workflow_completed
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/api/labs/history")
async def get_history(user_id: str = Query(...)):
    """
    Get history of processed lab reports for a user
    Returns: List[HistoryItem]
    """
    history = load_history(user_id)
    return history

@app.get("/api/labs/timeseries")
async def get_timeseries(user_id: str = Query(...)):
    """
    Get time-series data for all parameters across history
    Returns: { "series": { "parameter_name": [{ date, value, unit }] } }
    """
    history = load_history(user_id)
    
    if not history:
        return {"series": {}}
    
    # Collect all dashboard data from history
    all_dashboards = []
    for item in history:
        file_path = item.get("file_path", "")
        # Resolve file path
        resolved_path = str(UPLOAD_ROOT.parent / file_path) if file_path.startswith("uploads/") else str(UPLOAD_ROOT / file_path)
        
        # Try to reprocess or load cached dashboard
        # For now, we'll need to reprocess - in production, cache dashboards
        try:
            ext = Path(resolved_path).suffix.lower()
            file_type = None
            if ext == ".pdf":
                file_type = "pdf"
            elif ext in (".png", ".jpg", ".jpeg"):
                file_type = ext[1:]
            
            if os.path.exists(resolved_path):
                agent_instance = get_agent()
                result = agent_instance.process_lab(
                    user_id=user_id,
                    file_path=resolved_path,
                    file_type=file_type
                )
                dashboard = result.get("dashboard", {})
                if dashboard:
                    all_dashboards.append({
                        "date": item.get("date", ""),
                        "dashboard": dashboard
                    })
        except Exception as e:
            # Skip failed processing
            print(f"Warning: Failed to process {resolved_path}: {e}")
            continue
    
    # Aggregate time-series data
    series: Dict[str, List[Dict[str, Any]]] = {}
    
    for item in all_dashboards:
        date = item["date"]
        dashboard = item["dashboard"]
        table_compact = dashboard.get("table_compact", {})
        
        if not table_compact:
            continue
        
        columns = table_compact.get("columns", [])
        rows = table_compact.get("rows", [])
        
        if not columns or not rows:
            continue
        
        # First column is parameter name, rest are values
        param_col_idx = 0
        value_col_indices = list(range(1, len(columns)))
        
        for row in rows:
            if not row or len(row) <= param_col_idx:
                continue
            
            param_name = str(row[param_col_idx]).strip()
            if not param_name:
                continue
            
            # Try each value column
            for val_idx in value_col_indices:
                if val_idx >= len(row):
                    continue
                
                cell_value = row[val_idx]
                numeric_value = extract_numeric_value(cell_value)
                
                if numeric_value is not None:
                    # Extract unit from cell if available
                    unit = None
                    if isinstance(cell_value, str):
                        # Try to extract unit (e.g., "11.0 gm%" -> unit="gm%")
                        import re
                        unit_match = re.search(r'\d+\.?\d*\s*([a-zA-Z%]+)', cell_value)
                        if unit_match:
                            unit = unit_match.group(1)
                    
                    if param_name not in series:
                        series[param_name] = []
                    
                    series[param_name].append({
                        "date": date,
                        "value": numeric_value,
                        "unit": unit
                    })
    
    # Sort each series by date
    for param in series:
        series[param].sort(key=lambda x: x["date"])
    
    return {"series": series}

@app.get("/")
async def root():
    return {
        "message": "CarePilot Lab Analysis API",
        "version": "1.0.0",
        "note": "This FastAPI server is deprecated. Lab reports now use Next.js API routes at /api/labs/*"
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "lab_agent_available": LAB_AGENT_AVAILABLE
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

