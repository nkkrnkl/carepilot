"""
Benefits Extraction Agent with Chain of Thought (CoT) Prompting

This agent breaks down benefits extraction into step-by-step tasks,
each focusing on a specific category of information.
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime

from pinecone_store import PineconeVectorStore
from api import K2APIClient
from benefits_schema import InsuranceBenefits


# ==================== STEP-BY-STEP PROMPTS ====================

STEP_PROMPTS = {
    "step1_basic_info": """**Step 1: Extract Basic Information**

Extract the following basic information from the document:
- plan_name (REQUIRED): Name of the insurance plan
- plan_type: Type of plan (HMO, PPO, EPO, POS, etc.)
- insurance_provider: Name of the insurance company
- policy_number: Policy or member ID number
- group_number: Group number if applicable
- effective_date: When coverage begins (YYYY-MM-DD format)
- expiration_date: When coverage ends (YYYY-MM-DD format)

**Your Task:**
Read through the document text and extract ONLY the basic information listed above.

**Output Format:**
Return a JSON object with only these fields:
```json
{{
  "plan_name": "Plan Name",
  "plan_type": "PPO",
  "insurance_provider": "Insurance Company",
  "policy_number": "POL123456",
  "group_number": "GRP789",
  "effective_date": "2024-01-01",
  "expiration_date": "2024-12-31"
}}
```

