"""
Claims Processing Agent using LangGraph and K2 API

This module implements a LangGraph-based agent that processes medical claims
using a 4-step workflow with RAG queries to PineconeVectorStore.
"""

from typing import Dict, List, Any, Optional, TypedDict
import json

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    print("Warning: LangGraph not available. Install with: pip install langgraph")

from pinecone_store import PineconeVectorStore
from api import K2APIClient


# ==================== STATE DEFINITION ====================

class AgentState(TypedDict):
    """State for the Claims Processing Agent"""
    # Input
    user_id: str
    doc_id: Optional[str]
    doc_type: Optional[str]
    task_description: str
    
    # Step outputs
    step1_coverage: Optional[Dict[str, Any]]
    step2_codes: Optional[Dict[str, Any]]
    step3_claim: Optional[Dict[str, Any]]
    step4_status: Optional[Dict[str, Any]]
    
    # Workflow state
    current_step: int
    payer_id: Optional[str]
    retrieved_policies: List[Dict[str, Any]]
    clinical_note: Optional[str]
    suggested_cpt: List[Dict[str, Any]]
    suggested_icd10: List[Dict[str, Any]]
    
    # Final output
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]


# ==================== SYSTEM PROMPTS ====================

MASTER_SYSTEM_PROMPT = """You are 'CarePilot-Claims', an expert AI agent for Revenue Cycle Management.

Your sole purpose is to process medical claims by executing a precise four-step workflow.

**Your Tools:**
You have access to a PineconeVectorStore instance with two primary methods:

1. `store.query_kb(query_text: str, top_k: int, filter: dict) -> dict`: Queries the shared 'kb' namespace. This namespace contains:
   - `source: "cpt_code"`
   - `source: "icd10_code"`
   - `source: "payer_policy"` (with metadata: `payer_id`)
   - `source: "lab_test_definition"`

2. `store.query_private(query_text: str, user_id: str, doc_types: list, top_k: int) -> dict`: Queries the secure 'private' namespace. This namespace contains:
   - `doc_type: "clinical_note"`
   - `doc_type: "bill"`
   - `doc_type: "lab_report"`
   - `doc_type: "plan_document"`

**Your Constraints:**
- **NEVER** query the 'private' namespace without a specific `user_id`.
- **NEVER** confuse 'kb' data (general rules) with 'private' data (a user's specific history).
- You must perform the following 4 steps **in order**.
- Your output for each step must be a structured JSON object.

**Workflow Steps:**
1. Pre-Check Coverage (Policy Retrieval)
2. Assemble Codes (RAG-Assisted Coding)
3. Generate Clean Claim (Validation & Scrubbing)
4. Monitor Status

Always think step by step, query the vector store when needed, and provide structured JSON outputs."""


STEP_PROMPTS = {
    1: """**Step 1: Pre-Check Coverage (Policy Retrieval)**

**Thought:** I must first identify the user's insurance payer and then find the general policy for the type of visit mentioned in the note.

**Your Task:**
1. Query the private namespace to find the user's insurance plan information
2. Query the KB namespace to find relevant payer policies
3. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 1,
  "status": "Completed",
  "payer_id": "aetna",
  "retrieved_policy_context": "Policy details here..."
}}
```""",

    2: """**Step 2: Assemble Codes (RAG-Assisted Coding)**

**Thought:** I must read the clinical note from the 'private' store and then use its text to find the correct CPT (procedure) and ICD-10 (diagnosis) codes from the 'kb'.

**Your Task:**
1. Retrieve the clinical note from private namespace
2. Extract diagnosis information and find matching ICD-10 codes
3. Extract procedure information and find matching CPT codes
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 2,
  "status": "Completed",
  "suggested_cpt": [{{"code": "99214", "justification": "Office visit, est patient, 20-29 min"}}],
  "suggested_icd10": [{{"code": "J02.9", "justification": "Acute Pharyngitis"}}]
}}
```""",

    3: """**Step 3: Generate Clean Claim (Validation & Scrubbing)**

**Thought:** I will now "scrub" the claim. I'll check for known conflicts between the codes (Step 2) and the payer's policy (Step 1) by querying the 'kb' again.

**Your Task:**
1. Check for conflicts between suggested codes and payer policies
2. Validate code combinations
3. Generate the final clean claim object
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 3,
  "status": "Clean",
  "claim_json": {{
    "payer_id": "aetna",
    "user_id": "user-123",
    "cpt_codes": ["99214"],
    "icd10_codes": ["J02.9"],
    "validation_notes": "No policy conflicts found."
  }}
}}
```""",

    4: """**Step 4: Monitor Status**

**Thought:** The claim has been generated. I will log it as "submitted" and await an update (e.g., an EOB upload).

**Your Task:**
1. Finalize the claim status
2. Set monitoring status
3. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 4,
  "status": "Submitted",
  "monitoring_note": "Awaiting EOB from payer."
}}
```"""
}


