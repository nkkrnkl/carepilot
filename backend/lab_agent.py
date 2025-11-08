"""
Lab Report Processing Agent using LangGraph

This module implements a LangGraph-based agent that processes lab reports
by extracting text from PDF/PNG files, parsing lab parameters using LLM,
and storing the data in Pinecone following the same pattern as claims_agent.
"""

from typing import Dict, List, Any, Optional, TypedDict
import json
import os
from pathlib import Path

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    print("Warning: LangGraph not available. Install with: pip install langgraph")

from pinecone_store import PineconeVectorStore
from api import K2APIClient
from document_processor import DocumentProcessor

# For image processing (PNG/JPG)
try:
    from PIL import Image
    import pytesseract
    IMAGE_PROCESSING_AVAILABLE = True
except ImportError:
    IMAGE_PROCESSING_AVAILABLE = False
    print("Warning: Image processing libraries not available. Install with: pip install Pillow pytesseract")


# ==================== STATE DEFINITION ====================

class LabAgentState(TypedDict):
    """State for the Lab Report Processing Agent"""
    # Input
    user_id: str
    file_path: str
    file_type: Optional[str]  # "pdf", "png", "jpg"
    task_description: str
    
    # Step outputs
    step1_extraction: Optional[Dict[str, Any]]  # Extracted text from file
    step2_parsing: Optional[Dict[str, Any]]  # Parsed lab parameters
    step3_storage: Optional[Dict[str, Any]]  # Storage confirmation
    
    # Workflow state
    current_step: int
    extracted_text: Optional[str]
    lab_parameters: List[Dict[str, Any]]
    lab_metadata: Optional[Dict[str, Any]]  # title, date, hospital, doctor, etc.
    doc_id: Optional[str]
    
    # Final output
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]


# ==================== SYSTEM PROMPTS ====================

MASTER_SYSTEM_PROMPT = """You are 'CarePilot-Lab', an expert AI agent for Lab Report Processing.

Your sole purpose is to process lab reports by executing a precise three-step workflow:
1. Extract text from PDF/PNG files
2. Parse lab parameters and metadata
3. Store data in Pinecone vector store

**Your Tools:**
You have access to a PineconeVectorStore instance with the method:
- `store.add_user_document(user_id, doc_type, doc_id, text, metadata, ...)`: Stores lab report data in the 'private' namespace with doc_type="lab_report"

**Your Constraints:**
- You must perform the following 3 steps **in order**.
- Your output for each step must be a structured JSON object.
- Lab parameters must be extracted with: name, value, unit, and referenceRange (if available).
- Metadata should include: title, date, hospital, doctor (if available).

Always think step by step, extract all parameters accurately, and provide structured JSON outputs."""


STEP_PROMPTS = {
    1: """**Step 1: Extract Text from File**

**Thought:** I must extract all text content from the uploaded file (PDF or PNG/JPG).

**Your Task:**
1. For PDF files: Use document processor to extract text
2. For PNG/JPG files: Use OCR (pytesseract) to extract text
3. Return the extracted text in a structured format

**Expected Output Format:**
```json
{{
  "step": 1,
  "status": "Completed",
  "extracted_text": "Full text content from the lab report...",
  "text_length": 1234,
  "method": "pdf_extraction" or "ocr"
}}
```""",

    2: """**Step 2: Parse Lab Parameters**

**Thought:** I must parse the extracted text to identify all lab parameters, their values, units, and reference ranges. I also need to extract metadata like date, hospital, doctor name.

**Your Task:**
1. Identify all lab test parameters (e.g., "Creatinine", "Glucose", "Hemoglobin")
2. Extract values, units, and reference ranges for each parameter
3. Extract metadata: report date, hospital name, doctor name, report title
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 2,
  "status": "Completed",
  "lab_metadata": {{
    "title": "Complete Blood Count",
    "date": "2024-01-15",
    "hospital": "General Hospital",
    "doctor": "Dr. Smith"
  }},
  "parameters": [
    {{
      "name": "Creatinine",
      "value": "1.2",
      "unit": "mg/dL",
      "referenceRange": "0.6-1.2"
    }},
    {{
      "name": "Glucose",
      "value": "95",
      "unit": "mg/dL",
      "referenceRange": "70-100"
    }}
  ],
  "parameter_count": 2
}}
```""",

    3: """**Step 3: Store in Pinecone**

**Thought:** I will now store the parsed lab report data in Pinecone using the same pattern as claims_agent. I'll format the text properly and use add_user_document with doc_type="lab_report".

**Your Task:**
1. Format the lab report data as text for embedding
2. Store using store.add_user_document with proper metadata
3. Return confirmation

**Expected Output Format:**
```json
{{
  "step": 3,
  "status": "Completed",
  "vector_id": "chunk_abc123...",
  "chunk_count": 5,
  "message": "Lab report stored successfully in Pinecone"
}}
```"""
}