If a field is not found, omit it (don't include null values).""",

    "step2_deductibles": """**Step 2: Extract Deductibles**

Extract all deductible information from the document. Look for:
- Individual deductibles (in-network and out-of-network)
- Family deductibles (in-network and out-of-network)
- Deductibles that apply to specific services (medical, dental, vision, etc.)
- Annual vs. other period deductibles

**For each deductible, extract:**
- amount: Dollar amount (as a number, not string)
- type: "individual", "family", or "per_person"
- applies_to: What it applies to (e.g., "medical", "dental", "vision")
- annual: true/false (usually true)
- network: "in_network", "out_of_network", or "both"

**Output Format:**
Return a JSON object with a "deductibles" array:
```json
{{
  "deductibles": [
    {{
      "amount": 1000,
      "type": "individual",
      "applies_to": "medical",
      "annual": true,
      "network": "in_network"
    }}
  ]
}}
```

If no deductibles are found, return an empty array: `{{"deductibles": []}}`""",

    "step3_copays": """**Step 3: Extract Copays**

Extract all copay amounts from the document. Look for:
- Primary care physician copays
- Specialist copays
- Emergency room copays
- Urgent care copays
- Prescription drug copays (by tier if applicable)
- In-network vs. out-of-network copays

**For each copay, extract:**
- amount: Dollar amount (as a number)
- service_type: Type of service (e.g., "primary_care", "specialist", "emergency", "urgent_care", "prescription")
- network: "in_network" or "out_of_network"

**Output Format:**
Return a JSON object with a "copays" array:
```json
{{
  "copays": [
    {{
      "amount": 25,
      "service_type": "primary_care",
      "network": "in_network"
    }}
  ]
}}
```

If no copays are found, return an empty array: `{{"copays": []}}`""",

    "step4_coinsurance": """**Step 4: Extract Coinsurance**

Extract coinsurance percentages from the document. Look for:
- In-network coinsurance (e.g., "20% coinsurance")
- Out-of-network coinsurance
- Coinsurance that applies to specific services

**For each coinsurance, extract:**
- percentage: Percentage as a number (e.g., 20 for 20%)
- applies_to: What it applies to (e.g., "medical", "dental")
- network: "in_network" or "out_of_network"

**Output Format:**
Return a JSON object with a "coinsurance" array:
```json
{{
  "coinsurance": [
    {{
      "percentage": 20,
      "applies_to": "medical",
      "network": "in_network"
    }}
  ]
}}
```

If no coinsurance is found, return an empty array: `{{"coinsurance": []}}`""",

    "step5_out_of_pocket": """**Step 5: Extract Out-of-Pocket Maximums**

Extract out-of-pocket maximum information from the document. Look for:
- Individual out-of-pocket maximum (in-network and out-of-network)
- Family out-of-pocket maximum (in-network and out-of-network)

**Extract:**
- out_of_pocket_max_individual: Maximum individual out-of-pocket (as a number)
- out_of_pocket_max_family: Maximum family out-of-pocket (as a number)

**Output Format:**
Return a JSON object:
```json
{{
  "out_of_pocket_max_individual": 5000,
  "out_of_pocket_max_family": 10000
}}
```

If a value is not found, omit the field.""",

    "step6_service_coverage": """**Step 6: Extract Service Coverage**

Extract information about what services are covered. Look for:
- Preventive care coverage
- Emergency services
- Hospitalization
- Mental health services
- Prescription drugs
- Specialist visits
- Other medical services

**For each service, extract:**
- service_name: Name of the service (e.g., "preventive_care", "emergency", "hospitalization", "mental_health", "prescription")
- covered: true/false
- requires_preauth: true/false (whether pre-authorization is required)
- copay: Copay information if applicable (same format as step 3)
- coinsurance: Coinsurance information if applicable (same format as step 4)
- coverage_limit: Coverage limit if applicable
- notes: Any additional notes about the service

**Output Format:**
Return a JSON object with a "services" array:
```json
{{
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
  ]
}}
```

If no services are found, return an empty array: `{{"services": []}}`""",

    "step7_network": """**Step 7: Extract Network Information**

Extract network-related information from the document. Look for:
- In-network provider information
- Out-of-network coverage availability
- Network notes or restrictions

**Extract:**
- in_network_providers: Description or reference to network providers
- out_of_network_coverage: true/false (whether out-of-network is covered)
- network_notes: Any notes about network coverage

**Output Format:**
Return a JSON object:
```json
{{
  "in_network_providers": "See provider directory at www.example.com",
  "out_of_network_coverage": true,
  "network_notes": "Out-of-network coverage available but higher costs"
}}
```

If a field is not found, omit it.""",

    "step8_preauth": """**Step 8: Extract Pre-Authorization Requirements**

Extract pre-authorization requirements from the document. Look for:
- Services that require pre-authorization
- Pre-authorization process notes

**Extract:**
- preauth_required_services: List of services that require pre-authorization (e.g., ["surgery", "specialist_referrals", "advanced_imaging"])
- preauth_notes: Any notes about pre-authorization requirements

**Output Format:**
Return a JSON object:
```json
{{
  "preauth_required_services": ["surgery", "specialist_referrals"],
  "preauth_notes": "Pre-authorization required for non-emergency procedures"
}}
```

If no pre-authorization requirements are found, return empty values:
```json
{{
  "preauth_required_services": [],
  "preauth_notes": null
}}
```""",

    "step9_exclusions": """**Step 9: Extract Exclusions**

Extract information about what is NOT covered (exclusions) from the document. Look for:
- Services or treatments that are excluded
- Limitations or restrictions

**Extract:**
- exclusions: List of services or items not covered (e.g., ["cosmetic_surgery", "experimental_treatment"])
- exclusion_notes: Any notes about exclusions

**Output Format:**
Return a JSON object:
```json
{{
  "exclusions": ["cosmetic_surgery", "experimental_treatment"],
  "exclusion_notes": "Cosmetic and experimental procedures are not covered"
}}
```

If no exclusions are found, return empty values:
```json
{{
  "exclusions": [],
  "exclusion_notes": null
}}
```""",

    "step10_additional": """**Step 10: Extract Additional Information**

Extract any additional benefits information from the document. Look for:
- Special programs (wellness programs, preventive care programs, etc.)
- Additional benefits not covered in previous steps
- General notes about the plan

**Extract:**
- special_programs: List of special programs (e.g., ["wellness_programs", "preventive_care", "maternity_care"])
- additional_benefits: Any other benefits information
- notes: General notes about the plan

**Output Format:**
Return a JSON object:
```json
{{
  "special_programs": ["wellness_programs", "preventive_care"],
  "additional_benefits": "24/7 nurse hotline available",
  "notes": "Plan includes telemedicine services"
}}
```

If a field is not found, omit it."""
}


# ==================== QUERY MAPPINGS FOR EACH STEP ====================

