"""
EOB Extraction Agent with Chain of Thought (CoT) Prompting

This agent breaks down EOB extraction into step-by-step tasks,
each focusing on a specific category of information from EOB documents.
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime
import re

from pinecone_store import PineconeVectorStore
from api import K2APIClient
from eob_schema import EOBInfo, ServiceDetail, CoverageBreakdown


# ==================== STEP-BY-STEP PROMPTS ====================

EOB_STEP_PROMPTS = {
    "step1_member_info": """**Step 1: Extract Member Information**

Extract the following member information from the EOB document:
- member_name (REQUIRED): Name of the member/patient
- member_address: Member's address
- member_id: Member identification number (also called Identification No. or Policy Number)
- group_number: Group number if applicable

**Your Task:**
Read through the document text and extract ONLY the member information listed above.

**Output Format:**
Return a JSON object with only these fields:
```json
{{
  "member_name": "ELIZABETH SMITH",
  "member_address": "123 Maple St., London, UK",
  "member_id": "ID53542504",
  "group_number": "9087"
}}
```

If a field is not found, omit it (don't include null values).""",

    "step2_claim_info": """**Step 2: Extract Claim Information**

Extract the following claim information from the EOB document:
- claim_number (REQUIRED): Claim number (also called Claim No.)
- claim_date: Date of the claim or service date (YYYY-MM-DD format)
- provider_name (REQUIRED): Name of the healthcare provider
- provider_npi: Provider NPI number if available

**Your Task:**
Read through the document text and extract ONLY the claim information listed above.

**Output Format:**
Return a JSON object with only these fields:
```json
{{
  "claim_number": "CLM5943862",
  "claim_date": "2025-08-19",
  "provider_name": "City Hospital",
  "provider_npi": "1234567890"
}}
```

If a field is not found, omit it (don't include null values).""",

    "step3_financial_summary": """**Step 3: Extract Financial Summary**

Extract the financial summary information from the EOB document. Look for:
- Total Billed: Total amount billed by the provider
- Total Benefits Approved: Total amount approved by insurance
- Amount You May Owe Provider: Amount the member is responsible for

**Extract:**
- total_billed: Total billed amount (as a number, not string)
- total_benefits_approved: Total benefits approved (as a number)
- amount_you_owe: Amount you may owe provider (as a number)

**Output Format:**
Return a JSON object:
```json
{{
  "total_billed": 1216.00,
  "total_benefits_approved": 894.80,
  "amount_you_owe": 321.20
}}
```

If a value is not found, use 0.0 as default.""",

    "step4_service_details": """**Step 4: Extract Service Details**

Extract all service details from the EOB document. Look for a table or list of services with:
- Service Description (e.g., "Medical Emerg X-Ray")
- Service Date
- Amount Billed
- Not Covered amount
- Covered amount
- CPT codes (if available)
- ICD-10 codes (if available)

**For each service, extract:**
- service_description: Description of the service
- service_date: Date of service (YYYY-MM-DD format)
- amount_billed: Amount billed for this service (as a number)
- not_covered: Amount not covered (as a number)
- covered: Amount covered (as a number)
- cpt_code: CPT code if mentioned (optional)
- icd10_code: ICD-10 code if mentioned (optional)

**Output Format:**
Return a JSON object with a "services" array:
```json
{{
  "services": [
    {{
      "service_description": "Medical Emerg X-Ray",
      "service_date": "2025-08-19",
      "amount_billed": 608.00,
      "not_covered": 118.93,
      "covered": 447.40,
      "cpt_code": null,
      "icd10_code": null
    }}
  ]
}}
```

If no services are found, return an empty array: `{{"services": []}}`""",

    "step5_coverage_breakdown": """**Step 5: Extract Coverage Breakdown**

Extract detailed coverage breakdown information from the EOB document. Look for:
- Total Billed
- Total Not Covered (PPO/Plan reductions)
- Total Covered (before coinsurance/deductions)
- Total Coinsurance
- Total Deductions
- Total Benefits Approved
- Amount You May Owe Provider

**Extract:**
- total_billed: Total billed amount
- total_not_covered: Total not covered (PPO/Plan reductions)
- total_covered_before_deductions: Total covered before coinsurance/deductions
- total_coinsurance: Total coinsurance amount
- total_deductions: Total deductions
- total_benefits_approved: Total benefits approved
- amount_you_owe: Amount you may owe provider
- notes: Any additional notes about coverage

**Output Format:**
Return a JSON object:
```json
{{
  "coverage_breakdown": {{
    "total_billed": 1216.00,
    "total_not_covered": 237.86,
    "total_covered_before_deductions": 978.14,
    "total_coinsurance": 79.16,
    "total_deductions": 4.18,
    "total_benefits_approved": 894.80,
    "amount_you_owe": 321.20,
    "notes": null
  }}
}}
```

If coverage breakdown is not found, omit the field.""",

    "step6_insurance_info": """**Step 6: Extract Insurance Information**

Extract insurance provider information from the EOB document. Look for:
- Insurance provider name (company name)
- Plan name
- Policy number

**Extract:**
- insurance_provider: Name of the insurance company (e.g., "Aetna", "BlueCross")
- plan_name: Name of the insurance plan
- policy_number: Policy number (may be same as member_id)

**Output Format:**
Return a JSON object:
```json
{{
  "insurance_provider": "Aetna",
  "plan_name": "PPO Plan",
  "policy_number": "POL123456"
}}
```

If a field is not found, omit it.""",

    "step7_alerts_discrepancies": """**Step 7: Identify Alerts and Discrepancies**

Analyze the EOB document for potential alerts and discrepancies. Look for:
- High amounts that may need review
- Discrepancies between billed and covered amounts
- Duplicate charges
- Services that seem incorrectly coded
- Amounts that don't add up correctly

**Extract:**
- alerts: List of alerts (e.g., ["High amount", "Review needed"])
- discrepancies: List of discrepancies found (e.g., ["Amount mismatch", "Duplicate service"])

**Output Format:**
Return a JSON object:
```json
{{
  "alerts": ["High amount"],
  "discrepancies": []
}}
```

If no alerts or discrepancies are found, return empty arrays:
```json
{{
  "alerts": [],
  "discrepancies": []
}}
```"""
}


