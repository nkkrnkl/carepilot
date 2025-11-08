#!/usr/bin/env python3
"""
Test script for EOB Extraction Agent

This script allows you to test the EOB agent from the command line.
"""

import sys
import json
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from eob_agent_cot import EOBExtractionAgentCoT
from pinecone_store import PineconeVectorStore


def test_extraction_from_document(user_id: str = "user-123", document_id: str = None, doc_type: str = "eob"):
    """Test EOB extraction from a stored document in Pinecone"""
    print("=" * 80)
    print(f"Testing EOB Extraction from Document")
    print(f"User ID: {user_id}, Document ID: {document_id}, Doc Type: {doc_type}")
    print("=" * 80)
    
    try:
        # Initialize agent and store
        store = PineconeVectorStore()
        agent = EOBExtractionAgentCoT(vector_store=store)
        
        if not document_id:
            print("\n❌ Document ID is required")
            print("Usage: python test_eob_agent.py user-123 <document_id>")
            return None
        
        print(f"\n1. Extracting EOB information from document: {document_id}...")
        
        # Extract EOB information
        eob_data = agent.extract_from_document(
            user_id=user_id,
            document_id=document_id,
            doc_type=doc_type
        )
        
        print("\n2. Extracted EOB Data:")
        print(json.dumps(eob_data, indent=2, default=str))
        
        # Convert to case format
        print("\n3. Converting to case format...")
        case_data = agent.to_case_format(eob_data)
        
        print("\n4. Case Data (for UI):")
        print(json.dumps(case_data, indent=2, default=str))
        
        # Convert to SQL-ready format
        print("\n5. Converting to SQL-ready format...")
        sql_ready = agent.to_sql_ready(eob_data)
        
        print("\n6. SQL INSERT Statement:")
        print(sql_ready["sql"][:500] + "..." if len(sql_ready["sql"]) > 500 else sql_ready["sql"])
        
        print("\n7. Summary:")
        print(f"   Member Name: {eob_data.get('member_name', 'N/A')}")
        print(f"   Claim Number: {eob_data.get('claim_number', 'N/A')}")
        print(f"   Provider: {eob_data.get('provider_name', 'N/A')}")
        print(f"   Total Billed: ${eob_data.get('total_billed', 0):.2f}")
        print(f"   Total Benefits Approved: ${eob_data.get('total_benefits_approved', 0):.2f}")
        print(f"   Amount You Owe: ${eob_data.get('amount_you_owe', 0):.2f}")
        print(f"   Services: {len(eob_data.get('services', []))} found")
        print(f"   Alerts: {len(eob_data.get('alerts', []))} found")
        print(f"   Discrepancies: {len(eob_data.get('discrepancies', []))} found")
        
        print("\n" + "=" * 80)
        print("✅ Test completed successfully!")
        print("=" * 80)
        
        # Save results
        output_file = f"eob_output_{document_id}.json"
        with open(output_file, 'w') as f:
            json.dump({
                "eob_data": eob_data,
                "case_data": case_data,
                "sql_ready": {
                    "sql": sql_ready["sql"],
                    "values": list(sql_ready["values"])
                }
            }, f, indent=2, default=str)
        
        print(f"\n💾 Output saved to: {output_file}")
        
        return eob_data, case_data, sql_ready
        
    except Exception as e:
        print(f"\n❌ Error during extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None, None


def test_extraction_from_all_eobs(user_id: str = "user-123", doc_type: str = "eob"):
    """Test extraction from all EOB documents in Pinecone for a user"""
    print("=" * 80)
    print(f"Testing EOB Extraction from All Documents")
    print(f"User ID: {user_id}, Doc Type: {doc_type}")
    print("=" * 80)
    
    try:
        # Initialize agent and store
        store = PineconeVectorStore()
        agent = EOBExtractionAgentCoT(vector_store=store)
        
        print(f"\n1. Querying all {doc_type} documents from Pinecone for user: {user_id}...")
        
        # Query for all EOB documents for this user
        query_result = store.query_private(
            query_text="explanation of benefits EOB",
            user_id=user_id,
            doc_types=[doc_type],
            top_k=100  # Get up to 100 documents
        )
        
        matches = query_result.get("matches", [])
        
        if not matches:
            print(f"\n❌ No documents found for user_id: {user_id}, doc_type: {doc_type}")
            print("   Make sure EOB documents have been uploaded to Pinecone first.")
            return None
        
        print(f"\n   Found {len(matches)} document chunks")
        
        # Group chunks by document ID
        documents = {}
        for match in matches:
            metadata = match.get("metadata", {})
            doc_id = metadata.get("doc_id")
            
            if not doc_id:
                continue
            
            if doc_id not in documents:
                documents[doc_id] = {
                    "doc_id": doc_id,
                    "chunks": []
                }
        
        print(f"   Found {len(documents)} unique documents")
        
        # Process each document
        all_results = []
        
        for doc_id in documents.keys():
            print(f"\n2. Processing Document: {doc_id}")
            print("-" * 80)
            
            try:
                # Extract EOB information from this document
                eob_data = agent.extract_from_document(
                    user_id=user_id,
                    document_id=doc_id,
                    doc_type=doc_type
                )
                
                # Convert to case format
                case_data = agent.to_case_format(eob_data)
                
                # Store results
                result = {
                    "document_id": doc_id,
                    "eob_data": eob_data,
                    "case_data": case_data
                }
                all_results.append(result)
                
                # Print summary for this document
                print(f"\n   ✅ Extracted EOB:")
                print(f"      Member: {eob_data.get('member_name', 'N/A')}")
                print(f"      Claim Number: {eob_data.get('claim_number', 'N/A')}")
                print(f"      Provider: {eob_data.get('provider_name', 'N/A')}")
                print(f"      Total Billed: ${eob_data.get('total_billed', 0):.2f}")
                print(f"      Amount You Owe: ${eob_data.get('amount_you_owe', 0):.2f}")
                print(f"      Services: {len(eob_data.get('services', []))} found")
                print(f"      Alerts: {len(eob_data.get('alerts', []))} found")
                
            except Exception as e:
                print(f"   ❌ Error extracting EOB from document {doc_id}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Print overall summary
        print("\n" + "=" * 80)
        print("OVERALL SUMMARY")
        print("=" * 80)
        print(f"Total documents processed: {len(all_results)}")
        
        if all_results:
            print(f"\nExtracted EOBs:")
            for i, result in enumerate(all_results, 1):
                eob = result["eob_data"]
                print(f"  {i}. Claim {eob.get('claim_number', 'Unknown')} - "
                      f"${eob.get('amount_you_owe', 0):.2f} owed - "
                      f"Doc ID: {result['document_id']}")
            
            print("\n" + "=" * 80)
            print("✅ Test completed successfully!")
            print("=" * 80)
        else:
            print("\n❌ No EOBs were successfully extracted from any documents.")
        
        # Save all results
        output_file = f"eob_output_all_{user_id}.json"
        with open(output_file, 'w') as f:
            json.dump({
                "total_documents": len(all_results),
                "results": all_results
            }, f, indent=2, default=str)
        
        print(f"\n💾 All results saved to: {output_file}")
        
        return all_results
        
    except Exception as e:
        print(f"\n❌ Error during extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main function"""
    
    # Parse command line arguments
    # Usage:
    #   python test_eob_agent.py <user_id> <document_id>
    #   python test_eob_agent.py user-123 <document_id>
    #   python test_eob_agent.py user-123 all  # Extract from all EOB documents
    
    if len(sys.argv) < 2:
        print("Usage: python test_eob_agent.py <user_id> [document_id|all]")
        print("  Example: python test_eob_agent.py user-123 doc-456")
        print("  Example: python test_eob_agent.py user-123 all")
        sys.exit(1)
    
    user_id = sys.argv[1]
    document_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    if document_id and document_id.lower() == "all":
        # Extract from all documents
        test_extraction_from_all_eobs(user_id=user_id, doc_type="eob")
    elif document_id:
        # Extract from specific document
        test_extraction_from_document(user_id=user_id, document_id=document_id, doc_type="eob")
    else:
        print("❌ Document ID is required")
        print("Usage: python test_eob_agent.py <user_id> <document_id>")
        print("  Or: python test_eob_agent.py <user_id> all")


if __name__ == "__main__":
    main()

