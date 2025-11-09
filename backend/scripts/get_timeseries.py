#!/usr/bin/env python3
"""
Python script to get time series data for a specific parameter across lab reports
"""

import sys
import json
from pathlib import Path
from datetime import datetime

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
            query_text=f"{input_data.get('parameterName', '')} lab test value",
            user_id=input_data.get("userId"),
            doc_types=["lab_report"],
            top_k=100  # Get many results to build time series
        )
        
        # Extract time series data
        # This is a simplified extraction - in production, you'd parse structured data
        timeseries = []
        
        for match in query_result.get("matches", []):
            metadata = match.get("metadata", {})
            report_date = metadata.get("reportDate") or metadata.get("date")
            doc_id = metadata.get("doc_id")
            text = metadata.get("text", "")
            
            # Simple extraction: look for parameter value in text
            # In production, this would parse structured JSON from metadata
            # For now, return placeholder data
            # TODO: Parse actual parameter values from stored lab report data
            
            if report_date:
                timeseries.append({
                    "date": report_date,
                    "value": None,  # Would be extracted from structured data
                    "unit": None,   # Would be extracted from structured data
                    "docId": doc_id
                })
        
        # Sort by date
        timeseries.sort(key=lambda x: x["date"] if x["date"] else "")
        
        # Write output
        result = {
            "success": True,
            "timeseries": timeseries,
            "parameterName": input_data.get("parameterName"),
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