# ==================== QUERY MAPPINGS FOR EACH STEP ====================

EOB_STEP_QUERIES = {
    "step1_member_info": [
        "member name patient name",
        "member address",
        "member ID identification number",
        "group number",
        "policy number member ID"
    ],
    "step2_claim_info": [
        "claim number",
        "claim date service date",
        "provider name",
        "provider NPI",
        "healthcare provider"
    ],
    "step3_financial_summary": [
        "total billed",
        "total benefits approved",
        "amount you may owe",
        "amount you owe provider",
        "financial summary"
    ],
    "step4_service_details": [
        "service description",
        "service date",
        "amount billed",
        "not covered",
        "covered amount",
        "CPT code",
        "ICD-10 code"
    ],
    "step5_coverage_breakdown": [
        "coverage breakdown",
        "total not covered",
        "total covered",
        "coinsurance",
        "deductions",
        "PPO plan reductions"
    ],
    "step6_insurance_info": [
        "insurance provider",
        "insurance company",
        "plan name",
        "policy number",
        "explanation of benefits"
    ],
    "step7_alerts_discrepancies": [
        "discrepancy",
        "alert",
        "mismatch",
        "duplicate",
        "error",
        "review needed"
    ]
}


# ==================== EOB AGENT WITH CoT ====================