# ==================== LAB AGENT CLASS ====================

class LabAgent:
    """Lab Report Processing Agent using LangGraph"""
    
    def __init__(
        self,
        vector_store: Optional[PineconeVectorStore] = None,
        llm_client: Optional[K2APIClient] = None
    ):
        """
        Initialize Lab Agent
        
        Args:
            vector_store: PineconeVectorStore instance
            llm_client: K2APIClient instance
        """
        if not LANGGRAPH_AVAILABLE:
            raise ImportError(
                "LangGraph is required for LabAgent. "
                "Install with: pip install langgraph"
            )
        
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
        self.document_processor = DocumentProcessor()
        
        # Build the workflow graph
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(LabAgentState)
        
        # Add nodes
        workflow.add_node("step1_extraction", self._step1_extract_text)
        workflow.add_node("step2_parsing", self._step2_parse_parameters)
        workflow.add_node("step3_storage", self._step3_store_pinecone)
        
        # Define edges
        workflow.set_entry_point("step1_extraction")
        workflow.add_edge("step1_extraction", "step2_parsing")
        workflow.add_edge("step2_parsing", "step3_storage")
        workflow.add_edge("step3_storage", END)
        
        return workflow.compile()
    
    def _extract_text_from_file(self, file_path: str, file_type: Optional[str]) -> Dict[str, Any]:
        """Extract text from file (PDF or image)"""
        file_path_obj = Path(file_path)
        
        if not file_path_obj.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine file type from extension if not provided
        if not file_type:
            ext = file_path_obj.suffix.lower()
            if ext == ".pdf":
                file_type = "pdf"
            elif ext in [".png", ".jpg", ".jpeg"]:
                file_type = ext[1:]  # Remove dot
            else:
                raise ValueError(f"Unsupported file type: {ext}")
        
        # Read file content
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        # Extract text based on file type
        if file_type == "pdf":
            # Use document processor for PDF
            result = self.document_processor.extract_text(
                file_content=file_content,
                file_name=file_path_obj.name,
                file_type="application/pdf"
            )
            
            if not result["success"]:
                raise Exception(f"PDF extraction failed: {result.get('error', 'Unknown error')}")
            
            return {
                "text": result["text"],
                "method": "pdf_extraction",
                "text_length": len(result["text"])
            }
        
        elif file_type in ["png", "jpg", "jpeg"]:
            # Use OCR for images
            if not IMAGE_PROCESSING_AVAILABLE:
                raise ImportError(
                    "Image processing libraries not available. "
                    "Install with: pip install Pillow pytesseract"
                )
            
            try:
                image = Image.open(file_path)
                # Convert to RGB if necessary
                if image.mode != "RGB":
                    image = image.convert("RGB")
                
                # Extract text using OCR
                text = pytesseract.image_to_string(image)
                
                return {
                    "text": text,
                    "method": "ocr",
                    "text_length": len(text)
                }
            except Exception as e:
                raise Exception(f"OCR extraction failed: {str(e)}")
        
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    def _step1_extract_text(self, state: LabAgentState) -> LabAgentState:
        """Step 1: Extract Text from File"""
        try:
            file_path = state["file_path"]
            file_type = state.get("file_type")
            
            # Extract text from file
            extraction_result = self._extract_text_from_file(file_path, file_type)
            
            # Use LLM to structure the response
            user_message = f"""Based on the file extraction, complete Step 1: Extract Text from File.

**Extraction Result:**
- Method: {extraction_result['method']}
- Text Length: {extraction_result['text_length']} characters
- Extracted Text (first 500 chars): {extraction_result['text'][:500]}...

{STEP_PROMPTS[1]}

Please provide your response in the exact JSON format specified."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    step_result["extracted_text"] = extraction_result["text"]
                    step_result["text_length"] = extraction_result["text_length"]
                    step_result["method"] = extraction_result["method"]
                    state["step1_extraction"] = step_result
                else:
                    # Fallback: create structured response
                    state["step1_extraction"] = {
                        "step": 1,
                        "status": "Completed",
                        "extracted_text": extraction_result["text"],
                        "text_length": extraction_result["text_length"],
                        "method": extraction_result["method"]
                    }
            else:
                # Fallback response
                state["step1_extraction"] = {
                    "step": 1,
                    "status": "Completed",
                    "extracted_text": extraction_result["text"],
                    "text_length": extraction_result["text_length"],
                    "method": extraction_result["method"]
                }
            
            state["extracted_text"] = extraction_result["text"]
            state["current_step"] = 1
            
        except Exception as e:
            state["error"] = f"Step 1 error: {str(e)}"
            state["step1_extraction"] = {
                "step": 1,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step2_parse_parameters(self, state: LabAgentState) -> LabAgentState:
        """Step 2: Parse Lab Parameters"""
        try:
            extracted_text = state.get("extracted_text")
            
            if not extracted_text:
                raise ValueError("No extracted text available from Step 1")
            
            # Use LLM to parse lab parameters
            user_message = f"""Based on the extracted text from the lab report, complete Step 2: Parse Lab Parameters.

