#!/usr/bin/env python3
"""
Python script to upload lab reports to Pinecone - called directly from Next.js API routes
Follows the same pattern as upload_document.py for CLAIMS
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
        
        # Initialize store (same as CLAIMS)
        store = PineconeVectorStore()
        
        # Build text for embedding (matching the format specified)
        title = input_data.get("title") or "Lab Report"
        date = input_data.get("date") or "Date unknown"
        hospital = input_data.get("hospital") or "Hospital unknown"
        doctor = input_data.get("doctor") or "Doctor unknown"
        parameters = input_data.get("parameters", [])
        
        text = f"""Title: {title}
Date: {date}
Hospital: {hospital}
Doctor: {doctor}
Parameters:
"""
        
        # Add parameters
        for param in parameters:
            name = param.get("name", "")
            value = param.get("value", "")
            unit = param.get("unit") or ""
            ref_range = param.get("referenceRange") or ""
            
            if ref_range:
                text += f"{name}: {value} {unit} (Range: {ref_range})\n"
            else:
                text += f"{name}: {value} {unit}\n"
        
        # Add document to Pinecone using the SAME method as CLAIMS
        # Use "lab_report" as doc_type, chunk with sentence strategy
        result_data = store.add_user_document(
            user_id=input_data.get("userId", "demo-user"),
            doc_type="lab_report",
            doc_id=input_data.get("docId"),
            text=text,
            metadata={
                "fileName": input_data.get("fileName"),
                "fileSize": input_data.get("fileSize"),
                "title": title,
                "date": date,
                "hospital": hospital,
                "doctor": doctor,
                "type": "lab_report",  # Additional metadata field
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
        
        # Write output
        result = {
            "success": True,
            "vectorId": vector_id,
            "vectorIds": vector_ids,
            "chunkCount": chunk_count,
            "docId": input_data.get("docId"),
            "message": f"Lab report uploaded successfully ({chunk_count} chunk{'s' if chunk_count > 1 else ''})"
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

