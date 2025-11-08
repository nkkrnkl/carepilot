"""
Example usage of Claims Processing Agent

This script demonstrates how to use the ClaimsAgent to process medical claims
using the 4-step workflow with RAG queries.
"""

import json
# Imports are in the same directory, no path changes needed
from pinecone_store import PineconeVectorStore
from claims_agent import ClaimsAgent


def setup_example_data(store: PineconeVectorStore):
    """Setup example data in Pinecone for testing"""
    print("Setting up example data...")
    
    # Add user's insurance plan document
    store.add_user_document(
        user_id="user-123",
        doc_type="plan_document",
        doc_id="plan-001",
        text="Patient is covered by Aetna PPO plan. Policy number: AET-123456. Effective date: 2024-01-01."
    )
    
    # Add clinical note
    store.add_user_document(
        user_id="user-123",
        doc_type="clinical_note",
        doc_id="note-abc-456",
        text="""Patient presents with sore throat and fever. 
        Assessment: Acute Pharyngitis (J02.9). 
        Plan: Prescribe antibiotics and follow up in 1 week. 
        Office visit duration: 25 minutes. 
        Established patient visit."""
    )
    
    # Add CPT codes
    store.add_cpt_code(
        code="99214",
        description="Office or other outpatient visit for the evaluation and management of an established patient, which requires a medically appropriate history and/or examination and moderate level of medical decision making"
    )
    
    store.add_cpt_code(
        code="99213",
        description="Office or other outpatient visit for the evaluation and management of an established patient, which requires a medically appropriate history and/or examination and low level of medical decision making"
    )
    
    # Add ICD-10 codes
    store.add_icd10_code(
        code="J02.9",
        description="Acute pharyngitis, unspecified"
    )
    
    store.add_icd10_code(
        code="J02.0",
        description="Streptococcal pharyngitis"
    )
    
    # Add payer policies
    store.add_payer_policy(
        payer_id="aetna",
        policy_text="Aetna covers office visits for established patients. Modifier 25 may be required for separately identifiable E&M services on the same day as a procedure."
    )
    
    store.add_payer_policy(
        payer_id="aetna",
        policy_text="Aetna requires pre-authorization for certain procedures. Office visits typically do not require pre-authorization."
    )
    
    store.add_payer_policy(
        payer_id="aetna",
        policy_text="Aetna covers treatment for acute pharyngitis when medically necessary. Standard office visit codes apply."
    )
    
    print("✓ Example data setup complete!")


def main():
    """Main example function"""
    print("=" * 60)
    print("CLAIMS PROCESSING AGENT - EXAMPLE")
    print("=" * 60)
    print()
    
    # Initialize store and agent
    print("Initializing Pinecone store and Claims Agent...")
    store = PineconeVectorStore()
    agent = ClaimsAgent(vector_store=store)
    print("✓ Initialization complete!")
    print()
    
    # Setup example data
    setup_example_data(store)
    print()
    
    # Process a claim
    print("=" * 60)
    print("PROCESSING CLAIM")
    print("=" * 60)
    print()
    print("Task: A new clinical note (doc_id: 'note-abc-456') has been uploaded")
    print("      for user_id: 'user-123'. Please process the claim.")
    print()
    
    result = agent.process_claim(
        user_id="user-123",
        doc_id="note-abc-456",
        doc_type="clinical_note",
        task_description="A new clinical note has been uploaded. Please process the claim."
    )
    
    # Display results
    print("=" * 60)
    print("WORKFLOW RESULTS")
    print("=" * 60)
    print()
    
    if result.get("workflow_completed"):
        print("✓ Workflow completed successfully!")
        print()
        
        # Step 1: Coverage
        step1 = result.get("steps", {}).get("step1", {})
        print("Step 1: Pre-Check Coverage")
        print(f"  Status: {step1.get('status', 'Unknown')}")
        print(f"  Payer ID: {step1.get('payer_id', 'Unknown')}")
        print(f"  Policy Context: {step1.get('retrieved_policy_context', 'N/A')[:100]}...")
        print()
        
        # Step 2: Codes
        step2 = result.get("steps", {}).get("step2", {})
        print("Step 2: Assemble Codes")
        print(f"  Status: {step2.get('status', 'Unknown')}")
        print(f"  Suggested CPT Codes:")
        for cpt in step2.get("suggested_cpt", []):
            print(f"    - {cpt.get('code')}: {cpt.get('justification', '')[:50]}...")
        print(f"  Suggested ICD-10 Codes:")
        for icd10 in step2.get("suggested_icd10", []):
            print(f"    - {icd10.get('code')}: {icd10.get('justification', '')[:50]}...")
        print()
        
        # Step 3: Claim
        step3 = result.get("steps", {}).get("step3", {})
        print("Step 3: Generate Clean Claim")
        print(f"  Status: {step3.get('status', 'Unknown')}")
        claim_json = step3.get("claim_json", {})
        print(f"  Payer ID: {claim_json.get('payer_id', 'Unknown')}")
        print(f"  CPT Codes: {claim_json.get('cpt_codes', [])}")
        print(f"  ICD-10 Codes: {claim_json.get('icd10_codes', [])}")
        print(f"  Validation Notes: {claim_json.get('validation_notes', 'N/A')}")
        print()
        
        # Step 4: Status
        step4 = result.get("steps", {}).get("step4", {})
        print("Step 4: Monitor Status")
        print(f"  Status: {step4.get('status', 'Unknown')}")
        print(f"  Monitoring Note: {step4.get('monitoring_note', 'N/A')}")
        print()
        
        # Full JSON output
        print("=" * 60)
        print("FULL JSON OUTPUT")
        print("=" * 60)
        print(json.dumps(result, indent=2))
        
    else:
        print("❌ Workflow failed!")
        print(f"Error: {result.get('error', 'Unknown error')}")
        print()
        print("Full result:")
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

