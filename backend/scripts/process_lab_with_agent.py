#!/usr/bin/env python3
"""
Python script to process lab reports using LabAgent - called from Next.js API routes
This uses the LangGraph-based agent workflow to extract and parse lab parameters
"""

import sys
import json
import os
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from lab_agent import LabAgent

def main():
    # Read input from file
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing input/output file arguments"}))
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # Read input data
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        
        # Get required fields
        user_id = input_data.get("userId")
        file_path = input_data.get("filePath")
        file_type = input_data.get("fileType")  # "pdf", "png", "jpg"
        doc_id = input_data.get("docId")  # Optional
        
        if not user_id or not file_path:
            raise ValueError("userId and filePath are required")
        
        # Resolve file path (handle both relative and absolute)
        if not os.path.isabs(file_path):
            # Try relative to backend directory
            backend_path = Path(backend_dir) / file_path
            if backend_path.exists():
                file_path = str(backend_path)
            else:
                # Try relative to project root
                project_root = backend_dir.parent
                project_path = project_root / file_path
                if project_path.exists():
                    file_path = str(project_path)
                else:
                    raise FileNotFoundError(f"File not found: {file_path}")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine file type from extension if not provided
        if not file_type:
            ext = Path(file_path).suffix.lower()
            if ext == ".pdf":
                file_type = "pdf"
            elif ext in [".png", ".jpg", ".jpeg"]:
                file_type = ext[1:]  # Remove dot
            else:
                raise ValueError(f"Unsupported file type: {ext}")
        
        # Initialize agent
        agent = LabAgent()
        
        # Process lab report using the agent workflow
        result = agent.process_lab(
            user_id=user_id,
            file_path=file_path,
            file_type=file_type,
            doc_id=doc_id,
            task_description="Process the lab report and extract all parameters"
        )
        
        # Check if workflow completed successfully
        workflow_completed = result.get("workflow_completed", False)
        has_parameters = result.get("has_parameters", False)
        parsing_failed = result.get("parsing_failed", False)
        error = result.get("error")
        
        # Validate that we actually extracted parameters
        parameters = result.get("parameters", [])
        if not workflow_completed or parsing_failed or not has_parameters or len(parameters) == 0:
            error_msg = error or "Failed to extract lab parameters"
            if parsing_failed:
                error_msg = "Lab parameter parsing failed - no parameters extracted"
            elif len(parameters) == 0:
                error_msg = "No lab parameters found in the document"
            raise Exception(f"Workflow failed: {error_msg}")
        
        # Extract results
        lab_metadata = result.get("lab_metadata", {})
        vector_id = result.get("vector_id")
        chunk_count = result.get("chunk_count", 0)
        
        # Write output
        output_result = {
            "success": True,
            "workflow_completed": True,
            "docId": result.get("doc_id", doc_id),
            "lab_metadata": lab_metadata,
            "parameters": parameters,
            "parameter_count": len(parameters),
            "pinecone_stored": True,
            "vector_id": vector_id,
            "chunk_count": chunk_count,
            "message": f"Lab report processed successfully. Extracted {len(parameters)} parameters."
        }
        
        with open(output_file, 'w') as f:
            json.dump(output_result, f, indent=2)
        
        print(json.dumps({"success": True}))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__
        }
        with open(output_file, 'w') as f:
            json.dump(error_result, f, indent=2)
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()

