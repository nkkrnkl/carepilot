"""
Benefits Extraction Agent

This agent extracts structured insurance benefits information from documents
and formats it for SQL database storage using a standardized schema.
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime

from pinecone_store import PineconeVectorStore
from api import K2APIClient
from benefits_schema import InsuranceBenefits, ServiceCoverage, Deductible, Copay, Coinsurance, CoverageLimit


# ==================== SYSTEM PROMPT ====================

BENEFITS_EXTRACTION_PROMPT = """You are an expert insurance benefits analyst. Your task is to extract structured information from insurance benefit documents and format it according to a standardized schema.

**Your Task:**
Extract all relevant insurance benefits information from the provided document and return it in the exact JSON format specified below.

**Standardized Fields to Extract:**

1. **Basic Information:**
   - plan_name (REQUIRED): Name of the insurance plan
   - plan_type: Type of plan (HMO, PPO, EPO, POS, etc.)
   - insurance_provider: Name of the insurance company
   - policy_number: Policy or member ID number
   - group_number: Group number if applicable
   - effective_date: When coverage begins (YYYY-MM-DD format)
   - expiration_date: When coverage ends (YYYY-MM-DD format)

2. **Deductibles:**
   Extract all deductibles. Each deductible should have:
   - amount: Dollar amount
   - type: "individual", "family", or "per_person"
   - applies_to: What it applies to (e.g., "medical", "dental", "vision")
   - annual: true/false (usually true)
   - network: "in_network", "out_of_network", or "both"

3. **Copays:**
   Extract all copay amounts. Each copay should have:
   - amount: Dollar amount
   - service_type: Type of service (e.g., "primary_care", "specialist", "emergency", "urgent_care", "prescription")
   - network: "in_network" or "out_of_network"

4. **Coinsurance:**
   Extract coinsurance percentages. Each should have:
   - percentage: Percentage (e.g., 20 for 20%)
   - applies_to: What it applies to (e.g., "medical", "dental")
   - network: "in_network" or "out_of_network"

5. **Coverage Limits:**
   Extract any coverage limits. Each should have:
   - limit_type: "annual", "lifetime", "per_visit", or "per_service"
   - amount: Dollar amount or other limit
   - applies_to: What it applies to
   - network: "in_network" or "out_of_network"

6. **Service Coverage:**
   For each service type, extract:
   - service_name: Name of the service (e.g., "Preventive Care", "Emergency Services", "Hospitalization", "Mental Health", "Prescription Drugs")
   - covered: true/false
   - requires_preauth: true/false
   - copay: Copay information if applicable
   - coinsurance: Coinsurance information if applicable
   - coverage_limit: Coverage limit if applicable
   - notes: Any additional notes

7. **Out of Pocket Maximums:**
   - out_of_pocket_max_individual: Maximum individual out-of-pocket
   - out_of_pocket_max_family: Maximum family out-of-pocket

8. **Network Information:**
   - in_network_providers: Description or reference to network providers
   - out_of_network_coverage: true/false
   - network_notes: Any notes about network coverage

9. **Pre-authorization:**
   - preauth_required_services: List of services that require pre-authorization
   - preauth_notes: Any notes about pre-authorization requirements

10. **Exclusions:**
    - exclusions: List of services or items not covered
    - exclusion_notes: Any notes about exclusions

11. **Additional Information:**
    - special_programs: List of special programs (e.g., "Wellness programs", "Preventive care", "Maternity care")
    - additional_benefits: Any other benefits information
    - notes: General notes

