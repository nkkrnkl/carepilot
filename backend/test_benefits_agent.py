#!/usr/bin/env python3
"""
Test script for Benefits Extraction Agent

This script allows you to test the benefits agent from the command line
with sample insurance benefits documents.
"""

import sys
import json
from pathlib import Path
from typing import Optional

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from benefits_agent import BenefitsExtractionAgent
from benefits_agent_cot import BenefitsExtractionAgentCoT
from pinecone_store import PineconeVectorStore


# Sample insurance benefits text for testing
SAMPLE_BENEFITS_TEXT = """
ABC Insurance Company
Premium PPO Plan
Policy Number: POL123456789
Group Number: GRP987654
Effective Date: January 1, 2024
Expiration Date: December 31, 2024

PLAN DETAILS:
- Plan Type: PPO (Preferred Provider Organization)
- Insurance Provider: ABC Insurance Company
- Coverage Level: Individual and Family

DEDUCTIBLES:
- Individual In-Network Deductible: $1,000 per year
- Family In-Network Deductible: $2,000 per year
- Individual Out-of-Network Deductible: $2,000 per year
- Family Out-of-Network Deductible: $4,000 per year

COPAYS:
- Primary Care Physician (In-Network): $25 per visit
- Specialist (In-Network): $50 per visit
- Urgent Care (In-Network): $75 per visit
- Emergency Room (In-Network): $200 per visit
- Out-of-Network Primary Care: $50 per visit
- Out-of-Network Specialist: $100 per visit

COINSURANCE:
- In-Network: 20% coinsurance after deductible
- Out-of-Network: 40% coinsurance after deductible

OUT-OF-POCKET MAXIMUMS:
- Individual In-Network: $5,000 per year
- Family In-Network: $10,000 per year
- Individual Out-of-Network: $10,000 per year
- Family Out-of-Network: $20,000 per year

COVERED SERVICES:
1. Preventive Care (In-Network): Covered at 100% with $0 copay
   - Annual physicals
   - Routine screenings
   - Immunizations

2. Primary Care Visits: Covered with $25 copay (In-Network)

3. Specialist Visits: Covered with $50 copay (In-Network)
   - Requires referral for some specialists

4. Emergency Services: Covered with $200 copay (In-Network)
   - Emergency room visits
   - Emergency transportation

5. Hospitalization: Covered with 20% coinsurance (In-Network)
   - Inpatient services
   - Surgery

6. Mental Health Services: Covered with $50 copay (In-Network)
   - Therapy sessions
   - Counseling

7. Prescription Drugs: Covered with copay based on tier
   - Tier 1 (Generic): $10
   - Tier 2 (Preferred Brand): $30
   - Tier 3 (Non-Preferred Brand): $50

PRE-AUTHORIZATION REQUIRED:
- Non-emergency surgery
- Specialist referrals (for some specialists)
- Advanced imaging (MRI, CT scans)
- Inpatient hospital stays (non-emergency)

EXCLUSIONS:
- Cosmetic surgery
- Experimental treatments
- Weight loss surgery (unless medically necessary)
- Dental services (separate plan required)
- Vision services (separate plan required)

SPECIAL PROGRAMS:
- Wellness programs with rewards
- Preventive care at no cost
- 24/7 nurse hotline
- Telemedicine services available

NETWORK INFORMATION:
- In-Network Providers: See provider directory at www.abcinsurance.com
- Out-of-Network Coverage: Available but higher costs
- Network covers all 50 states
"""


