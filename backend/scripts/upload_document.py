#!/usr/bin/env python3
"""
Python script to upload documents to Pinecone - called directly from Next.js API routes
"""

import sys
import json
import os
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
        
        # Determine chunking strategy based on document type
        doc_type = input_data.get("docType", "")
        chunk_strategy = "paragraph" if doc_type in ["clinical_note", "plan_document"] else "sentence"
        
        # Add document to Pinecone (with automatic chunking)
        result_data = store.add_user_document(
            user_id=input_data.get("userId"),
            doc_type=doc_type,
            doc_id=input_data.get("docId"),
            text=input_data.get("text", ""),
            metadata={
                "fileName": input_data.get("fileName"),
                "fileSize": input_data.get("fileSize"),
            },
            chunk_text=True,  # Enable chunking for better retrieval
            chunk_size=input_data.get("chunkSize", 1000),
            chunk_overlap=input_data.get("chunkOverlap", 200),
            chunk_strategy=chunk_strategy
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
        
        # Write output
        result = {
            "success": True,
            "vectorId": vector_id,
            "vectorIds": vector_ids,
            "chunkCount": chunk_count,
            "docId": input_data.get("docId"),
            "message": f"Document uploaded successfully ({chunk_count} chunk{'s' if chunk_count > 1 else ''})"
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