class EOBExtractionAgentCoT:
    """EOB Extraction Agent using Chain of Thought (CoT) step-by-step extraction"""
    
    def __init__(self, vector_store: Optional[PineconeVectorStore] = None, llm_client: Optional[K2APIClient] = None):
        """
        Initialize the EOB Extraction Agent with CoT
        
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
        doc_type: str = "eob",
        steps: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Extract EOB information using Chain of Thought step-by-step approach
        
        Args:
            user_id: User ID
            document_id: Document ID
            doc_type: Document type (default: "eob")
            steps: List of steps to execute (if None, executes all steps)
        
        Returns:
            Dictionary containing extracted EOB information
        """
        if steps is None:
            steps = list(EOB_STEP_PROMPTS.keys())
        
        print(f"Starting Chain of Thought EOB extraction for document {document_id}...")
        print(f"Total steps: {len(steps)}")
        
        # Store results from each step
        all_results = {}
        
        # Get all chunks once (cache for all steps)
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
                step_chunk_indices = self._get_relevant_chunk_indices_for_step(
                    user_id=user_id,
                    document_id=document_id,
                    doc_type=doc_type,
                    step_name=step_name,
                    all_chunks_dict=all_document_chunks_dict
                )
                
                # Prioritize relevant chunks but include all chunks for completeness
                if step_chunk_indices:
                    targeted_chunks = [
                        (idx, all_document_chunks_dict[idx]) 
                        for idx in sorted(step_chunk_indices) 
                        if idx in all_document_chunks_dict
                    ]
                    print(f"  Found {len(targeted_chunks)} highly relevant chunks for this step")
                    
                    remaining_chunks = [
                        (idx, all_document_chunks_dict[idx])
                        for idx in sorted(all_document_chunks_dict.keys())
                        if idx not in step_chunk_indices
                    ]
                    
                    all_prioritized_chunks = targeted_chunks + remaining_chunks
                    step_chunks = [text for _, text in all_prioritized_chunks]
                else:
                    step_chunks = all_document_chunks_text
                    print(f"  Using all {len(step_chunks)} chunks (no highly relevant chunks identified)")
                
                print(f"  Processing {len(step_chunks)} chunks total for this step")
                
                # Combine chunks for this step
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
                        if key == "services":
                            # Merge services - avoid duplicates
                            existing_services = all_results.get(key, [])
                            existing_descriptions = {s.get("service_description"): s for s in existing_services}
                            for service in value:
                                desc = service.get("service_description")
                                if desc and desc not in existing_descriptions:
                                    existing_descriptions[desc] = service
                            all_results[key] = list(existing_descriptions.values())
                        elif key in ["alerts", "discrepancies"]:
                            # Merge simple lists
                            all_results[key] = list(set(all_results.get(key, []) + value))
                    elif isinstance(value, dict) and key == "coverage_breakdown":
                        # Merge coverage breakdown (prefer more complete data)
                        if not all_results.get(key) or not all_results[key].get("total_billed"):
                            all_results[key] = value
                        else:
                            # Merge - prefer non-zero/non-null values
                            for k, v in value.items():
                                if v and (not all_results[key].get(k) or all_results[key][k] == 0):
                                    all_results[key][k] = v
                    elif value:  # Non-list values: prefer non-empty
                        all_results[key] = value
                
                print(f"  ✅ {step_name} completed")
                
            except Exception as e:
                print(f"  ❌ Error in {step_name}: {str(e)}")
                import traceback
                traceback.print_exc()
                continue
        
        # Combine all results
        print(f"\n{'='*80}")
        print("Combining all results...")
        print(f"{'='*80}")
        
        # Validate required fields
        if not all_results.get("member_name"):
            print(f"  ⚠️  Warning: member_name is missing. Using default...")
            all_results["member_name"] = "Unknown Member"
        
        if not all_results.get("claim_number"):
            print(f"  ⚠️  Warning: claim_number is missing. Using document_id...")
            all_results["claim_number"] = document_id
        
        if not all_results.get("provider_name"):
            print(f"  ⚠️  Warning: provider_name is missing. Using default...")
            all_results["provider_name"] = "Weill Cornell Medicine"
        
        # Add metadata
        all_results["user_id"] = user_id
        all_results["source_document_id"] = document_id
        all_results["extracted_date"] = datetime.now().isoformat()
        
        # Normalize the data
        all_results = self._normalize_eob_data(all_results)
        
        # Calculate alerts and discrepancies
        all_results = self._calculate_alerts_and_discrepancies(all_results)
        
        print(f"✅ Chain of Thought EOB extraction complete!")
        
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
                query_text="explanation of benefits EOB claim",
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
        queries = EOB_STEP_QUERIES.get(step_name, [])
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
        step_prompt = EOB_STEP_PROMPTS.get(step_name, "")
        
        if not step_prompt:
            raise ValueError(f"Unknown step: {step_name}")
        
        # Add context from previous steps
        context = ""
        if previous_results:
            context = f"\n\n**Context from previous steps:**\n"
            if previous_results.get("member_name"):
                context += f"- Member Name: {previous_results.get('member_name')}\n"
            if previous_results.get("claim_number"):
                context += f"- Claim Number: {previous_results.get('claim_number')}\n"
            if previous_results.get("provider_name"):
                context += f"- Provider Name: {previous_results.get('provider_name')}\n"
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
6. For financial amounts, use numbers (not strings) - e.g., 1216.00 not "1216.00"

