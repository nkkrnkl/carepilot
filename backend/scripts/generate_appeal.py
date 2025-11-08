#!/usr/bin/env python3
"""
Python script to generate appeal email - called from Next.js API routes
"""

import sys
import json
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from appeal_agent import AppealEmailAgent

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
        
        # Get EOB data
        eob_data = input_data.get("eob_data")
        if not eob_data:
            raise ValueError("eob_data is required")
        
        # Get optional parameters
        discrepancy_types = input_data.get("discrepancy_types")
        additional_context = input_data.get("additional_context")
        
        # Initialize agent
        agent = AppealEmailAgent()
        
        # Generate appeal email
        appeal_email = agent.generate_appeal_email(
            eob_data=eob_data,
            discrepancy_types=discrepancy_types,
            additional_context=additional_context
        )
        
        # Write output
        result = {
            "success": True,
            "appeal_email": appeal_email
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

