#!/usr/bin/env python3
"""
Python script to process claims - called directly from Next.js API routes
"""

import sys
import json
import os
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from claims_agent import ClaimsAgent
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
        
        # Initialize agent
        store = PineconeVectorStore()
        agent = ClaimsAgent(vector_store=store)
        
        # Process claim
        result = agent.process_claim(
            user_id=input_data.get("userId"),
            doc_id=input_data.get("docId"),
            doc_type=input_data.get("docType"),
            task_description=input_data.get("taskDescription", "Process the claim")
        )
        
        # Write output
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