**Now extract and return ONLY the JSON:**"""
        
        messages = [
            {
                "role": "system",
                "content": "You are an expert EOB (Explanation of Benefits) analyst. Extract specific information from EOB documents step by step. Return ONLY valid JSON - no explanations, no reasoning, no markdown, just the JSON object. Do not use <answer> tags or <reasoning> tags - return pure JSON only."
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
            try:
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
        
        # Strategy 1: Look for JSON in <answer> tags
        answer_match = re.search(r'<answer>(.*?)</answer>', text, re.DOTALL)
        if answer_match:
            json_text = answer_match.group(1).strip()
            json_in_answer = re.search(r'\{.*\}', json_text, re.DOTALL)
            if json_in_answer:
                return json_in_answer.group(0)
        
        # Strategy 2: Look for JSON in code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            return json_match.group(1)
        
        # Strategy 3: Remove reasoning tags and look for JSON
        text_without_reasoning = re.sub(r'<.*?reasoning.*?>.*?</.*?reasoning.*?>', '', text, flags=re.DOTALL | re.IGNORECASE)
        text_without_reasoning = re.sub(r'<.*?thinking.*?>.*?</.*?thinking.*?>', '', text_without_reasoning, flags=re.DOTALL | re.IGNORECASE)
        text_without_reasoning = re.sub(r'<.*?redacted.*?>.*?</.*?redacted.*?>', '', text_without_reasoning, flags=re.DOTALL | re.IGNORECASE)
        
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text_without_reasoning, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        # Strategy 4: Look for JSON anywhere in text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json_match.group(0)
        
        return text
    
    def _normalize_eob_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize EOB data to ensure consistency"""
        # Normalize amounts (ensure they are floats, not strings)
        amount_fields = [
            "total_billed", "total_benefits_approved", "amount_you_owe",
            "total_not_covered", "total_covered_before_deductions",
            "total_coinsurance", "total_deductions"
        ]
        
        for field in amount_fields:
            if field in data:
                try:
                    if isinstance(data[field], str):
                        # Remove $, commas, and convert to float
                        data[field] = float(re.sub(r'[$,]', '', data[field]))
                    elif not isinstance(data[field], (int, float)):
                        data[field] = 0.0
                except (ValueError, TypeError):
                    data[field] = 0.0
        
        # Normalize service amounts
        if "services" in data:
            for service in data.get("services", []):
                for field in ["amount_billed", "not_covered", "covered"]:
                    if field in service:
                        try:
                            if isinstance(service[field], str):
                                service[field] = float(re.sub(r'[$,]', '', service[field]))
                            elif not isinstance(service[field], (int, float)):
                                service[field] = 0.0
                        except (ValueError, TypeError):
                            service[field] = 0.0
        
        # Normalize coverage breakdown amounts
        if "coverage_breakdown" in data and data["coverage_breakdown"]:
            for field in amount_fields:
                if field in data["coverage_breakdown"]:
                    try:
                        if isinstance(data["coverage_breakdown"][field], str):
                            data["coverage_breakdown"][field] = float(re.sub(r'[$,]', '', data["coverage_breakdown"][field]))
                        elif not isinstance(data["coverage_breakdown"][field], (int, float)):
                            data["coverage_breakdown"][field] = 0.0
                    except (ValueError, TypeError):
                        data["coverage_breakdown"][field] = 0.0
        
        # Normalize dates (ensure YYYY-MM-DD format)
        date_fields = ["claim_date"]
        for field in date_fields:
            if field in data and data[field]:
                data[field] = self._normalize_date(data[field])
        
        # Normalize service dates
        if "services" in data:
            for service in data.get("services", []):
                if "service_date" in service and service["service_date"]:
                    service["service_date"] = self._normalize_date(service["service_date"])
        
        return data
    
    def _normalize_date(self, date_str: str) -> str:
        """Normalize date string to YYYY-MM-DD format"""
        if not date_str:
            return ""
        
        # Try common date formats
        date_patterns = [
            r'(\d{4})-(\d{2})-(\d{2})',  # YYYY-MM-DD
            r'(\d{2})/(\d{2})/(\d{4})',  # MM/DD/YYYY
            r'(\d{4})/(\d{2})/(\d{2})',  # YYYY/MM/DD
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, date_str)
            if match:
                if len(match.groups()) == 3:
                    if '-' in date_str:
                        # Already YYYY-MM-DD
                        return date_str
                    elif '/' in date_str:
                        parts = match.groups()
                        if len(parts[0]) == 4:
                            # YYYY/MM/DD
                            return f"{parts[0]}-{parts[1]}-{parts[2]}"
                        else:
                            # MM/DD/YYYY
                            return f"{parts[2]}-{parts[0]}-{parts[1]}"
        
        # If no pattern matches, return as is
        return date_str
    
    def _calculate_alerts_and_discrepancies(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate alerts and discrepancies based on EOB data"""
        alerts = data.get("alerts", [])
        discrepancies = data.get("discrepancies", [])
        
        # Check for high amount
        amount_owed = data.get("amount_you_owe", 0.0)
        if amount_owed > 1000:
            if "High amount" not in alerts:
                alerts.append("High amount")
        
        # Check for amount discrepancies
        total_billed = data.get("total_billed", 0.0)
        total_approved = data.get("total_benefits_approved", 0.0)
        calculated_owed = total_billed - total_approved
        
        # Allow small rounding differences (e.g., $0.01)
        if abs(calculated_owed - amount_owed) > 1.0:
            discrepancy = f"Amount mismatch: Expected ${calculated_owed:.2f} owed, but EOB shows ${amount_owed:.2f}"
            if discrepancy not in discrepancies:
                discrepancies.append(discrepancy)
        
        # Check service totals
        if "services" in data and data["services"]:
            services_billed_total = sum(s.get("amount_billed", 0.0) for s in data["services"])
            services_covered_total = sum(s.get("covered", 0.0) for s in data["services"])
            services_not_covered_total = sum(s.get("not_covered", 0.0) for s in data["services"])
            
            # Check if service totals match financial summary
            if abs(services_billed_total - total_billed) > 1.0:
                discrepancy = f"Service total mismatch: Services total ${services_billed_total:.2f}, but EOB shows ${total_billed:.2f}"
                if discrepancy not in discrepancies:
                    discrepancies.append(discrepancy)
        
        # Check for duplicate services
        if "services" in data and data["services"]:
            service_descriptions = [s.get("service_description", "") for s in data["services"]]
            duplicates = [desc for desc in set(service_descriptions) if service_descriptions.count(desc) > 1]
            if duplicates:
                discrepancy = f"Duplicate services found: {', '.join(duplicates[:3])}"
                if discrepancy not in discrepancies:
                    discrepancies.append(discrepancy)
        
        data["alerts"] = alerts
        data["discrepancies"] = discrepancies
        
        return data
    
    def to_eob_info(self, eob_data: Dict[str, Any]) -> EOBInfo:
        """Convert extracted data to EOBInfo object"""
        return EOBInfo.from_dict(eob_data)
    
    def to_case_format(self, eob_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert EOB data to case format for the cases page"""
        eob_info = self.to_eob_info(eob_data)
        return eob_info.to_case_format()
    
    def to_sql_ready(self, eob_data: Dict[str, Any], table_name: str = "eob_records") -> Dict[str, Any]:
        """Convert EOB data to SQL-ready format"""
        eob_info = self.to_eob_info(eob_data)
        
        # Build SQL INSERT statement
        sql = f"""
        INSERT INTO {table_name} (
            user_id, claim_number, member_name, member_address, member_id, group_number,
            claim_date, provider_name, provider_npi, total_billed, total_benefits_approved,
            amount_you_owe, services, coverage_breakdown, insurance_provider, plan_name,
            policy_number, alerts, discrepancies, source_document_id, extracted_date
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (claim_number, user_id) DO UPDATE SET
            total_billed = EXCLUDED.total_billed,
            total_benefits_approved = EXCLUDED.total_benefits_approved,
            amount_you_owe = EXCLUDED.amount_you_owe,
            services = EXCLUDED.services,
            coverage_breakdown = EXCLUDED.coverage_breakdown,
            alerts = EXCLUDED.alerts,
            discrepancies = EXCLUDED.discrepancies,
            updated_at = CURRENT_TIMESTAMP
        """
        
        # Build values
        import json as json_lib
        values = (
            eob_info.user_id,
            eob_info.claim_number,
            eob_info.member_name,
            eob_info.member_address,
            eob_info.member_id,
            eob_info.group_number,
            eob_info.claim_date,
            eob_info.provider_name,
            eob_info.provider_npi,
            float(eob_info.total_billed),
            float(eob_info.total_benefits_approved),
            float(eob_info.amount_you_owe),
            json_lib.dumps([s.__dict__ for s in eob_info.services]),
            json_lib.dumps(eob_info.coverage_breakdown.__dict__) if eob_info.coverage_breakdown else None,
            eob_info.insurance_provider,
            eob_info.plan_name,
            eob_info.policy_number,
            json_lib.dumps(eob_info.alerts),
            json_lib.dumps(eob_info.discrepancies),
            eob_info.source_document_id,
            eob_info.extracted_date
        )
        
        return {
            "sql": sql,
            "values": values,
            "data": eob_info.to_dict()
        }

