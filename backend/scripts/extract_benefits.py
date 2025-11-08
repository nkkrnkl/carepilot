#!/usr/bin/env python3
"""
Python script to extract benefits from insurance documents - called from Next.js API routes
"""

import sys
import json
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from benefits_agent import BenefitsExtractionAgent
from benefits_agent_cot import BenefitsExtractionAgentCoT
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
        doc_type = input_data.get("docType", "plan_document")
        text = input_data.get("text")  # Optional: direct text input
        use_cot = input_data.get("useCot", True)  # Default to CoT method
        method = input_data.get("method", "cot" if use_cot else "iterative")
        
        # Choose agent based on method
        if method.lower() == "cot" or use_cot:
            agent = BenefitsExtractionAgentCoT(vector_store=store)
        else:
            agent = BenefitsExtractionAgent(vector_store=store)
        
        # Extract benefits
        if text:
            # Extract from provided text (only iterative agent supports this directly)
            if method.lower() == "cot":
                # For CoT, we need to store text first or use iterative agent
                # For now, use iterative agent for text input
                agent = BenefitsExtractionAgent(vector_store=store)
                benefits_data = agent.extract_from_text(
                    text=text,
                    user_id=user_id,
                    document_id=document_id
                )
            else:
                benefits_data = agent.extract_from_text(
                    text=text,
                    user_id=user_id,
                    document_id=document_id
                )
        elif user_id and document_id:
            # Extract from stored document
            if method.lower() == "cot":
                # Use CoT method
                benefits_data = agent.extract_from_document(
                    user_id=user_id,
                    document_id=document_id,
                    doc_type=doc_type
                )
            else:
                # Use iterative method
                benefits_data = agent.extract_from_document(
                    user_id=user_id,
                    document_id=document_id,
                    doc_type=doc_type,
                    iterative=True,
                    max_iterations=3
                )
        else:
            raise ValueError("Either 'text' or both 'userId' and 'documentId' must be provided")
        
        # Convert to SQL-ready format
        sql_ready = agent.to_sql_ready(benefits_data)
        
        # Write output
        result = {
            "success": True,
            "benefits": benefits_data,
            "sql": sql_ready["sql"],
            "sql_values": sql_ready["values"],
            "message": "Benefits extracted successfully"
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

