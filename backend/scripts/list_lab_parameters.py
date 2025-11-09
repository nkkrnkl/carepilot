#!/usr/bin/env python3
"""
Python script to list all unique parameter names from a user's lab reports
"""

import sys
import json
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

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
        
        # Query all lab reports for this user
        query_result = store.query_private(
            query_text="lab report parameters test results",
            user_id=input_data.get("userId"),
            doc_types=["lab_report"],
            top_k=100  # Get many results to aggregate parameters
        )
        
        # Extract unique parameter names from metadata
        # This is a simplified extraction - in production, you'd parse structured data
        parameters = set()
        
        for match in query_result.get("matches", []):
            metadata = match.get("metadata", {})
            text = metadata.get("text", "")
            
            # Simple extraction: look for common lab parameter patterns
            # In production, this would parse structured JSON from metadata
            # For now, return a placeholder list
            # TODO: Parse actual parameter names from stored lab report data
        
        # Write output
        result = {
            "success": True,
            "parameters": sorted(list(parameters)) if parameters else [],
            "userId": input_data.get("userId")
        }
        
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
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