# ==================== CLAIMS AGENT CLASS ====================

class ClaimsAgent:
    """Claims Processing Agent using LangGraph and K2 API"""
    
    def __init__(
        self,
        vector_store: Optional[PineconeVectorStore] = None,
        llm_client: Optional[K2APIClient] = None
    ):
        """
        Initialize Claims Agent
        
        Args:
            vector_store: PineconeVectorStore instance
            llm_client: K2APIClient instance
        """
        if not LANGGRAPH_AVAILABLE:
            raise ImportError(
                "LangGraph is required for ClaimsAgent. "
                "Install with: pip install langgraph"
            )
        
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
        
        # Build the workflow graph
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
        workflow = StateGraph(AgentState)
        
        # Add nodes
        workflow.add_node("step1_coverage", self._step1_pre_check_coverage)
        workflow.add_node("step2_codes", self._step2_assemble_codes)
        workflow.add_node("step3_claim", self._step3_generate_claim)
        workflow.add_node("step4_status", self._step4_monitor_status)
        
        # Define edges
        workflow.set_entry_point("step1_coverage")
        workflow.add_edge("step1_coverage", "step2_codes")
        workflow.add_edge("step2_codes", "step3_claim")
        workflow.add_edge("step3_claim", "step4_status")
        workflow.add_edge("step4_status", END)
        
        return workflow.compile()
    
    def _step1_pre_check_coverage(self, state: AgentState) -> AgentState:
        """Step 1: Pre-Check Coverage (Policy Retrieval)"""
        try:
            user_id = state["user_id"]
            
            # Query private namespace for payer information
            payer_query = self.vector_store.query_private(
                query_text="patient insurance plan payer",
                user_id=user_id,
                doc_types=["plan_document"],
                top_k=3
            )
            
            # Extract payer ID from results
            payer_id = None
            if payer_query["matches"]:
                for match in payer_query["matches"]:
                    metadata = match.get("metadata", {})
                    text = metadata.get("text", "").lower()
                    # Try to identify payer from text
                    if "aetna" in text:
                        payer_id = "aetna"
                    elif "medicare" in text:
                        payer_id = "medicare"
                    elif "unitedhealthcare" in text or "uhc" in text:
                        payer_id = "unitedhealthcare"
                    elif "blue cross" in text or "bcbs" in text:
                        payer_id = "bluecross"
                    
                    if payer_id:
                        break
            
            # Query KB for payer policies
            policy_context = ""
            if payer_id:
                policy_query = self.vector_store.query_kb(
                    query_text=f"{payer_id} policy for established patient office visit",
                    top_k=5,
                    filter={
                        "source": {"$eq": "payer_policy"},
                        "payer_id": {"$eq": payer_id}
                    }
                )
                
                if policy_query["matches"]:
                    policy_context = "\n".join([
                        match.get("metadata", {}).get("text", "")
                        for match in policy_query["matches"]
                    ])
            else:
                # Query without payer filter
                policy_query = self.vector_store.query_kb(
                    query_text="insurance policy for office visit",
                    top_k=5,
                    filter={"source": {"$eq": "payer_policy"}}
                )
                
                if policy_query["matches"]:
                    policy_context = "\n".join([
                        match.get("metadata", {}).get("text", "")
                        for match in policy_query["matches"]
                    ])
            
            # Use LLM to process and structure the response
            user_message = f"""Based on the following information, complete Step 1: Pre-Check Coverage.

**Payer Information Found:**
{json.dumps([match.get("metadata", {}) for match in payer_query["matches"]], indent=2)}

**Policy Information Found:**
{policy_context}

**Task:** {state.get("task_description", "Process the claim")}

{STEP_PROMPTS[1]}

Please provide your response in the exact JSON format specified."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                # Try to extract JSON from response
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    state["step1_coverage"] = step_result
                    state["payer_id"] = step_result.get("payer_id") or payer_id
                    state["retrieved_policies"] = policy_query.get("matches", [])
                    state["current_step"] = 1
                else:
                    # Fallback: create structured response
                    state["step1_coverage"] = {
                        "step": 1,
                        "status": "Completed",
                        "payer_id": payer_id or "unknown",
                        "retrieved_policy_context": policy_context
                    }
                    state["payer_id"] = payer_id
                    state["retrieved_policies"] = policy_query.get("matches", [])
            else:
                # Fallback response
                state["step1_coverage"] = {
                    "step": 1,
                    "status": "Completed",
                    "payer_id": payer_id or "unknown",
                    "retrieved_policy_context": policy_context
                }
                state["payer_id"] = payer_id
                state["retrieved_policies"] = policy_query.get("matches", [])
            
            state["current_step"] = 1
            
        except Exception as e:
            state["error"] = f"Step 1 error: {str(e)}"
            state["step1_coverage"] = {
                "step": 1,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step2_assemble_codes(self, state: AgentState) -> AgentState:
        """Step 2: Assemble Codes (RAG-Assisted Coding)"""
        try:
            user_id = state["user_id"]
            doc_id = state.get("doc_id")
            
            # Query private namespace for clinical note
            note_filter = {"doc_id": {"$eq": doc_id}} if doc_id else None
            clinical_note_query = self.vector_store.query_private(
                query_text="clinical note assessment plan",
                user_id=user_id,
                doc_types=["clinical_note"],
                top_k=5,
                additional_filter=note_filter
            )
            
            # Extract clinical note text
            clinical_note_text = ""
            if clinical_note_query["matches"]:
                clinical_note_text = "\n".join([
                    match.get("metadata", {}).get("text", "")
                    for match in clinical_note_query["matches"]
                ])
                state["clinical_note"] = clinical_note_text
            
            # Extract diagnosis and procedure information
            # Query KB for ICD-10 codes
            icd10_query = self.vector_store.query_kb(
                query_text=clinical_note_text or "diagnosis condition",
                top_k=5,
                filter={"source": {"$eq": "icd10_code"}}
            )
            
            # Query KB for CPT codes
            cpt_query = self.vector_store.query_kb(
                query_text=clinical_note_text or "established patient office visit procedure",
                top_k=5,
                filter={"source": {"$eq": "cpt_code"}}
            )
            
            # Use LLM to process and structure the response
            user_message = f"""Based on the following information, complete Step 2: Assemble Codes.