STEP_QUERIES = {
    "step1_basic_info": [
        "plan name insurance policy",
        "insurance provider company name",
        "policy number member ID",
        "group number",
        "effective date coverage begins",
        "expiration date coverage ends"
    ],
    "step2_deductibles": [
        "deductible amount",
        "annual deductible",
        "individual deductible",
        "family deductible",
        "in-network deductible",
        "out-of-network deductible"
    ],
    "step3_copays": [
        "copay co-pay copayment",
        "primary care copay",
        "specialist copay",
        "emergency room copay",
        "urgent care copay",
        "prescription copay"
    ],
    "step4_coinsurance": [
        "coinsurance percentage",
        "coinsurance after deductible",
        "in-network coinsurance",
        "out-of-network coinsurance"
    ],
    "step5_out_of_pocket": [
        "out of pocket maximum",
        "OOP maximum",
        "individual out of pocket",
        "family out of pocket",
        "maximum out of pocket"
    ],
    "step6_service_coverage": [
        "covered services",
        "preventive care coverage",
        "emergency services",
        "hospitalization coverage",
        "mental health services",
        "prescription drug coverage"
    ],
    "step7_network": [
        "network providers",
        "in-network providers",
        "out-of-network coverage",
        "provider directory",
        "network information"
    ],
    "step8_preauth": [
        "pre-authorization required",
        "preauthorization",
        "prior authorization",
        "authorization required",
        "pre-auth"
    ],
    "step9_exclusions": [
        "exclusions not covered",
        "excluded services",
        "limitations",
        "not covered",
        "exclusions"
    ],
    "step10_additional": [
        "special programs",
        "wellness programs",
        "additional benefits",
        "plan benefits",
        "programs included"
    ]
}


# ==================== BENEFITS AGENT WITH CoT ====================