**Extracted Text:**
{extracted_text[:3000]}  # Limit to first 3000 chars to avoid token limits

{STEP_PROMPTS[2]}

Please provide your response in the exact JSON format specified. Extract ALL lab parameters you can find, including their values, units, and reference ranges."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    state["step2_parsing"] = step_result
                    state["lab_parameters"] = step_result.get("parameters", [])
                    state["lab_metadata"] = step_result.get("lab_metadata", {})
                else:
                    # Fallback: try to extract basic structure
                    state["step2_parsing"] = {
                        "step": 2,
                        "status": "Completed",
                        "lab_metadata": {},
                        "parameters": [],
                        "parameter_count": 0
                    }
                    state["lab_parameters"] = []
                    state["lab_metadata"] = {}
            else:
                # Fallback response
                state["step2_parsing"] = {
                    "step": 2,
                    "status": "Completed",
                    "lab_metadata": {},
                    "parameters": [],
                    "parameter_count": 0
                }
                state["lab_parameters"] = []
                state["lab_metadata"] = {}
            
            state["current_step"] = 2
            
        except Exception as e:
            state["error"] = f"Step 2 error: {str(e)}"
            state["step2_parsing"] = {
                "step": 2,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step3_store_pinecone(self, state: LabAgentState) -> LabAgentState:
        """Step 3: Store in Pinecone"""
        try:
            user_id = state["user_id"]
            doc_id = state.get("doc_id")
            lab_parameters = state.get("lab_parameters", [])
            lab_metadata = state.get("lab_metadata", {})
            extracted_text = state.get("extracted_text", "")
            
            if not doc_id:
                # Generate a doc_id if not provided
                import uuid
                doc_id = f"lab-{uuid.uuid4().hex[:8]}"
                state["doc_id"] = doc_id
            
            # Build formatted text for Pinecone storage (same format as upload_lab_report.py)
            title = lab_metadata.get("title") or "Lab Report"
            date = lab_metadata.get("date") or "Date unknown"
            hospital = lab_metadata.get("hospital") or "Hospital unknown"
            doctor = lab_metadata.get("doctor") or "Doctor unknown"
            
            text = f"""Title: {title}
Date: {date}
Hospital: {hospital}
Doctor: {doctor}
Parameters:
"""
            
            # Add parameters
            for param in lab_parameters:
                name = param.get("name", "")
                value = param.get("value", "")
                unit = param.get("unit") or ""
                ref_range = param.get("referenceRange") or ""
                
                if ref_range:
                    text += f"{name}: {value} {unit} (Range: {ref_range})\n"
                else:
                    text += f"{name}: {value} {unit}\n"
            
            # Store in Pinecone using the SAME method as claims_agent
            # Use "lab_report" as doc_type, chunk with sentence strategy
            result_data = self.vector_store.add_user_document(
                user_id=user_id,
                doc_type="lab_report",
                doc_id=doc_id,
                text=text,
                metadata={
                    "title": title,
                    "date": date,
                    "hospital": hospital,
                    "doctor": doctor,
                    "type": "lab_report",
                    "parameter_count": len(lab_parameters),
                },
                chunk_text=True,  # Enable chunking for better retrieval
                chunk_size=1000,
                chunk_overlap=200,
                chunk_strategy="sentence"  # Lab reports use sentence chunking
            )
            
            # Handle both single vector ID and list of vector IDs (from chunking)
            if isinstance(result_data, list):
                vector_ids = result_data
                vector_id = vector_ids[0]  # Use first chunk ID as primary
                chunk_count = len(vector_ids)
            else:
                vector_ids = [result_data]
                vector_id = result_data
                chunk_count = 1
            
            # Use LLM to structure the response
            user_message = f"""Based on the storage operation, complete Step 3: Store in Pinecone.

**Storage Result:**
- Vector ID: {vector_id}
- Chunk Count: {chunk_count}
- Parameters Stored: {len(lab_parameters)}

{STEP_PROMPTS[3]}

Please provide your response in the exact JSON format specified."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    step_result["vector_id"] = vector_id
                    step_result["chunk_count"] = chunk_count
                    state["step3_storage"] = step_result
                else:
                    # Fallback: create structured response
                    state["step3_storage"] = {
                        "step": 3,
                        "status": "Completed",
                        "vector_id": vector_id,
                        "chunk_count": chunk_count,
                        "message": f"Lab report stored successfully in Pinecone ({chunk_count} chunk{'s' if chunk_count > 1 else ''})"
                    }
            else:
                # Fallback response
                state["step3_storage"] = {
                    "step": 3,
                    "status": "Completed",
                    "vector_id": vector_id,
                    "chunk_count": chunk_count,
                    "message": f"Lab report stored successfully in Pinecone ({chunk_count} chunk{'s' if chunk_count > 1 else ''})"
                }
            
            # Compile final result
            state["final_result"] = {
                "workflow_completed": True,
                "steps": {
                    "step1": state.get("step1_extraction", {}),
                    "step2": state.get("step2_parsing", {}),
                    "step3": state.get("step3_storage", {})
                },
                "user_id": user_id,
                "doc_id": doc_id,
                "lab_metadata": lab_metadata,
                "parameters": lab_parameters,
                "parameter_count": len(lab_parameters),
                "pinecone_stored": True,
                "vector_id": vector_id,
                "chunk_count": chunk_count
            }
            
            state["current_step"] = 3
            
        except Exception as e:
            state["error"] = f"Step 3 error: {str(e)}"
            state["step3_storage"] = {
                "step": 3,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _extract_json_from_response(self, content: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from LLM response"""
        try:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            else:
                # Try parsing the entire content as JSON
                return json.loads(content)
        except Exception:
            return None
    
    def process_lab(
        self,
        user_id: str,
        file_path: str,
        file_type: Optional[str] = None,
        doc_id: Optional[str] = None,
        task_description: str = "Process the lab report and extract all parameters"
    ) -> Dict[str, Any]:
        """
        Process a lab report using the 3-step workflow
        
        Args:
            user_id: User identifier
            file_path: Path to the lab report file (PDF or PNG/JPG)
            file_type: File type ("pdf", "png", "jpg") - auto-detected if not provided
            doc_id: Document ID (optional, will be generated if not provided)
            task_description: Task description
            
        Returns:
            Final workflow result with parsed parameters and storage confirmation
        """
        # Initialize state
        initial_state: LabAgentState = {
            "user_id": user_id,
            "file_path": file_path,
            "file_type": file_type,
            "task_description": task_description,
            "step1_extraction": None,
            "step2_parsing": None,
            "step3_storage": None,
            "current_step": 0,
            "extracted_text": None,
            "lab_parameters": [],
            "lab_metadata": None,
            "doc_id": doc_id,
            "final_result": None,
            "error": None
        }
        
        # Run the workflow
        try:
            final_state = self.workflow.invoke(initial_state)
            return final_state.get("final_result", final_state)
        except Exception as e:
            return {
                "workflow_completed": False,
                "error": str(e),
                "state": initial_state
            }


# ==================== EXAMPLE USAGE ====================

if __name__ == "__main__":
    # Initialize agent
    agent = LabAgent()
    
    # Process a lab report
    print("=" * 60)
    print("LAB REPORT PROCESSING AGENT - EXAMPLE")
    print("=" * 60)
    
    # Example: Process a PDF lab report
    result = agent.process_lab(
        user_id="user-123",
        file_path="path/to/lab_report.pdf",
        file_type="pdf",
        doc_id="lab-abc-456",
        task_description="Process the lab report and extract all parameters"
    )
    
    print("\n" + "=" * 60)
    print("WORKFLOW RESULT")
    print("=" * 60)
    print(json.dumps(result, indent=2))