def test_extraction_from_text():
    """Test extraction from sample text"""
    print("=" * 80)
    print("Testing Benefits Extraction from Text")
    print("=" * 80)
    
    try:
        # Initialize agent
        store = PineconeVectorStore()
        agent = BenefitsExtractionAgent(vector_store=store)
        
        print("\n1. Extracting benefits from sample text...")
        benefits_data = agent.extract_from_text(
            text=SAMPLE_BENEFITS_TEXT,
            user_id="test-user-123",
            document_id="test-doc-456"
        )
        
        print("\n2. Extracted Benefits Data:")
        print(json.dumps(benefits_data, indent=2))
        
        print("\n3. Converting to SQL-ready format...")
        sql_ready = agent.to_sql_ready(benefits_data)
        
        print("\n4. SQL INSERT Statement:")
        print(sql_ready["sql"])
        
        print("\n5. SQL Values:")
        print(json.dumps(sql_ready["values"], indent=2))
        
        print("\n6. Summary:")
        print(f"   Plan Name: {benefits_data.get('plan_name', 'N/A')}")
        print(f"   Plan Type: {benefits_data.get('plan_type', 'N/A')}")
        print(f"   Insurance Provider: {benefits_data.get('insurance_provider', 'N/A')}")
        print(f"   Policy Number: {benefits_data.get('policy_number', 'N/A')}")
        print(f"   Deductibles: {len(benefits_data.get('deductibles', []))} found")
        print(f"   Copays: {len(benefits_data.get('copays', []))} found")
        print(f"   Services: {len(benefits_data.get('services', []))} found")
        print(f"   Exclusions: {len(benefits_data.get('exclusions', []))} found")
        
        print("\n" + "=" * 80)
        print("✅ Test completed successfully!")
        print("=" * 80)
        
        return benefits_data, sql_ready
        
    except Exception as e:
        print(f"\n❌ Error during extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None


def test_extraction_from_file(file_path: str):
    """Test extraction from a file"""
    print("=" * 80)
    print(f"Testing Benefits Extraction from File: {file_path}")
    print("=" * 80)
    
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Initialize agent
        store = PineconeVectorStore()
        agent = BenefitsExtractionAgent(vector_store=store)
        
        print("\n1. Extracting benefits from file...")
        benefits_data = agent.extract_from_text(
            text=text,
            user_id="test-user-123",
            document_id=f"file-{Path(file_path).stem}"
        )
        
        print("\n2. Extracted Benefits Data:")
        print(json.dumps(benefits_data, indent=2))
        
        print("\n3. Converting to SQL-ready format...")
        sql_ready = agent.to_sql_ready(benefits_data)
        
        print("\n4. SQL INSERT Statement:")
        print(sql_ready["sql"][:500] + "..." if len(sql_ready["sql"]) > 500 else sql_ready["sql"])
        
        print("\n5. Summary:")
        print(f"   Plan Name: {benefits_data.get('plan_name', 'N/A')}")
        print(f"   Plan Type: {benefits_data.get('plan_type', 'N/A')}")
        print(f"   Insurance Provider: {benefits_data.get('insurance_provider', 'N/A')}")
        print(f"   Deductibles: {len(benefits_data.get('deductibles', []))} found")
        print(f"   Copays: {len(benefits_data.get('copays', []))} found")
        print(f"   Services: {len(benefits_data.get('services', []))} found")
        
        print("\n" + "=" * 80)
        print("✅ Test completed successfully!")
        print("=" * 80)
        
        return benefits_data, sql_ready
        
    except Exception as e:
        print(f"\n❌ Error during extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None


def test_extraction_from_all_documents(user_id: str = "user-123", doc_type: str = "plan_document", use_cot: bool = True, document_id: Optional[str] = None):
    """Test extraction from all stored documents in Pinecone for a user, or from a specific document"""
    print("=" * 80)
    if document_id:
        print(f"Testing Benefits Extraction from Specific Document")
        print(f"Document ID: {document_id}")
    else:
        print(f"Testing Benefits Extraction from All Documents")
        print(f"User ID: {user_id}, Doc Type: {doc_type}")
    print(f"Method: {'Chain of Thought (CoT)' if use_cot else 'Iterative'}")
    print("=" * 80)
    
    try:
        # Initialize agent and store
        store = PineconeVectorStore()
        if use_cot:
            agent = BenefitsExtractionAgentCoT(vector_store=store)
        else:
            agent = BenefitsExtractionAgent(vector_store=store)
        
        # If specific document_id is provided, extract from that document only
        if document_id:
            print(f"\n1. Extracting benefits from specific document: {document_id}...")
            
            try:
                # Extract benefits from this specific document
                if use_cot:
                    # Use Chain of Thought step-by-step extraction
                    benefits_data = agent.extract_from_document(
                        user_id=user_id,
                        document_id=document_id,
                        doc_type=doc_type
                    )
                else:
                    # Use iterative extraction
                    benefits_data = agent.extract_from_document(
                        user_id=user_id,
                        document_id=document_id,
                        doc_type=doc_type,
                        iterative=True,
                        max_iterations=3
                    )
                
                # Convert to SQL-ready format
                sql_ready = agent.to_sql_ready(benefits_data)
                
                # Store results
                result = {
                    "document_id": document_id,
                    "benefits": benefits_data,
                    "sql": sql_ready["sql"],
                    "sql_values": sql_ready["values"]
                }
                
                # Print summary for this document
                print(f"\n   ✅ Extracted Benefits:")
                print(f"      Plan Name: {benefits_data.get('plan_name', 'N/A')}")
                print(f"      Plan Type: {benefits_data.get('plan_type', 'N/A')}")
                print(f"      Insurance Provider: {benefits_data.get('insurance_provider', 'N/A')}")
                print(f"      Policy Number: {benefits_data.get('policy_number', 'N/A')}")
                print(f"      Deductibles: {len(benefits_data.get('deductibles', []))} found")
                print(f"      Copays: {len(benefits_data.get('copays', []))} found")
                print(f"      Services: {len(benefits_data.get('services', []))} found")
                print(f"      Exclusions: {len(benefits_data.get('exclusions', []))} found")
                
                print("\n" + "=" * 80)
                print("✅ Test completed successfully!")
                print("=" * 80)
                
                return [result]
                
            except Exception as e:
                print(f"   ❌ Error extracting benefits from document {document_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                return None
        
        # Otherwise, query for all documents
        print(f"\n1. Querying all {doc_type} documents from Pinecone for user: {user_id}...")
        
        # Query for all plan_document documents for this user
        # Use a broad query to get all documents, then filter by metadata
        query_result = store.query_private(
            query_text="insurance benefits plan coverage",
            user_id=user_id,
            doc_types=[doc_type],
            top_k=100  # Get up to 100 documents
        )
        
        matches = query_result.get("matches", [])
        
        if not matches:
            print(f"\n❌ No documents found for user_id: {user_id}, doc_type: {doc_type}")
            print("   Make sure documents have been uploaded to Pinecone first.")
            return None, None
        
        print(f"\n   Found {len(matches)} document chunks")
        
        # Group chunks by document ID and sort by chunk_index
        documents = {}
        for match in matches:
            metadata = match.get("metadata", {})
            doc_id = metadata.get("doc_id")
            
            if not doc_id:
                continue  # Skip if no doc_id
            
            if doc_id not in documents:
                documents[doc_id] = {
                    "doc_id": doc_id,
                    "chunks": [],
                    "chunk_data": [],  # Store chunks with index for sorting
                    "metadata": metadata
                }
            
            # Collect text from chunks with index
            chunk_text = metadata.get("text", "")
            chunk_index = metadata.get("chunk_index", 0)  # Default to 0 if not present
            
            if chunk_text:
                documents[doc_id]["chunk_data"].append({
                    "index": chunk_index,
                    "text": chunk_text,
                    "metadata": metadata
                })
        
        # Sort chunks by index and extract text
        for doc_id, doc_data in documents.items():
            doc_data["chunk_data"].sort(key=lambda x: x["index"])
            doc_data["chunks"] = [chunk["text"] for chunk in doc_data["chunk_data"]]
        
        print(f"   Found {len(documents)} unique documents")
        
        # Process each document
        all_results = []
        
        for doc_id, doc_data in documents.items():
            print(f"\n2. Processing Document: {doc_id}")
            print("-" * 80)
            
            # Combine all chunks for this document
            full_text = "\n\n".join(doc_data["chunks"])
            
            if not full_text.strip():
                print(f"   ⚠️  No text content found in document {doc_id}, skipping...")
                continue
            
            print(f"   Text length: {len(full_text)} characters")
            print(f"   Number of chunks: {len(doc_data['chunks'])}")
            
            try:
                # Extract benefits from this document
                if use_cot:
                    # Use Chain of Thought step-by-step extraction
                    benefits_data = agent.extract_from_document(
                        user_id=user_id,
                        document_id=doc_id,
                        doc_type=doc_type
                    )
                else:
                    # Use iterative extraction
                    benefits_data = agent.extract_from_document(
                        user_id=user_id,
                        document_id=doc_id,
                        doc_type=doc_type,
                        iterative=True,
                        max_iterations=3
                    )
                
                # Convert to SQL-ready format
                sql_ready = agent.to_sql_ready(benefits_data)
                
                # Store results
                result = {
                    "document_id": doc_id,
                    "benefits": benefits_data,
                    "sql": sql_ready["sql"],
                    "sql_values": sql_ready["values"]
                }
                all_results.append(result)
                
                # Print summary for this document
                print(f"\n   ✅ Extracted Benefits:")
                print(f"      Plan Name: {benefits_data.get('plan_name', 'N/A')}")
                print(f"      Plan Type: {benefits_data.get('plan_type', 'N/A')}")
                print(f"      Insurance Provider: {benefits_data.get('insurance_provider', 'N/A')}")
                print(f"      Policy Number: {benefits_data.get('policy_number', 'N/A')}")
                print(f"      Deductibles: {len(benefits_data.get('deductibles', []))} found")
                print(f"      Copays: {len(benefits_data.get('copays', []))} found")
                print(f"      Services: {len(benefits_data.get('services', []))} found")
                print(f"      Exclusions: {len(benefits_data.get('exclusions', []))} found")
                
            except Exception as e:
                print(f"   ❌ Error extracting benefits from document {doc_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Print overall summary
        print("\n" + "=" * 80)
        print("OVERALL SUMMARY")
        print("=" * 80)
        print(f"Total documents processed: {len(all_results)}")
        
        if all_results:
            print(f"\nExtracted Plans:")
            for i, result in enumerate(all_results, 1):
                benefits = result["benefits"]
                print(f"  {i}. {benefits.get('plan_name', 'Unknown Plan')} "
                      f"({benefits.get('insurance_provider', 'Unknown Provider')}) - "
                      f"Doc ID: {result['document_id']}")
            
            print("\n" + "=" * 80)
            print("✅ Test completed successfully!")
            print("=" * 80)
        else:
            print("\n❌ No benefits were successfully extracted from any documents.")
        
        return all_results
        
    except Exception as e:
        print(f"\n❌ Error during extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def save_output(benefits_data: dict, sql_ready: dict, output_file: str = "benefits_output.json"):
    """Save output to a file"""
    output = {
        "benefits": benefits_data,
        "sql": sql_ready["sql"],
        "sql_values": sql_ready["values"]
    }
    
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 Output saved to: {output_file}")


def save_all_results(all_results: list, output_file: str = "benefits_output_all.json"):
    """Save all extraction results to a file"""
    output = {
        "total_documents": len(all_results),
        "results": all_results
    }
    
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n💾 All results saved to: {output_file}")


def main():
    """Main function"""
    
    # Parse command line arguments
    # Usage:
    #   python test_benefits_agent.py [user_id] [doc_type] [method] [document_id]
    #   python test_benefits_agent.py user-123 plan_document cot 1762615226647-0.5416249649679099
    #   python test_benefits_agent.py user-123 plan_document iterative
    #   python test_benefits_agent.py user-123 plan_document cot
    
    # Default values
    user_id = sys.argv[1] if len(sys.argv) > 1 else "user-123"
    doc_type = sys.argv[2] if len(sys.argv) > 2 else "plan_document"
    
    # Check for method (cot/iterative) and document_id
    use_cot = True  # Default to CoT
    document_id = None
    
    if len(sys.argv) > 3:
        arg3 = sys.argv[3].lower()
        # Check if it's a method or document_id (document_id usually has numbers/dashes)
        if arg3 in ["cot", "iterative"]:
            use_cot = arg3 != "iterative"
            # Check for document_id as 4th argument
            if len(sys.argv) > 4:
                document_id = sys.argv[4]
        else:
            # Assume it's a document_id
            document_id = sys.argv[3]
    
    # If document_id is provided, extract from that specific document
    all_results = test_extraction_from_all_documents(
        user_id=user_id, 
        doc_type=doc_type, 
        use_cot=use_cot,
        document_id=document_id
    )
    
    if all_results:
        if document_id:
            # Save with document_id in filename
            output_file = f"benefits_output_{document_id}.json"
        else:
            # Save with user_id in filename
            output_file = f"benefits_output_all_{user_id}.json"
        save_all_results(all_results, output_file)
    


if __name__ == "__main__":
    main()