**Important Guidelines:**
- Extract ALL information available in the document
- Use consistent terminology (e.g., "in_network" vs "in-network" - use "in_network")
- Convert all dollar amounts to numbers (not strings)
- Convert percentages to numbers (e.g., 20 for 20%)
- Use dates in YYYY-MM-DD format
- If information is not available, omit the field (don't include null values)
- Be thorough - extract every piece of coverage information
- Normalize service names (e.g., "Primary Care Physician" -> "primary_care")
- Normalize network types (e.g., "In-Network" -> "in_network")

**Output Format:**
Return a valid JSON object matching the InsuranceBenefits schema. Here is the expected structure:

```json
{{
  "plan_name": "Plan Name",
  "plan_type": "PPO",
  "insurance_provider": "Insurance Company",
  "policy_number": "POL123456",
  "group_number": "GRP789",
  "effective_date": "2024-01-01",
  "expiration_date": "2024-12-31",
  "deductibles": [
    {{
      "amount": 1000,
      "type": "individual",
      "applies_to": "medical",
      "annual": true,
      "network": "in_network"
    }}
  ],
  "copays": [
    {{
      "amount": 25,
      "service_type": "primary_care",
      "network": "in_network"
    }}
  ],
  "coinsurance": [
    {{
      "percentage": 20,
      "applies_to": "medical",
      "network": "in_network"
    }}
  ],
  "coverage_limits": [],
  "services": [
    {{
      "service_name": "preventive_care",
      "covered": true,
      "requires_preauth": false,
      "copay": {{
        "amount": 0,
        "service_type": "preventive_care",
        "network": "in_network"
      }}
    }}
  ],
  "out_of_pocket_max_individual": 5000,
  "out_of_pocket_max_family": 10000,
  "in_network_providers": "See provider directory",
  "out_of_network_coverage": true,
  "preauth_required_services": ["surgery", "specialist_referrals"],
  "exclusions": ["cosmetic_surgery", "experimental_treatment"],
  "special_programs": ["wellness_programs", "preventive_care"]
}}
```

**Now extract the benefits information from the following document:**"""


# ==================== BENEFITS AGENT CLASS ====================

class BenefitsExtractionAgent:
    """Agent for extracting structured benefits information from insurance documents"""
    
    def __init__(self, vector_store: Optional[PineconeVectorStore] = None, llm_client: Optional[K2APIClient] = None):
        """
        Initialize the Benefits Extraction Agent
        
        Args:
            vector_store: PineconeVectorStore instance (optional, for retrieving documents)
            llm_client: K2APIClient instance (optional, will create if not provided)
        """
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
    
    def extract_from_text(
        self,
        text: str,
        user_id: Optional[str] = None,
        document_id: Optional[str] = None,
        focus_on_missing: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Extract benefits information from text
        
        Args:
            text: Text content of the insurance benefits document
            user_id: User ID (for metadata)
            document_id: Document ID (for metadata)
            focus_on_missing: List of missing information categories to focus on
        
        Returns:
            Dictionary containing extracted benefits information
        """
        # Prepare the prompt
        focus_instruction = ""
        if focus_on_missing:
            focus_instruction = f"\n\n**IMPORTANT: Please pay special attention to finding the following missing information: {', '.join(focus_on_missing)}. These fields are currently missing and need to be extracted from this document.**"
        
        user_message = f"{BENEFITS_EXTRACTION_PROMPT}{focus_instruction}\n\n**Document Text:**\n{text}\n\n**Extract all benefits information and return the JSON:**"
        
        messages = [
            {"role": "system", "content": "You are an expert insurance benefits analyst. Extract structured information from insurance documents and return valid JSON."},
            {"role": "user", "content": user_message}
        ]
        
        # Call LLM
        response = self.llm_client.chat(messages)
        
        if not response or "choices" not in response:
            raise Exception("Failed to get response from LLM")
        
        # Extract JSON from response
        content = response["choices"][0]["message"]["content"]
        
        # Try to parse JSON (may be wrapped in markdown code blocks)
        json_text = self._extract_json(content)
        
        try:
            benefits_data = json.loads(json_text)
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse JSON from LLM response: {str(e)}\nResponse: {content}")
        
        # Validate and normalize the data
        benefits_data = self._normalize_benefits_data(benefits_data)
        
        # Add metadata
        if user_id:
            benefits_data["user_id"] = user_id
        if document_id:
            benefits_data["source_document_id"] = document_id
        benefits_data["extracted_date"] = datetime.now().isoformat()
        
        # Create InsuranceBenefits object for validation
        try:
            benefits = InsuranceBenefits.from_dict(benefits_data)
            return benefits.to_dict()
        except Exception as e:
            # If validation fails, return raw data with warning
            print(f"Warning: Benefits data validation failed: {str(e)}")
            return benefits_data
    
    def extract_from_document(
        self,
        user_id: str,
        document_id: str,
        doc_type: str = "plan_document",
        iterative: bool = True,
        max_iterations: int = 3
    ) -> Dict[str, Any]:
        """
        Extract benefits information from a stored document with iterative refinement
        
        Args:
            user_id: User ID
            document_id: Document ID
            doc_type: Document type (default: "plan_document")
            iterative: Whether to use iterative extraction to find missing information
            max_iterations: Maximum number of refinement iterations
        
        Returns:
            Dictionary containing extracted benefits information
        """
        if iterative:
            return self._extract_iteratively(user_id, document_id, doc_type, max_iterations)
        else:
            # Original single-pass extraction
            return self._extract_single_pass(user_id, document_id, doc_type)
    
    def _extract_single_pass(
        self,
        user_id: str,
        document_id: str,
        doc_type: str
    ) -> Dict[str, Any]:
        """Original single-pass extraction method"""
        # Query the document from Pinecone
        query_result = self.vector_store.query_private(
            query_text="insurance benefits coverage plan",
            user_id=user_id,
            doc_types=[doc_type],
            top_k=100,  # Get more chunks initially
            additional_filter={"doc_id": {"$eq": document_id}}
        )
        
        if not query_result.get("matches"):
            raise Exception(f"Document {document_id} not found for user {user_id}")
        
        # Combine all chunks of the document, sorted by chunk_index
        chunk_data = []
        for match in query_result["matches"]:
            metadata = match.get("metadata", {})
            text = metadata.get("text", "")
            chunk_index = metadata.get("chunk_index", 0)
            if text:
                chunk_data.append({"index": chunk_index, "text": text})
        
        if not chunk_data:
            raise Exception(f"No text content found in document {document_id}")
        
        # Sort by chunk index and combine
        chunk_data.sort(key=lambda x: x["index"])
        full_text = "\n\n".join([chunk["text"] for chunk in chunk_data])
        
        # Extract benefits
        return self.extract_from_text(
            text=full_text,
            user_id=user_id,
            document_id=document_id
        )
    
    def _extract_iteratively(
        self,
        user_id: str,
        document_id: str,
        doc_type: str,
        max_iterations: int = 3
    ) -> Dict[str, Any]:
        """
        Iterative extraction: extract, analyze missing info, query for more chunks, refine
        
        Args:
            user_id: User ID
            document_id: Document ID
            doc_type: Document type
            max_iterations: Maximum number of refinement iterations
        
        Returns:
            Dictionary containing extracted benefits information
        """
        print(f"Starting iterative extraction for document {document_id}...")
        
        # Get ALL chunks for this document first (use a broad query with high top_k)
        print(f"  Iteration 1: Gathering all document chunks...")
        all_chunks_query = self.vector_store.query_private(
            query_text="insurance benefits coverage plan",
            user_id=user_id,
            doc_types=[doc_type],
            top_k=100,  # Get many chunks
            additional_filter={"doc_id": {"$eq": document_id}}
        )
        
        # Organize all chunks by index
        all_chunks = {}
        for match in all_chunks_query.get("matches", []):
            metadata = match.get("metadata", {})
            chunk_index = metadata.get("chunk_index", 0)
            text = metadata.get("text", "")
            if text and chunk_index not in all_chunks:
                all_chunks[chunk_index] = text
        
        if not all_chunks:
            raise Exception(f"No chunks found for document {document_id}")
        
        print(f"    Found {len(all_chunks)} chunks for document")
        
        # Initial extraction with ALL chunks (sorted by index)
        print(f"  Iteration 1: Initial extraction with all chunks...")
        sorted_chunks = sorted(all_chunks.items())
        full_text = "\n\n".join([text for _, text in sorted_chunks])
        current_benefits = self.extract_from_text(
            text=full_text,
            user_id=user_id,
            document_id=document_id
        )
        used_chunk_indices = set(all_chunks.keys())
        
        # Iterative refinement
        for iteration in range(2, max_iterations + 1):
            print(f"  Iteration {iteration}: Analyzing completeness...")
            
            # Analyze what's missing
            missing_info = self._analyze_missing_information(current_benefits)
            
            if not missing_info:
                print(f"    ✅ All key information found. Stopping iteration.")
                break
            
            print(f"    Missing: {', '.join(missing_info)}")
            
            # Query for chunks that might contain missing information
            # (Even if we have all chunks, this helps identify the most relevant ones)
            additional_chunks = self._query_missing_information(
                user_id=user_id,
                document_id=document_id,
                doc_type=doc_type,
                missing_info=missing_info,
                used_indices=used_chunk_indices
            )
            
            # Re-process ALL chunks with focused prompt on missing information
            # Even if no new chunks found, re-extraction with focus can find missed info
            print(f"    Re-processing document with focus on: {', '.join(missing_info)}")
            
            # Use all available chunks (including any new ones found)
            all_available_chunks = {**all_chunks, **additional_chunks}
            sorted_all_chunks = sorted(all_available_chunks.items())
            full_text_with_focus = "\n\n".join([text for _, text in sorted_all_chunks])
            
            # Add context about what we already found (helps LLM not duplicate work)
            existing_summary = self._get_text_from_benefits(current_benefits)
            combined_text = f"""--- PREVIOUSLY EXTRACTED INFORMATION (DO NOT DUPLICATE, ONLY ADD MISSING FIELDS) ---
{existing_summary}

--- FULL DOCUMENT TEXT (FOCUS ON FINDING: {', '.join(missing_info)}) ---
{full_text_with_focus}"""
            
            # Re-extract with focused prompt on missing information
            print(f"    Re-extracting with focused prompt...")
            refined_benefits = self.extract_from_text(
                text=combined_text,
                user_id=user_id,
                document_id=document_id,
                focus_on_missing=missing_info
            )
            
            # Merge results (prefer more complete information)
            print(f"    Merging results...")
            merged_benefits = self._merge_benefits(current_benefits, refined_benefits)
            
            # Check if we made progress (found new information)
            new_missing = self._analyze_missing_information(merged_benefits)
            if len(new_missing) >= len(missing_info):
                # No progress made, stop iterating
                print(f"    ⚠️  No new information found. Stopping iteration.")
                break
            
            current_benefits = merged_benefits
            
            # Update used chunk indices (if we found new chunks)
            if additional_chunks:
                print(f"    Found {len(additional_chunks)} additional relevant chunks")
                used_chunk_indices.update(additional_chunks.keys())
                all_chunks.update(additional_chunks)  # Add to all_chunks for next iteration
        
        print(f"✅ Iterative extraction complete.")
        return current_benefits
    
    def _analyze_missing_information(self, benefits: Dict[str, Any]) -> List[str]:
        """
        Analyze extracted benefits to identify missing key information
        
        Returns:
            List of missing information categories
        """
        missing = []
        
        # Check basic information
        if not benefits.get("plan_name"):
            missing.append("plan_name")
        if not benefits.get("insurance_provider"):
            missing.append("insurance_provider")
        if not benefits.get("policy_number"):
            missing.append("policy_number")
        
        # Check financial information
        if not benefits.get("deductibles") or len(benefits.get("deductibles", [])) == 0:
            missing.append("deductibles")
        if not benefits.get("copays") or len(benefits.get("copays", [])) == 0:
            missing.append("copays")
        if not benefits.get("out_of_pocket_max_individual"):
            missing.append("out_of_pocket_maximums")
        
        # Check coverage information
        if not benefits.get("services") or len(benefits.get("services", [])) < 3:
            missing.append("service_coverage")
        
        # Check network information
        if benefits.get("in_network_providers") is None and benefits.get("network_notes") is None:
            missing.append("network_information")
        
        # Check exclusions
        if not benefits.get("exclusions") or len(benefits.get("exclusions", [])) == 0:
            missing.append("exclusions")
        
        return missing
    
    def _query_missing_information(
        self,
        user_id: str,
        document_id: str,
        doc_type: str,
        missing_info: List[str],
        used_indices: set
    ) -> Dict[int, str]:
        """
        Query for chunks that might contain missing information
        
        Returns:
            Dictionary of chunk_index -> text for additional chunks
        """
        additional_chunks = {}
        
        # Create specific queries for each missing information type
        query_mapping = {
            "plan_name": "plan name insurance policy",
            "insurance_provider": "insurance company provider name",
            "policy_number": "policy number member ID group number",
            "deductibles": "deductible amount annual deductible",
            "copays": "copay co-pay copayment visit fee",
            "out_of_pocket_maximums": "out of pocket maximum OOP max limit",
            "service_coverage": "covered services benefits coverage medical services",
            "network_information": "network providers in-network out-of-network",
            "exclusions": "exclusions not covered excluded services limitations"
        }
        
        # Query for each missing information type
        for missing_type in missing_info:
            if missing_type not in query_mapping:
                continue
            
            query_text = query_mapping[missing_type]
            
            # Query with specific focus
            query_result = self.vector_store.query_private(
                query_text=query_text,
                user_id=user_id,
                doc_types=[doc_type],
                top_k=10,
                additional_filter={"doc_id": {"$eq": document_id}}
            )
            
            # Collect chunks we haven't used yet
            for match in query_result.get("matches", []):
                metadata = match.get("metadata", {})
                chunk_index = metadata.get("chunk_index", 0)
                text = metadata.get("text", "")
                
                if chunk_index not in used_indices and text:
                    additional_chunks[chunk_index] = text
        
        return additional_chunks
    
    def _get_text_from_benefits(self, benefits: Dict[str, Any]) -> str:
        """Reconstruct text representation from benefits for context"""
        # Create a summary text from extracted benefits
        parts = []
        
        if benefits.get("plan_name"):
            parts.append(f"Plan: {benefits['plan_name']}")
        if benefits.get("insurance_provider"):
            parts.append(f"Provider: {benefits['insurance_provider']}")
        if benefits.get("policy_number"):
            parts.append(f"Policy: {benefits['policy_number']}")
        
        if benefits.get("deductibles"):
            parts.append("Deductibles: " + str(benefits["deductibles"]))
        if benefits.get("copays"):
            parts.append("Copays: " + str(benefits["copays"]))
        if benefits.get("services"):
            parts.append("Services: " + str(benefits["services"]))
        
        return "\n".join(parts)
    
    def _merge_benefits(self, existing: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
        """
        Merge two benefits dictionaries, preferring more complete information
        
        Strategy:
        - Keep existing values if they exist and are not empty
        - Use new values if existing is missing or empty
        - Merge lists (deductibles, copays, services) and deduplicate
        """
        merged = existing.copy()
        
        # Merge basic fields (prefer non-empty values)
        for key in ["plan_name", "plan_type", "insurance_provider", "policy_number", 
                   "group_number", "effective_date", "expiration_date",
                   "out_of_pocket_max_individual", "out_of_pocket_max_family",
                   "in_network_providers", "network_notes", "preauth_notes",
                   "exclusion_notes", "additional_benefits", "notes"]:
            if key in new and (not merged.get(key) or merged[key] == ""):
                merged[key] = new.get(key)
        
        # Merge boolean fields
        if "out_of_network_coverage" in new:
            merged["out_of_network_coverage"] = new["out_of_network_coverage"]
        
        # Merge lists (deductibles, copays, coinsurance, coverage_limits, services, exclusions, special_programs)
        list_fields = ["deductibles", "copays", "coinsurance", "coverage_limits", 
                      "services", "exclusions", "preauth_required_services", "special_programs"]
        
        for field in list_fields:
            existing_list = merged.get(field, [])
            new_list = new.get(field, [])
            
            if not existing_list:
                merged[field] = new_list
            elif new_list:
                # Merge and deduplicate
                if field == "services":
                    # For services, merge by service_name
                    merged_services = {s.get("service_name"): s for s in existing_list}
                    for service in new_list:
                        service_name = service.get("service_name")
                        if service_name and service_name not in merged_services:
                            merged_services[service_name] = service
                    merged[field] = list(merged_services.values())
                elif field in ["deductibles", "copays", "coinsurance", "coverage_limits"]:
                    # For these, merge and keep unique entries
                    merged_list = existing_list.copy()
                    for item in new_list:
                        if item not in merged_list:
                            merged_list.append(item)
                    merged[field] = merged_list
                else:
                    # For simple lists (exclusions, preauth_required_services, special_programs)
                    merged_list = list(set(existing_list + new_list))
                    merged[field] = merged_list
        
        return merged
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text (may be in markdown code blocks)"""
        # Try to find JSON in code blocks
        import re
        
        # Look for JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Look for JSON object directly
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        # Return original text if no JSON found
        return text
    
    def _normalize_benefits_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize benefits data to ensure consistency"""
        # Normalize network types
        network_mapping = {
            "in-network": "in_network",
            "in network": "in_network",
            "out-of-network": "out_of_network",
            "out of network": "out_of_network",
            "both": "both"
        }
        
        # Normalize service types
        service_mapping = {
            "primary care": "primary_care",
            "primary care physician": "primary_care",
            "specialist": "specialist",
            "specialist visit": "specialist",
            "emergency": "emergency",
            "emergency room": "emergency",
            "urgent care": "urgent_care",
            "preventive care": "preventive_care",
            "preventive": "preventive_care",
            "prescription": "prescription",
            "prescription drugs": "prescription",
        }
        
        def normalize_network(value):
            if isinstance(value, str):
                value_lower = value.lower().strip()
                return network_mapping.get(value_lower, value_lower)
            return value
        
        def normalize_service(value):
            if isinstance(value, str):
                value_lower = value.lower().strip()
                return service_mapping.get(value_lower, value_lower)
            return value
        
        # Normalize deductibles
        if "deductibles" in data:
            for deductible in data["deductibles"]:
                if "network" in deductible:
                    deductible["network"] = normalize_network(deductible["network"])
        
        # Normalize copays
        if "copays" in data:
            for copay in data["copays"]:
                if "network" in copay:
                    copay["network"] = normalize_network(copay["network"])
                if "service_type" in copay:
                    copay["service_type"] = normalize_service(copay["service_type"])
        
        # Normalize coinsurance
        if "coinsurance" in data:
            for coin in data["coinsurance"]:
                if "network" in coin:
                    coin["network"] = normalize_network(coin["network"])
        
        # Normalize coverage limits
        if "coverage_limits" in data:
            for limit in data["coverage_limits"]:
                if "network" in limit:
                    limit["network"] = normalize_network(limit["network"])
        
        # Normalize services
        if "services" in data:
            for service in data["services"]:
                if "service_name" in service:
                    service["service_name"] = normalize_service(service["service_name"])
                if "copay" in service and service["copay"]:
                    if "network" in service["copay"]:
                        service["copay"]["network"] = normalize_network(service["copay"]["network"])
                    if "service_type" in service["copay"]:
                        service["copay"]["service_type"] = normalize_service(service["copay"]["service_type"])
        
        return data
    
    def to_sql_ready(self, benefits_data: Dict[str, Any], table_name: str = "insurance_benefits") -> Dict[str, Any]:
        """
        Convert benefits data to SQL-ready format
        
        Args:
            benefits_data: Benefits data dictionary
            table_name: SQL table name
        
        Returns:
            Dictionary with SQL statement and values
        """
        benefits = InsuranceBenefits.from_dict(benefits_data)
        return benefits.to_sql_insert(table_name=table_name)

