#!/usr/bin/env python3
"""
Python script to extract lab report data using LabAnalysisAgent - called from Next.js API routes
"""

import sys
import json
import os
import tempfile
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import lab agent from file with space in name
import importlib.util
lab_agent_file = backend_dir / "lab_agent_2.py"
if not lab_agent_file.exists():
    print(json.dumps({"error": f"Lab agent file not found: {lab_agent_file}"}))
    sys.exit(1)

try:
    spec = importlib.util.spec_from_file_location("lab_agent_2", lab_agent_file)
    lab_agent_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(lab_agent_module)
    LabAnalysisAgent = lab_agent_module.LabAnalysisAgent
except Exception as e:
    print(json.dumps({"error": f"Failed to import LabAnalysisAgent: {str(e)}"}))
    import traceback
    traceback.print_exc()
    sys.exit(1)

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
        
        # Get extraction parameters
        user_id = input_data.get("userId")
        document_id = input_data.get("documentId")
        file_content_base64 = input_data.get("fileContent")  # Base64 encoded file content
        file_name = input_data.get("fileName", "lab_report.pdf")
        file_type = input_data.get("fileType", "pdf")
        
        if not user_id or not document_id:
            raise ValueError("userId and documentId are required")
        
        if not file_content_base64:
            raise ValueError("fileContent (base64) is required")
        
        # Decode base64 file content
        import base64
        file_bytes = base64.b64decode(file_content_base64)
        
        # Save to temporary file
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"{document_id}_{file_name}")
        
        try:
            # Write file to temp location
            with open(temp_file_path, 'wb') as f:
                f.write(file_bytes)
            
            # Initialize agent
            agent = LabAnalysisAgent()
            
            # Determine file type (pdf, png, jpg, etc.)
            file_ext = file_type.replace("application/", "").replace("image/", "").strip()
            if file_ext not in ["pdf", "png", "jpg", "jpeg"]:
                file_ext = "pdf"  # Default to pdf
            
            # Process lab report
            result = agent.process_lab(
                user_id=user_id,
                file_path=temp_file_path,
                file_type=file_ext,
                task_description=f"Process lab report {document_id} for user {user_id}"
            )
            
            # Check if workflow completed successfully
            # The process_lab method returns final_state.get("final_result", final_state)
            # So result should have: workflow_completed, steps, dashboard (if successful)
            # Or it might have: workflow_completed: False, error, state (if failed)
            
            workflow_completed = result.get("workflow_completed", False) if result else False
            error = result.get("error") if result else None
            
            if error:
                raise Exception(f"Lab agent workflow error: {error}")
            
            if not workflow_completed:
                raise Exception("Lab agent workflow did not complete successfully")
            
            # Extract structured data from result
            # Result structure when successful:
            # {
            #   "workflow_completed": True,
            #   "steps": {
            #     "step1": {...},
            #     "step2": {...},
            #     "step3": {...},
            #     "step4": {...}
            #   },
            #   "dashboard": {
            #     "summary_cards": [...],
            #     "condition_flags": [...],
            #     "table_compact": {...}
            #   }
            # }
            
            dashboard_data = result.get("dashboard", {}) if result else {}
            steps = result.get("steps", {}) if result else {}
            
            # Build lab report data structure
            # Get title from file name
            title = file_name.replace(".pdf", "").replace("_", " ").replace("-", " ").title()
            
            # Store full result and structured parameters
            lab_data = {
                "title": title,
                "date": None,  # Can be extracted from document if available
                "hospital": None,  # Can be extracted from document if available
                "doctor": None,  # Can be extracted from document if available
                "rawExtract": json.dumps(result) if result else None,
                "parameters": json.dumps({
                    "table_compact": dashboard_data.get("table_compact", {}),
                    "summary_cards": dashboard_data.get("summary_cards", []),
                    "condition_flags": dashboard_data.get("condition_flags", []),
                }) if dashboard_data else None,
            }
            
            # Write output
            output_result = {
                "success": True,
                "labData": lab_data,
                "dashboard": dashboard_data,
                "steps": steps,
                "workflowCompleted": result.get("workflow_completed", False) if result else False,
                "message": "Lab report processed successfully"
            }
            
            with open(output_file, 'w') as f:
                json.dump(output_result, f, indent=2)
            
            print(json.dumps({"success": True}))
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e:
                    print(f"Warning: Failed to delete temp file {temp_file_path}: {e}", file=sys.stderr)
        
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

