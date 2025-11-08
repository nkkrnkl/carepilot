#!/usr/bin/env python3
"""
Python script to extract EOB information - called from Next.js API routes
"""

import sys
import json
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from eob_agent_cot import EOBExtractionAgentCoT
from pinecone_store import PineconeVectorStore

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
        
        # Initialize store
        store = PineconeVectorStore()
        
        # Get extraction parameters
        user_id = input_data.get("userId")
        document_id = input_data.get("documentId")
        doc_type = input_data.get("docType", "eob")
        method = input_data.get("method", "cot")  # Always use CoT for EOB
        
        if not user_id or not document_id:
            raise ValueError("Both 'userId' and 'documentId' must be provided")
        
        # Initialize agent
        agent = EOBExtractionAgentCoT(vector_store=store)
        
        # Extract EOB information
        eob_data = agent.extract_from_document(
            user_id=user_id,
            document_id=document_id,
            doc_type=doc_type
        )
        
        # Convert to case format for UI
        case_data = agent.to_case_format(eob_data)
        
        # Convert to SQL-ready format
        sql_ready = agent.to_sql_ready(eob_data)
        
        # Write output
        result = {
            "success": True,
            "eob_data": eob_data,
            "case_data": case_data,
            "sql_ready": {
                "sql": sql_ready["sql"],
                "values": list(sql_ready["values"])  # Convert tuple to list for JSON
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        
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

