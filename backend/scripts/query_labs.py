#!/usr/bin/env python3
"""
Python script to query lab reports from Pinecone - called from Next.js API routes
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
        
        # Query private namespace - EXACT same pattern as claims
        query_result = store.query_private(
            query_text=input_data.get("query", ""),
            user_id=input_data.get("userId"),
            doc_types=[input_data.get("docType", "lab_report")],
            top_k=input_data.get("topK", 5)
        )
        
        # Write output
        result = {
            "success": True,
            "matches": query_result.get("matches", []),
            "query": input_data.get("query", ""),
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