class BenefitsExtractionAgentCoT:
    """Benefits Extraction Agent using Chain of Thought (CoT) step-by-step extraction"""
    
    def __init__(self, vector_store: Optional[PineconeVectorStore] = None, llm_client: Optional[K2APIClient] = None):
        """
        Initialize the Benefits Extraction Agent with CoT
        
        Args:
            vector_store: PineconeVectorStore instance (optional)
            llm_client: K2APIClient instance (optional)
        """
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
    
    def extract_from_document(
        self,
        user_id: str,
        document_id: str,
        doc_type: str = "plan_document",
        steps: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Extract benefits using Chain of Thought step-by-step approach
        
        Args:
            user_id: User ID
            document_id: Document ID
            doc_type: Document type
            steps: List of steps to execute (if None, executes all steps)
        
        Returns:
            Dictionary containing extracted benefits information
        """
        if steps is None:
            steps = list(STEP_PROMPTS.keys())
        
        print(f"Starting Chain of Thought extraction for document {document_id}...")
        print(f"Total steps: {len(steps)}")
        
        # Store results from each step
        all_results = {}
        
        # Get all chunks once (cache for all steps)
        # This ensures we have complete document coverage and reduces redundant queries
        print(f"\nGathering all document chunks (cached for all steps)...")
        all_document_chunks_dict = self._get_all_document_chunks_dict(
            user_id=user_id,
            document_id=document_id,
            doc_type=doc_type
        )
        all_document_chunks_list = sorted(all_document_chunks_dict.items())
        all_document_chunks_text = [text for _, text in all_document_chunks_list]
        print(f"  Total chunks available: {len(all_document_chunks_text)}")
        
        # Execute each step
        for step_idx, step_name in enumerate(steps, 1):
            print(f"\n{'='*80}")
            print(f"Step {step_idx}/{len(steps)}: {step_name}")
            print(f"{'='*80}")
            
            try:
                # Get relevant chunks for this step
                # Strategy: Use targeted queries to identify most relevant chunks,
                # but include all chunks to ensure completeness (LLM will focus based on prompt)
                step_chunk_indices = self._get_relevant_chunk_indices_for_step(
                    user_id=user_id,
                    document_id=document_id,
                    doc_type=doc_type,
                    step_name=step_name,
                    all_chunks_dict=all_document_chunks_dict
                )
                
                # Strategy: Prioritize relevant chunks but include all chunks for completeness
                # The focused prompt will guide the LLM to extract the right information
                if step_chunk_indices:
                    # Get targeted chunks (most relevant, sorted by index)
                    targeted_chunks = [
                        (idx, all_document_chunks_dict[idx]) 
                        for idx in sorted(step_chunk_indices) 
                        if idx in all_document_chunks_dict
                    ]
                    print(f"  Found {len(targeted_chunks)} highly relevant chunks for this step")
                    
                    # Get remaining chunks (less relevant but still included for completeness)
                    remaining_chunks = [
                        (idx, all_document_chunks_dict[idx])
                        for idx in sorted(all_document_chunks_dict.keys())
                        if idx not in step_chunk_indices
                    ]
                    
                    # Combine: relevant chunks first, then remaining chunks
                    # This helps LLM focus on relevant parts while maintaining full context
                    all_prioritized_chunks = targeted_chunks + remaining_chunks
                    step_chunks = [text for _, text in all_prioritized_chunks]
                else:
                    # Use all chunks if no targeted chunks found
                    step_chunks = all_document_chunks_text
                    print(f"  Using all {len(step_chunks)} chunks (no highly relevant chunks identified)")
                
                print(f"  Processing {len(step_chunks)} chunks total for this step")
                
                # Combine chunks for this step (maintain order)
                step_text = "\n\n".join(step_chunks)
                
                # Extract information for this step
                step_result = self._extract_step(
                    step_name=step_name,
                    text=step_text,
                    previous_results=all_results
                )
                
                # Store result (merge with existing to avoid overwriting)
                for key, value in step_result.items():
                    if key not in all_results or not all_results[key]:
                        all_results[key] = value
                    elif isinstance(value, list) and value:
                        # Merge lists
                        if key in ["deductibles", "copays", "coinsurance", "coverage_limits", "services"]:
                            # Merge complex lists
                            existing = all_results.get(key, [])
                            if key == "services":
                                # Merge services by service_name
                                existing_dict = {s.get("service_name"): s for s in existing if s.get("service_name")}
                                for service in value:
                                    service_name = service.get("service_name")
                                    if service_name and service_name not in existing_dict:
                                        existing_dict[service_name] = service
                                all_results[key] = list(existing_dict.values())
                            else:
                                # Merge other lists (deduplicate)
                                combined = existing + value
                                # Simple deduplication (could be improved)
                                seen = set()
                                unique = []
                                for item in combined:
                                    item_str = json.dumps(item, sort_keys=True)
                                    if item_str not in seen:
                                        seen.add(item_str)
                                        unique.append(item)
                                all_results[key] = unique
                        elif key in ["exclusions", "preauth_required_services", "special_programs"]:
                            # Merge simple lists
                            all_results[key] = list(set(all_results.get(key, []) + value))
                    elif value:  # Non-list values: prefer non-empty
                        all_results[key] = value
                
                print(f"  ✅ {step_name} completed")
                
            except Exception as e:
                print(f"  ❌ Error in {step_name}: {str(e)}")
                # Don't stop execution - continue with other steps
                # The step will just be skipped and we'll continue
                import traceback
                traceback.print_exc()
                continue
        
        # Combine all results
        print(f"\n{'='*80}")
        print("Combining all results...")
        print(f"{'='*80}")
        
        # Validate that we have at least plan_name (required field)
        if not all_results.get("plan_name"):
            print(f"  ⚠️  Warning: plan_name is missing. Attempting to extract from document...")
            # Try to extract plan_name from all chunks
            try:
                plan_name_text = "\n\n".join(all_document_chunks_text)
                plan_name_result = self._extract_step(
                    step_name="step1_basic_info",
                    text=plan_name_text,
                    previous_results={}
                )
                if plan_name_result.get("plan_name"):
                    all_results["plan_name"] = plan_name_result["plan_name"]
                    print(f"  ✅ Found plan_name: {all_results['plan_name']}")
                else:
                    # Use a default plan name if still not found
                    all_results["plan_name"] = f"Unknown Plan - {document_id}"
                    print(f"  ⚠️  Using default plan_name: {all_results['plan_name']}")
            except Exception as e:
                print(f"  ⚠️  Could not extract plan_name: {str(e)}")
                all_results["plan_name"] = f"Unknown Plan - {document_id}"
        
        # Add metadata
        all_results["user_id"] = user_id
        all_results["source_document_id"] = document_id
        all_results["extracted_date"] = datetime.now().isoformat()
        
        # Normalize the data
        all_results = self._normalize_benefits_data(all_results)
        
        print(f"✅ Chain of Thought extraction complete!")
        
        return all_results
    
    def _get_all_document_chunks_dict(
        self,
        user_id: str,
        document_id: str,
        doc_type: str
    ) -> Dict[int, str]:
        """Get ALL chunks for a document as a dictionary (chunk_index -> text)"""
        try:
            query_result = self.vector_store.query_private(
                query_text="insurance benefits plan coverage",
                user_id=user_id,
                doc_types=[doc_type],
                top_k=100,  # Get up to 100 chunks
                additional_filter={"doc_id": {"$eq": document_id}}
            )
            
            chunks = {}
            for match in query_result.get("matches", []):
                metadata = match.get("metadata", {})
                chunk_index = metadata.get("chunk_index", 0)
                text = metadata.get("text", "")
                if text:
                    chunks[chunk_index] = text
            
            return chunks
        except Exception as e:
            print(f"    Warning: Failed to get all chunks: {str(e)}")
            return {}
    
    def _get_relevant_chunk_indices_for_step(
        self,
        user_id: str,
        document_id: str,
        doc_type: str,
        step_name: str,
        all_chunks_dict: Dict[int, str]
    ) -> set:
        """
        Get indices of chunks most relevant to a specific step using targeted queries
        
        Returns:
            Set of chunk indices that are most relevant to this step
        """
        # Get queries for this step
        queries = STEP_QUERIES.get(step_name, [])
        
        relevant_indices = set()
        
        # Use targeted queries to find most relevant chunks
        if queries:
            for query_text in queries[:3]:  # Use up to 3 queries per step
                try:
                    query_result = self.vector_store.query_private(
                        query_text=query_text,
                        user_id=user_id,
                        doc_types=[doc_type],
                        top_k=20,  # Get top 20 chunks per query
                        additional_filter={"doc_id": {"$eq": document_id}}
                    )
                    
                    # Collect chunk indices
                    for match in query_result.get("matches", []):
                        metadata = match.get("metadata", {})
                        chunk_index = metadata.get("chunk_index", 0)
                        # Only add if chunk exists in our cached chunks
                        if chunk_index in all_chunks_dict:
                            relevant_indices.add(chunk_index)
                    
                except Exception as e:
                    print(f"    Warning: Query failed for '{query_text}': {str(e)}")
                    continue
        
        return relevant_indices
    
    def _extract_step(
        self,
        step_name: str,
        text: str,
        previous_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract information for a specific step"""
        
        # Get the prompt for this step
        step_prompt = STEP_PROMPTS.get(step_name, "")
        
        if not step_prompt:
            raise ValueError(f"Unknown step: {step_name}")
        
        # Add context from previous steps
        context = ""
        if previous_results:
            context = f"\n\n**Context from previous steps:**\n"
            if previous_results.get("plan_name"):
                context += f"- Plan Name: {previous_results.get('plan_name')}\n"
            if previous_results.get("insurance_provider"):
                context += f"- Insurance Provider: {previous_results.get('insurance_provider')}\n"
            context += "\nUse this context to ensure consistency with previously extracted information.\n"
        
        # Prepare the message
        user_message = f"""{step_prompt}{context}

**Document Text:**
{text}

**IMPORTANT INSTRUCTIONS:**
1. Extract the information for this step ONLY
2. Return ONLY the JSON object - no explanation, no reasoning, no other text
3. Do NOT include any thinking or reasoning in your response
4. Return the JSON directly, without markdown code blocks or answer tags
5. If information is not found, return an empty array [] or omit the field

**Now extract and return ONLY the JSON:**"""
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert insurance benefits analyst. Extract specific information from insurance documents step by step. Return ONLY valid JSON - no explanations, no reasoning, no markdown, just the JSON object. Do not use <answer> tags or <reasoning> tags - return pure JSON only."
            },
            {
                "role": "user",
                "content": user_message
            }
        ]
        
        # Call LLM
        response = self.llm_client.chat(messages)
        
        if not response or "choices" not in response:
            raise Exception("Failed to get response from LLM")
        
        # Extract JSON from response
        content = response["choices"][0]["message"]["content"]
        json_text = self._extract_json(content)
        
        try:
            step_result = json.loads(json_text)
        except json.JSONDecodeError as e:
            # Try to fix common JSON issues
            # Remove any trailing commas, fix quotes, etc.
            try:
                # Try to extract just the JSON object more carefully
                # Look for the first { and last }
                first_brace = json_text.find('{')
                last_brace = json_text.rfind('}')
                if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                    json_text_clean = json_text[first_brace:last_brace + 1]
                    step_result = json.loads(json_text_clean)
                else:
                    raise Exception(f"Could not find valid JSON in response: {str(e)}\nResponse: {content[:500]}")
            except Exception as e2:
                raise Exception(f"Failed to parse JSON from LLM response: {str(e)}\nCleaned JSON attempt failed: {str(e2)}\nResponse preview: {content[:500]}")
        
        return step_result
    
    def _extract_json(self, text: str) -> str:
        """Extract JSON from text (may be in markdown code blocks or answer tags)"""
        import re
        
        # Strategy 1: Look for JSON in <answer> tags (some LLMs use this format)
        answer_match = re.search(r'<answer>(.*?)</answer>', text, re.DOTALL)
        if answer_match:
            json_text = answer_match.group(1).strip()
            # Try to extract JSON from the answer
            json_in_answer = re.search(r'\{.*\}', json_text, re.DOTALL)
            if json_in_answer:
                return json_in_answer.group(0)
        
        # Strategy 2: Look for JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Strategy 3: Look for JSON object directly (but avoid matching reasoning text)
        # Try to find JSON that's not inside reasoning tags
        # Remove reasoning tags first
        text_without_reasoning = re.sub(r'<.*?reasoning.*?>.*?</.*?reasoning.*?>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text_without_reasoning = re.sub(r'<.*?thinking.*?>.*?</.*?thinking.*?>', '', text_without_reasoning, flags=re.DOTALL | re.IGNORECASE)
        text_without_reasoning = re.sub(r'<.*?redacted.*?>.*?</.*?redacted.*?>', '', text_without_reasoning, flags=re.DOTALL | re.IGNORECASE)
        
        # Now look for JSON
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text_without_reasoning, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        # Strategy 4: Look for JSON anywhere in text
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
            for deductible in data.get("deductibles", []):
                if "network" in deductible:
                    deductible["network"] = normalize_network(deductible["network"])
        
        # Normalize copays
        if "copays" in data:
            for copay in data.get("copays", []):
                if "network" in copay:
                    copay["network"] = normalize_network(copay["network"])
                if "service_type" in copay:
                    copay["service_type"] = normalize_service(copay["service_type"])
        
        # Normalize coinsurance
        if "coinsurance" in data:
            for coin in data.get("coinsurance", []):
                if "network" in coin:
                    coin["network"] = normalize_network(coin["network"])
        
        # Normalize coverage limits
        if "coverage_limits" in data:
            for limit in data.get("coverage_limits", []):
                if "network" in limit:
                    limit["network"] = normalize_network(limit["network"])
        
        # Normalize services
        if "services" in data:
            for service in data.get("services", []):
                if "service_name" in service:
                    service["service_name"] = normalize_service(service["service_name"])
                if "copay" in service and service.get("copay"):
                    if "network" in service["copay"]:
                        service["copay"]["network"] = normalize_network(service["copay"]["network"])
                    if "service_type" in service["copay"]:
                        service["copay"]["service_type"] = normalize_service(service["copay"]["service_type"])
        
        return data
    
    def to_sql_ready(self, benefits_data: Dict[str, Any], table_name: str = "insurance_benefits") -> Dict[str, Any]:
        """Convert benefits data to SQL-ready format"""
        from benefits_schema import InsuranceBenefits
        
        # Ensure plan_name exists (required field)
        if not benefits_data.get("plan_name"):
            benefits_data["plan_name"] = f"Unknown Plan - {benefits_data.get('source_document_id', 'unknown')}"
        
        try:
            benefits = InsuranceBenefits.from_dict(benefits_data)
            return benefits.to_sql_insert(table_name=table_name)
        except Exception as e:
            # If validation fails, create a minimal valid structure
            print(f"Warning: Benefits validation failed: {str(e)}")
            # Ensure required fields
            if not benefits_data.get("plan_name"):
                benefits_data["plan_name"] = f"Unknown Plan - {benefits_data.get('source_document_id', 'unknown')}"
            
            # Try again with minimal structure
            minimal_benefits = {
                "plan_name": benefits_data.get("plan_name", "Unknown Plan"),
                "deductibles": benefits_data.get("deductibles", []),
                "copays": benefits_data.get("copays", []),
                "coinsurance": benefits_data.get("coinsurance", []),
                "coverage_limits": benefits_data.get("coverage_limits", []),
                "services": benefits_data.get("services", []),
                "exclusions": benefits_data.get("exclusions", []),
                "preauth_required_services": benefits_data.get("preauth_required_services", []),
                "special_programs": benefits_data.get("special_programs", []),
            }
            # Add optional fields
            for key in ["plan_type", "insurance_provider", "policy_number", "group_number",
                       "effective_date", "expiration_date", "out_of_pocket_max_individual",
                       "out_of_pocket_max_family", "in_network_providers", "network_notes",
                       "preauth_notes", "exclusion_notes", "additional_benefits", "notes",
                       "user_id", "source_document_id", "extracted_date"]:
                if key in benefits_data:
                    minimal_benefits[key] = benefits_data[key]
            
            benefits = InsuranceBenefits.from_dict(minimal_benefits)
            return benefits.to_sql_insert(table_name=table_name)