**Clinical Note:**
{clinical_note_text}

**Available ICD-10 Codes:**
{json.dumps([match.get("metadata", {}) for match in icd10_query["matches"]], indent=2)}

**Available CPT Codes:**
{json.dumps([match.get("metadata", {}) for match in cpt_query["matches"]], indent=2)}

**Payer ID:** {state.get("payer_id", "unknown")}

{STEP_PROMPTS[2]}

Please provide your response in the exact JSON format specified."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    state["step2_codes"] = step_result
                    state["suggested_cpt"] = step_result.get("suggested_cpt", [])
                    state["suggested_icd10"] = step_result.get("suggested_icd10", [])
                else:
                    # Fallback: create structured response from query results
                    state["step2_codes"] = {
                        "step": 2,
                        "status": "Completed",
                        "suggested_cpt": [
                            {
                                "code": match.get("metadata", {}).get("code", ""),
                                "justification": match.get("metadata", {}).get("description", "")
                            }
                            for match in cpt_query["matches"][:3]
                        ],
                        "suggested_icd10": [
                            {
                                "code": match.get("metadata", {}).get("code", ""),
                                "justification": match.get("metadata", {}).get("description", "")
                            }
                            for match in icd10_query["matches"][:3]
                        ]
                    }
                    state["suggested_cpt"] = state["step2_codes"]["suggested_cpt"]
                    state["suggested_icd10"] = state["step2_codes"]["suggested_icd10"]
            else:
                # Fallback response
                state["step2_codes"] = {
                    "step": 2,
                    "status": "Completed",
                    "suggested_cpt": [
                        {
                            "code": match.get("metadata", {}).get("code", ""),
                            "justification": match.get("metadata", {}).get("description", "")
                        }
                        for match in cpt_query["matches"][:3]
                    ],
                    "suggested_icd10": [
                        {
                            "code": match.get("metadata", {}).get("code", ""),
                            "justification": match.get("metadata", {}).get("description", "")
                        }
                        for match in icd10_query["matches"][:3]
                    ]
                }
            
            state["current_step"] = 2
            
        except Exception as e:
            state["error"] = f"Step 2 error: {str(e)}"
            state["step2_codes"] = {
                "step": 2,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step3_generate_claim(self, state: AgentState) -> AgentState:
        """Step 3: Generate Clean Claim (Validation & Scrubbing)"""
        try:
            payer_id = state.get("payer_id")
            suggested_cpt = state.get("suggested_cpt", [])
            suggested_icd10 = state.get("suggested_icd10", [])
            
            # Extract codes
            cpt_codes = [code.get("code") for code in suggested_cpt if code.get("code")]
            icd10_codes = [code.get("code") for code in suggested_icd10 if code.get("code")]
            
            # Check for conflicts with payer policies
            validation_notes = []
            if payer_id and cpt_codes and icd10_codes:
                # Query for policy conflicts
                conflict_query = self.vector_store.query_kb(
                    query_text=f"{payer_id} coverage rules for CPT {cpt_codes[0] if cpt_codes else ''} with ICD-10 {icd10_codes[0] if icd10_codes else ''}",
                    top_k=3,
                    filter={
                        "source": {"$eq": "payer_policy"},
                        "payer_id": {"$eq": payer_id}
                    }
                )
                
                if conflict_query["matches"]:
                    validation_notes.append("Policy information found. Reviewing for conflicts...")
                    for match in conflict_query["matches"]:
                        policy_text = match.get("metadata", {}).get("text", "")
                        validation_notes.append(f"Policy: {policy_text}")
                else:
                    validation_notes.append("No specific policy conflicts found for this code combination.")
            
            # Use LLM to process and structure the response
            user_message = f"""Based on the following information, complete Step 3: Generate Clean Claim.

**Payer ID:** {payer_id or "unknown"}
**Suggested CPT Codes:** {json.dumps(suggested_cpt, indent=2)}
**Suggested ICD-10 Codes:** {json.dumps(suggested_icd10, indent=2)}
**User ID:** {state["user_id"]}
**Validation Notes:** {chr(10).join(validation_notes)}

{STEP_PROMPTS[3]}

Please provide your response in the exact JSON format specified."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    state["step3_claim"] = step_result
                else:
                    # Fallback: create structured response
                    state["step3_claim"] = {
                        "step": 3,
                        "status": "Clean",
                        "claim_json": {
                            "payer_id": payer_id or "unknown",
                            "user_id": state["user_id"],
                            "cpt_codes": cpt_codes,
                            "icd10_codes": icd10_codes,
                            "validation_notes": "; ".join(validation_notes) if validation_notes else "No policy conflicts found."
                        }
                    }
            else:
                # Fallback response
                state["step3_claim"] = {
                    "step": 3,
                    "status": "Clean",
                    "claim_json": {
                        "payer_id": payer_id or "unknown",
                        "user_id": state["user_id"],
                        "cpt_codes": cpt_codes,
                        "icd10_codes": icd10_codes,
                        "validation_notes": "; ".join(validation_notes) if validation_notes else "No policy conflicts found."
                    }
                }
            
            state["current_step"] = 3
            
        except Exception as e:
            state["error"] = f"Step 3 error: {str(e)}"
            state["step3_claim"] = {
                "step": 3,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step4_monitor_status(self, state: AgentState) -> AgentState:
        """Step 4: Monitor Status"""
        try:
            # Use LLM to process and structure the response
            user_message = f"""Based on the completed workflow, complete Step 4: Monitor Status.

**Previous Steps:**
- Step 1 (Coverage): {json.dumps(state.get("step1_coverage", {}), indent=2)}
- Step 2 (Codes): {json.dumps(state.get("step2_codes", {}), indent=2)}
- Step 3 (Claim): {json.dumps(state.get("step3_claim", {}), indent=2)}

{STEP_PROMPTS[4]}

Please provide your response in the exact JSON format specified."""
            
            messages = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
            
            response = self.llm_client.chat(messages)
            
            # Parse LLM response
            if response and "choices" in response:
                content = response["choices"][0]["message"]["content"]
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    state["step4_status"] = step_result
                else:
                    # Fallback: create structured response
                    state["step4_status"] = {
                        "step": 4,
                        "status": "Submitted",
                        "monitoring_note": "Awaiting EOB from payer."
                    }
            else:
                # Fallback response
                state["step4_status"] = {
                    "step": 4,
                    "status": "Submitted",
                    "monitoring_note": "Awaiting EOB from payer."
                }
            
            # Compile final result
            state["final_result"] = {
                "workflow_completed": True,
                "steps": {
                    "step1": state.get("step1_coverage", {}),
                    "step2": state.get("step2_codes", {}),
                    "step3": state.get("step3_claim", {}),
                    "step4": state.get("step4_status", {})
                },
                "user_id": state["user_id"],
                "payer_id": state.get("payer_id"),
                "claim": state.get("step3_claim", {}).get("claim_json", {})
            }
            
            state["current_step"] = 4
            
        except Exception as e:
            state["error"] = f"Step 4 error: {str(e)}"
            state["step4_status"] = {
                "step": 4,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _extract_json_from_response(self, content: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from LLM response"""
        try:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            else:
                # Try parsing the entire content as JSON
                return json.loads(content)
        except Exception:
            return None
    
    def process_claim(
        self,
        user_id: str,
        doc_id: Optional[str] = None,
        doc_type: Optional[str] = None,
        task_description: str = "Process the claim"
    ) -> Dict[str, Any]:
        """
        Process a claim using the 4-step workflow
        
        Args:
            user_id: User identifier
            doc_id: Document ID (optional)
            doc_type: Document type (optional)
            task_description: Task description
            
        Returns:
            Final workflow result
        """
        # Initialize state
        initial_state: AgentState = {
            "user_id": user_id,
            "doc_id": doc_id,
            "doc_type": doc_type,
            "task_description": task_description,
            "step1_coverage": None,
            "step2_codes": None,
            "step3_claim": None,
            "step4_status": None,
            "current_step": 0,
            "payer_id": None,
            "retrieved_policies": [],
            "clinical_note": None,
            "suggested_cpt": [],
            "suggested_icd10": [],
            "final_result": None,
            "error": None
        }
        
        # Run the workflow
        try:
            final_state = self.workflow.invoke(initial_state)
            return final_state.get("final_result", final_state)
        except Exception as e:
            return {
                "workflow_completed": False,
                "error": str(e),
                "state": initial_state
            }


# ==================== EXAMPLE USAGE ====================

if __name__ == "__main__":
    # Initialize agent
    agent = ClaimsAgent()
    
    # Process a claim
    print("=" * 60)
    print("CLAIMS PROCESSING AGENT - EXAMPLE")
    print("=" * 60)
    
    result = agent.process_claim(
        user_id="user-123",
        doc_id="note-abc-456",
        doc_type="clinical_note",
        task_description="A new clinical note has been uploaded. Please process the claim."
    )
    
    print("\n" + "=" * 60)
    print("WORKFLOW RESULT")
    print("=" * 60)
    print(json.dumps(result, indent=2))

