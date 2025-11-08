#!/usr/bin/env python3
"""
Python script to process lab reports - extracts structured data and stores in Pinecone
Called from Next.js API routes
"""

import sys
import json
import os
from pathlib import Path
from datetime import datetime

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from pinecone_store import PineconeVectorStore

# Try to import OpenAI for structured extraction
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: OpenAI not available. Install with: pip install openai")

def extract_structured_lab_data(text: str) -> dict:
    """
    Extract structured lab data from text using OpenAI
    Returns dict with report_meta and results
    """
    if not OPENAI_AVAILABLE:
        return {
            "report_meta": {
                "date_iso": datetime.now().strftime("%Y-%m-%d"),
                "doctor_name": None,
                "medical_center": None
            },
            "results": []
        }
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Warning: OPENAI_API_KEY not set, skipping structured extraction")
        return {
            "report_meta": {
                "date_iso": datetime.now().strftime("%Y-%m-%d"),
                "doctor_name": None,
                "medical_center": None
            },
            "results": []
        }
    
    client = OpenAI(api_key=api_key)
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    system_prompt = """You are a medical lab report structuring engine. Extract all lab test results from the provided document text. Return ONLY valid JSON per the schema.

Instructions:
- Extract ALL lab test results you find in the document
- Normalize common analyte aliases: 'HbA1c' or 'Hemoglobin A1c' → 'A1C', 'LDL-C' or 'LDL Cholesterol' → 'LDL', 'Chol, LDL' → 'LDL', 'eGFR (CKD-EPI)' or 'eGFR' → 'eGFR'
- For each result, extract: analyte name, value, unit, reference ranges (ref_low, ref_high), flags (H, L, High, Low, ↑, ↓), collection date if available
- Include a short evidence snippet (the exact text from the document showing the value)
- If a value is missing or unclear, use null
- Be thorough - extract every test result you can find"""

    user_prompt = f"""Extract all lab test results from this medical lab report. Return a JSON object with the report metadata and all test results found.

Document text:
{text[:15000]}

Return JSON with this exact structure:
{{
  "report_meta": {{
    "date_iso": "YYYY-MM-DD or null",
    "doctor_name": "string or null",
    "medical_center": "string or null"
  }},
  "results": [
    {{
      "analyte": "string (normalized name like A1C, LDL, eGFR, TSH, etc.)",
      "analyte_raw": "string or null (original name from document)",
      "value": "number or string",
      "unit": "string or null (e.g., mg/dL, %, mIU/L)",
      "ref_low": "number or null",
      "ref_high": "number or null",
      "flag": "string or null (H, L, High, Low, ↑, ↓, etc.)",
      "observed_at_iso": "YYYY-MM-DD or null (collection date if available)",
      "evidence": {{
        "snippet": "string or null (short excerpt from document showing this value)",
        "page_index": "number or null (0-based page number)"
      }},
      "confidence": "number or null (0-1, your confidence in this extraction)"
    }}
  ]
}}

Important: Extract ALL test results you find. Include every lab value, even if some fields are missing."""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error extracting structured data: {e}")
        return {
            "report_meta": {
                "date_iso": datetime.now().strftime("%Y-%m-%d"),
                "doctor_name": None,
                "medical_center": None
            },
            "results": []
        }

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
        
        user_id = input_data.get("userId")
        doc_id = input_data.get("docId")
        text = input_data.get("text", "")
        file_name = input_data.get("fileName", "")
        file_size = input_data.get("fileSize", 0)
        
        if not user_id or not doc_id:
            raise ValueError("userId and docId are required")
        
        # Initialize store
        store = PineconeVectorStore()
        
        # Step 1: Extract structured lab data using LLM
        print("Extracting structured lab data...")
        structured_data = extract_structured_lab_data(text)
        
        report_meta = structured_data.get("report_meta", {})
        lab_results = structured_data.get("results", [])
        
        # Step 2: Store full text chunks (for RAG retrieval)
        print("Storing full text chunks...")
        chunk_strategy = "fixed"  # Use fixed-size chunks for lab reports
        text_chunk_ids = store.add_user_document(
            user_id=user_id,
            doc_type="lab_report",
            doc_id=doc_id,
            text=text,
            metadata={
                "fileName": file_name,
                "fileSize": file_size,
                "date_iso": report_meta.get("date_iso"),
                "doctor": report_meta.get("doctor_name"),
                "center": report_meta.get("medical_center"),
            },
            chunk_text=True,
            chunk_size=800,
            chunk_overlap=200,
            chunk_strategy=chunk_strategy
        )
        
        # Step 3: Store individual lab results as separate vectors (for lab_agent.py)
        print(f"Storing {len(lab_results)} lab results...")
        result_vector_ids = []
        
        for result in lab_results:
            analyte = result.get("analyte", "Unknown")
            value = result.get("value")
            unit = result.get("unit")
            ref_low = result.get("ref_low")
            ref_high = result.get("ref_high")
            flag = result.get("flag")
            date_iso = result.get("observed_at_iso") or report_meta.get("date_iso")
            
            # Create text representation for embedding
            value_str = str(value) if value is not None else "N/A"
            unit_str = f" {unit}" if unit else ""
            range_str = ""
            if ref_low is not None and ref_high is not None:
                range_str = f" (range: {ref_low}-{ref_high})"
            elif ref_low is not None:
                range_str = f" (min: {ref_low})"
            elif ref_high is not None:
                range_str = f" (max: {ref_high})"
            
            flag_str = f" [{flag}]" if flag else ""
            result_text = f"{analyte}: {value_str}{unit_str}{range_str}{flag_str}"
            
            # Generate embedding
            embedding = store._get_embedding(result_text)
            
            # Generate vector ID
            vector_id = store._generate_id(
                f"{user_id}_lab_report_{doc_id}_{analyte}_{value_str}",
                "result"
            )
            
            # Prepare metadata (matching lab_agent.py expectations)
            metadata = {
                "user_id": user_id,
                "doc_type": "lab_report",
                "doc_id": doc_id,
                "analyte": analyte,
                "value_num": float(value) if isinstance(value, (int, float)) else None,
                "value_raw": str(value) if not isinstance(value, (int, float)) else None,
                "unit": unit,
                "ref_low": float(ref_low) if ref_low is not None else None,
                "ref_high": float(ref_high) if ref_high is not None else None,
                "flag": flag,
                "date_iso": date_iso,
                "text": result_text,  # Store text for retrieval
            }
            
            # Add additional metadata if available
            if result.get("evidence"):
                metadata["evidence_snippet"] = result["evidence"].get("snippet")
                metadata["evidence_page_index"] = result["evidence"].get("page_index")
            
            # Upsert to Pinecone
            store.index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata
                }],
                namespace=store.NAMESPACE_PRIVATE
            )
            
            result_vector_ids.append(vector_id)
        
        # Write output
        result = {
            "success": True,
            "docId": doc_id,
            "textChunkIds": text_chunk_ids if isinstance(text_chunk_ids, list) else [text_chunk_ids],
            "resultVectorIds": result_vector_ids,
            "reportMeta": report_meta,
            "resultsCount": len(lab_results),
            "message": f"Lab report processed successfully: {len(lab_results)} results extracted"
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

