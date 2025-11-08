#!/usr/bin/env python3
"""
Python script to extract text from documents - called from Next.js API routes
"""

import sys
import json
import base64
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from document_processor import DocumentProcessor

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
        
        # Get file content (base64 encoded)
        file_content_b64 = input_data.get("fileContent")
        file_name = input_data.get("fileName", "document")
        file_type = input_data.get("fileType")
        
        if not file_content_b64:
            raise ValueError("fileContent is required")
        
        # Decode base64 file content
        file_content = base64.b64decode(file_content_b64)
        
        # Initialize processor
        processor = DocumentProcessor()
        
        # Extract text
        extraction_result = processor.extract_text(
            file_content=file_content,
            file_name=file_name,
            file_type=file_type
        )
        
        if not extraction_result["success"]:
            raise Exception(extraction_result.get("error", "Text extraction failed"))
        
        extracted_text = extraction_result["text"]
        
        # Write output
        result = {
            "success": True,
            "text": extracted_text,
            "method": extraction_result.get("method", "unknown"),
            "textLength": len(extracted_text)
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

