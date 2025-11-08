"""
RAG Retriever for CarePilot

This module implements the dual-query RAG flow:
1. Query 1: Get Private Context (user-specific PHI from 'private' namespace)
2. Query 2: Get Public Knowledge (shared knowledge from 'kb' namespace)

This enables the agent to combine user-specific data with general medical knowledge
for comprehensive claim processing and bill negotiation.
"""

from typing import List, Dict, Any, Optional
from pinecone_store import PineconeVectorStore
from api import K2APIClient


class CarePilotRAGRetriever:
    """
    RAG Retriever that performs dual-query flow:
    - Query private namespace for user-specific context
    - Query kb namespace for public knowledge
    """
    
    def __init__(
        self,
        vector_store: Optional[PineconeVectorStore] = None,
        llm_client: Optional[K2APIClient] = None
    ):
        """
        Initialize RAG Retriever
        
        Args:
            vector_store: PineconeVectorStore instance (creates new one if not provided)
            llm_client: K2APIClient instance (creates new one if not provided)
        """
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
    
    def get_context_for_question(
        self,
        user_id: str,
        question: str,
        doc_types: Optional[List[str]] = None,
        top_k_private: int = 5,
        top_k_kb: int = 5,
        extract_codes: bool = True
    ) -> Dict[str, Any]:
        """
        Get context for a user question using dual-query flow
        
        This is the main method that implements the RAG flow described in the blueprint:
        1. Query private namespace to get user-specific context
        2. Extract relevant codes/terms from private context
        3. Query kb namespace to get public knowledge about those codes/terms
        
        Args:
            user_id: User identifier (required for multi-tenancy)
            question: User's question (e.g., "Why was I charged $150 for my Creatinine test?")
            doc_types: Document types to search in private namespace (e.g., ["bill", "lab_report"])
            top_k_private: Number of results from private namespace
            top_k_kb: Number of results from kb namespace
            extract_codes: Whether to extract codes from private context for KB query
        
        Returns:
            Dictionary containing:
            - private_context: Results from private namespace
            - kb_context: Results from kb namespace
            - combined_context: Combined text context for LLM
            - extracted_terms: Terms/codes extracted for KB query
        """
        # Query 1: Get Private Context
        # Target: private namespace
        # Filter: user_id + doc_types
        private_results = self.vector_store.query_private(
            query_text=question,
            user_id=user_id,
            doc_types=doc_types or ["bill", "lab_report", "clinical_note"],
            top_k=top_k_private
        )
        
        # Extract relevant terms/codes from private context for KB query
        extracted_terms = []
        if extract_codes and private_results["matches"]:
            extracted_terms = self._extract_codes_from_context(
                private_results["matches"],
                question
            )
        
        # Query 2: Get Public Knowledge
        # Target: kb namespace
        # Filter: Based on source type (cpt_code, payer_policy, etc.)
        kb_query_text = self._build_kb_query(question, extracted_terms)
        
        kb_results = self.vector_store.query_kb(
            query_text=kb_query_text,
            top_k=top_k_kb,
            filter={"source": {"$in": ["cpt_code", "payer_policy", "lab_test_definition", "icd10_code", "loinc_code"]}}
        )
        
        # Combine contexts for LLM
        combined_context = self._combine_contexts(
            private_results["matches"],
            kb_results["matches"]
        )
        
        return {
            "private_context": private_results,
            "kb_context": kb_results,
            "combined_context": combined_context,
            "extracted_terms": extracted_terms,
            "user_id": user_id,
            "question": question
        }
    
    def _extract_codes_from_context(
        self,
        matches: List[Dict[str, Any]],
        question: str
    ) -> List[str]:
        """
        Extract relevant codes/terms from private context matches
        
        Args:
            matches: Private namespace query results
            question: Original question
        
        Returns:
            List of extracted terms/codes
        """
        # Simple extraction: look for common patterns
        # In production, you might use an LLM to extract codes more intelligently
        extracted = []
        
        # Combine all text from matches
        context_text = " ".join([
            match.get("metadata", {}).get("text", "")
            for match in matches
        ])
        
        # Extract potential codes (CPT: 5 digits, ICD-10: alphanumeric with dots)
        import re
        
        # Extract CPT codes (5 digits)
        cpt_codes = re.findall(r'\b\d{5}\b', context_text)
        extracted.extend([f"CPT {code}" for code in cpt_codes])
        
        # Extract ICD-10 codes (alphanumeric with dots, e.g., E11.9)
        icd10_codes = re.findall(r'\b[A-Z]\d{2}\.?\d*\b', context_text)
        extracted.extend(icd10_codes)
        
        # Extract test names (common lab tests)
        test_names = []
        common_tests = ["Creatinine", "Glucose", "Cholesterol", "Hemoglobin", "PSA"]
        for test in common_tests:
            if test.lower() in context_text.lower():
                test_names.append(test)
        extracted.extend(test_names)
        
        # Also extract terms from the question itself
        question_terms = []
        for test in common_tests:
            if test.lower() in question.lower():
                question_terms.append(test)
        extracted.extend(question_terms)
        
        return list(set(extracted))  # Remove duplicates
    
    def _build_kb_query(self, question: str, extracted_terms: List[str]) -> str:
        """
        Build query text for KB namespace
        
        Args:
            question: Original question
            extracted_terms: Extracted terms/codes from private context
        
        Returns:
            Query text for KB namespace
        """
        if extracted_terms:
            # Use extracted terms to build more specific query
            terms_str = " ".join(extracted_terms)
            return f"{question} {terms_str}"
        else:
            # Fall back to original question
            return question
    
    def _combine_contexts(
        self,
        private_matches: List[Dict[str, Any]],
        kb_matches: List[Dict[str, Any]]
    ) -> str:
        """
        Combine private and KB contexts into a single text string for LLM
        
        Args:
            private_matches: Private namespace results
            kb_matches: KB namespace results
        
        Returns:
            Combined context text
        """
        context_parts = []
        
        # Add private context
        if private_matches:
            context_parts.append("=== USER-SPECIFIC CONTEXT ===")
            for i, match in enumerate(private_matches, 1):
                metadata = match.get("metadata", {})
                doc_type = metadata.get("doc_type", "unknown")
                text = metadata.get("text", "")
                context_parts.append(f"\n[{i}] Document Type: {doc_type}")
                context_parts.append(f"Content: {text}")
        
        # Add KB context
        if kb_matches:
            context_parts.append("\n=== MEDICAL KNOWLEDGE BASE ===")
            for i, match in enumerate(kb_matches, 1):
                metadata = match.get("metadata", {})
                source = metadata.get("source", "unknown")
                text = metadata.get("text", "") or metadata.get("description", "")
                code = metadata.get("code", "")
                context_parts.append(f"\n[{i}] Source: {source}")
                if code:
                    context_parts.append(f"Code: {code}")
                context_parts.append(f"Information: {text}")
        
        return "\n".join(context_parts)
    
    def answer_question(
        self,
        user_id: str,
        question: str,
        doc_types: Optional[List[str]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Answer a user question using RAG
        
        Args:
            user_id: User identifier
            question: User's question
            doc_types: Document types to search
            system_prompt: Custom system prompt (optional)
        
        Returns:
            Dictionary with answer and context
        """
        # Get context using dual-query flow
        context_data = self.get_context_for_question(
            user_id=user_id,
            question=question,
            doc_types=doc_types
        )
        
        # Build system prompt
        if system_prompt is None:
            system_prompt = """You are CarePilot, an AI assistant that helps users understand their medical bills and healthcare charges.

You have access to:
1. User-specific documents (bills, lab reports, clinical notes)
2. Medical knowledge base (CPT codes, ICD-10 codes, payer policies, lab test definitions)

Use this information to provide accurate, helpful answers to user questions about their medical bills and charges."""
        
        # Build user message with context
        user_message = f"""Context Information:
{context_data['combined_context']}

User Question: {question}

Please answer the user's question using the context provided above. Be specific and reference the relevant documents and medical codes when applicable."""
        
        # Get answer from LLM
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
        
        response = self.llm_client.chat(messages)
        
        answer = ""
        if response and "choices" in response:
            answer = response["choices"][0]["message"]["content"]
        
        return {
            "answer": answer,
            "context": context_data,
            "question": question,
            "user_id": user_id
        }
    
    def get_context_for_claim(
        self,
        user_id: str,
        claim_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Get context for claim processing
        
        This method retrieves relevant context for processing a healthcare claim,
        combining user documents with medical coding knowledge.
        
        Args:
            user_id: User identifier
            claim_data: Claim data dictionary containing:
                - diagnosis_codes: List of ICD-10 codes
                - procedure_codes: List of CPT codes
                - payer_name: Payer name
                - Other claim fields
        
        Returns:
            Dictionary with relevant context for claim processing
        """
        # Build query from claim data
        query_parts = []
        
        if "procedure_codes" in claim_data:
            query_parts.extend([f"CPT code {code}" for code in claim_data["procedure_codes"]])
        
        if "diagnosis_codes" in claim_data:
            query_parts.extend([f"ICD-10 code {code}" for code in claim_data["diagnosis_codes"]])
        
        if "payer_name" in claim_data:
            query_parts.append(f"{claim_data['payer_name']} policy")
        
        query_text = " ".join(query_parts) if query_parts else "medical claim"
        
        # Get private context (user's relevant documents)
        private_results = self.vector_store.query_private(
            query_text=query_text,
            user_id=user_id,
            doc_types=["bill", "lab_report", "clinical_note"],
            top_k=10
        )
        
        # Get KB context (codes and policies)
        kb_results = self.vector_store.query_kb(
            query_text=query_text,
            top_k=10,
            filter={"source": {"$in": ["cpt_code", "icd10_code", "payer_policy"]}}
        )
        
        # Combine contexts
        combined_context = self._combine_contexts(
            private_results["matches"],
            kb_results["matches"]
        )
        
        return {
            "private_context": private_results,
            "kb_context": kb_results,
            "combined_context": combined_context,
            "claim_data": claim_data,
            "user_id": user_id
        }


# ==================== EXAMPLE USAGE ====================

if __name__ == "__main__":
    # Initialize retriever
    retriever = CarePilotRAGRetriever()
    
    # Example: Bill negotiation question
    print("=== Example: Bill Negotiation Question ===\n")
    
    result = retriever.answer_question(
        user_id="user-123",
        question="Why was I charged $150 for my Creatinine test?",
        doc_types=["bill", "lab_report"]
    )
    
    print(f"Question: {result['question']}")
    print(f"\nAnswer: {result['answer']}")
    print(f"\nPrivate Context Matches: {len(result['context']['private_context']['matches'])}")
    print(f"KB Context Matches: {len(result['context']['kb_context']['matches'])}")
    print(f"\nExtracted Terms: {result['context']['extracted_terms']}")

