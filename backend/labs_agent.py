"""
Labs Processing Agent using LangGraph and K2 API

This module implements a LangGraph-based agent that processes lab reports
using a workflow with RAG queries to PineconeVectorStore.

MIRRORS the exact structure and patterns from claims_agent.py
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

class LabAgentState(TypedDict):
    """State for the Labs Processing Agent - mirrors AgentState from claims_agent"""
    # Input
    user_id: str
    doc_id: Optional[str]
    doc_type: Optional[str]
    task_description: str
    
    # Step outputs
    step1_retrieval: Optional[Dict[str, Any]]
    step2_analysis: Optional[Dict[str, Any]]
    step3_knowledge: Optional[Dict[str, Any]]
    step4_insights: Optional[Dict[str, Any]]
    
    # Workflow state
    current_step: int
    retrieved_lab_report: Optional[str]
    lab_results: List[Dict[str, Any]]
    test_definitions: List[Dict[str, Any]]
    coverage_info: List[Dict[str, Any]]
    
    # Final output
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]


# ==================== SYSTEM PROMPTS ====================

MASTER_SYSTEM_PROMPT = """You are 'CarePilot-Labs', an expert AI agent for Lab Report Analysis.

Your sole purpose is to process lab reports by executing a precise workflow.

**Your Tools:**
You have access to a PineconeVectorStore instance with two primary methods:

1. `store.query_kb(query_text: str, top_k: int, filter: dict) -> dict`: Queries the shared 'kb' namespace. This namespace contains:
   - `source: "lab_test_definition"`
   - `source: "payer_policy"` (with metadata: `payer_id`)
   - `source: "cpt_code"`
   - `source: "icd10_code"`

2. `store.query_private(query_text: str, user_id: str, doc_types: list, top_k: int) -> dict`: Queries the secure 'private' namespace. This namespace contains:
   - `doc_type: "lab_report"`

**Your Constraints:**
- **NEVER** query the 'private' namespace without a specific `user_id`.
- **NEVER** confuse 'kb' data (general rules) with 'private' data (a user's specific history).
- You must perform the workflow steps **in order**.
- Your output for each step must be a structured JSON object.

**Workflow Steps:**
1. Retrieve Lab Report
2. Analyze Results
3. Query Knowledge Base
4. Generate Insights

Always think step by step, query the vector store when needed, and provide structured JSON outputs."""


STEP_PROMPTS = {
    1: """**Step 1: Retrieve Lab Report**

**Thought:** I must retrieve the user's lab report from the private namespace.

**Your Task:**
1. Query private namespace for lab reports
2. Extract lab results and parameters
3. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 1,
  "status": "Completed",
  "retrieved_lab_report": "Lab report text...",
  "lab_results": [
    {{"parameter": "Glucose", "value": "95", "unit": "mg/dL", "referenceRange": "70-100"}}
  ]
}}
```""",

    2: """**Step 2: Analyze Results**

**Thought:** I must analyze the lab results to identify any abnormal values or trends.

**Your Task:**
1. Identify parameters outside normal ranges
2. Flag any concerning values
3. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 2,
  "status": "Completed",
  "analysis": {{
    "normal_count": 3,
    "abnormal_count": 1,
    "flagged_parameters": ["LDL Cholesterol"]
  }}
}}
```
""",

    3: """**Step 3: Query Knowledge Base**

**Thought:** I must query the knowledge base to get test definitions, normal ranges, clinical significance, and coverage information for the lab tests found.

**Your Task:**
1. Query KB for lab test definitions for each analyte found
2. Query KB for coverage/authorization rules if applicable
3. Query KB for CPT/LOINC codes if needed
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 3,
  "status": "Completed",
  "test_definitions": [
    {{
      "analyte": "A1C",
      "description": "Hemoglobin A1C measures average blood glucose over 2-3 months",
      "normal_range": "4.0-5.7%",
      "clinical_significance": "Used to diagnose and monitor diabetes"
    }}
  ],
  "coverage_info": [
    {{
      "analyte": "A1C",
      "covered": true,
      "frequency": "Every 3 months for diabetics"
    }}
  ]
}}
```
""",

    4: """**Step 4: Generate Insights**

**Thought:** I will now compile all the information to generate actionable insights for the user.

**Your Task:**
1. Compile analysis from previous steps
2. Generate plain-English insights
3. Suggest questions for the clinician
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 4,
  "status": "Completed",
  "insights": "Your LDL cholesterol is slightly elevated...",
  "suggested_questions": [
    "Should I be concerned about my LDL cholesterol level?",
    "What lifestyle changes can help lower my cholesterol?"
  ]
}}
```
"""
}


# ==================== LABS AGENT CLASS ====================

class LabsAgent:
    """Labs Processing Agent using LangGraph and K2 API - mirrors ClaimsAgent structure"""
    
    def __init__(
        self,
        vector_store: Optional[PineconeVectorStore] = None,
        llm_client: Optional[K2APIClient] = None
    ):
        """
        Initialize Labs Agent
        
        Args:
            vector_store: PineconeVectorStore instance
            llm_client: K2APIClient instance
        """
        if not LANGGRAPH_AVAILABLE:
            raise ImportError(
                "LangGraph is required for LabsAgent. "
                "Install with: pip install langgraph"
            )
        
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
        
        # Build the workflow graph
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow - mirrors claims agent structure"""
        workflow = StateGraph(LabAgentState)
        
        # Add nodes
        workflow.add_node("step1_retrieval", self._step1_retrieve_lab_report)
        workflow.add_node("step2_analysis", self._step2_analyze_results)
        workflow.add_node("step3_knowledge", self._step3_query_knowledge)
        workflow.add_node("step4_insights", self._step4_generate_insights)
        
        # Define edges
        workflow.set_entry_point("step1_retrieval")
        workflow.add_edge("step1_retrieval", "step2_analysis")
        workflow.add_edge("step2_analysis", "step3_knowledge")
        workflow.add_edge("step3_knowledge", "step4_insights")
        workflow.add_edge("step4_insights", END)
        
        return workflow.compile()
    
    def _step1_retrieve_lab_report(self, state: LabAgentState) -> LabAgentState:
        """Step 1: Retrieve Lab Report - mirrors claims step1 pattern"""
        try:
            user_id = state["user_id"]
            doc_id = state.get("doc_id")
            
            # Build query text
            query_text = "lab report test results values"
            
            # Build filter for doc_id if provided
            additional_filter = None
            if doc_id:
                additional_filter = {"doc_id": {"$eq": doc_id}}
            
            # Query private namespace for lab reports - EXACT same pattern as claims
            lab_report_query = self.vector_store.query_private(
                query_text=query_text,
                user_id=user_id,
                doc_types=["lab_report"],
                top_k=10,
                additional_filter=additional_filter
            )
            
            # Extract lab report text
            lab_report_text = ""
            if lab_report_query["matches"]:
                lab_report_text = "\n".join([
                    match.get("metadata", {}).get("text", "")
                    for match in lab_report_query["matches"]
                ])
                state["retrieved_lab_report"] = lab_report_text
            
            # Use LLM to extract structured data from lab report
            user_message = f"""Based on the following lab report, complete Step 1: Retrieve Lab Report.

**Lab Report Text:**
{lab_report_text}

**Task:** {state.get("task_description", "Process the lab report")}

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
                step_result = self._extract_json_from_response(content)
                
                if step_result:
                    state["step1_retrieval"] = step_result
                    state["lab_results"] = step_result.get("lab_results", [])
                else:
                    # Fallback: create structured response
                    state["step1_retrieval"] = {
                        "step": 1,
                        "status": "Completed",
                        "retrieved_lab_report": lab_report_text,
                        "lab_results": []
                    }
            else:
                # Fallback response
                state["step1_retrieval"] = {
                    "step": 1,
                    "status": "Completed",
                    "retrieved_lab_report": lab_report_text,
                    "lab_results": []
                }
            
            state["current_step"] = 1
            
        except Exception as e:
            state["error"] = f"Step 1 error: {str(e)}"
            state["step1_retrieval"] = {
                "step": 1,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step2_analyze_results(self, state: LabAgentState) -> LabAgentState:
        """Step 2: Analyze Results - mirrors claims step2 pattern"""
        try:
            lab_results = state.get("lab_results", [])
            
            # Use LLM to analyze results
            user_message = f"""Based on the following lab results, complete Step 2: Analyze Results.

**Lab Results:**
{json.dumps(lab_results, indent=2)}

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
                    state["step2_analysis"] = step_result
                else:
                    # Fallback
                    state["step2_analysis"] = {
                        "step": 2,
                        "status": "Completed",
                        "analysis": {"normal_count": 0, "abnormal_count": 0, "flagged_parameters": []}
                    }
            else:
                state["step2_analysis"] = {
                    "step": 2,
                    "status": "Completed",
                    "analysis": {"normal_count": 0, "abnormal_count": 0, "flagged_parameters": []}
                }
            
            state["current_step"] = 2
            
        except Exception as e:
            state["error"] = f"Step 2 error: {str(e)}"
            state["step2_analysis"] = {
                "step": 2,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step3_query_knowledge(self, state: LabAgentState) -> LabAgentState:
        """Step 3: Query Knowledge Base - mirrors claims step3 pattern"""
        try:
            lab_results = state.get("lab_results", [])
            
            # Extract parameter names
            parameter_names = [result.get("parameter", "") for result in lab_results if result.get("parameter")]
            
            # Query KB for lab test definitions - EXACT same pattern as claims KB queries
            test_definitions = []
            for param_name in parameter_names:
                definition_query = self.vector_store.query_kb(
                    query_text=f"{param_name} lab test definition normal range",
                    top_k=3,
                    filter={"source": {"$eq": "lab_test_definition"}}
                )
                
                if definition_query["matches"]:
                    for match in definition_query["matches"]:
                        metadata = match.get("metadata", {})
                        test_definitions.append({
                            "analyte": param_name,
                            "description": metadata.get("definition", metadata.get("text", "")),
                            "normal_range": metadata.get("normal_range", ""),
                            "clinical_significance": metadata.get("clinical_significance", "")
                        })
            
            # Query KB for coverage info
            coverage_info = []
            coverage_query = self.vector_store.query_kb(
                query_text="lab test coverage authorization policy",
                top_k=5,
                filter={"source": {"$eq": "payer_policy"}}
            )
            
            if coverage_query["matches"]:
                for match in coverage_query["matches"]:
                    metadata = match.get("metadata", {})
                    coverage_info.append({
                        "analyte": parameter_names[0] if parameter_names else "unknown",
                        "covered": True,
                        "frequency": metadata.get("text", "")
                    })
            
            # Use LLM to structure response
            user_message = f"""Based on the following information, complete Step 3: Query Knowledge Base.

**Lab Results:**
{json.dumps(lab_results, indent=2)}

**Test Definitions Found:**
{json.dumps(test_definitions, indent=2)}

**Coverage Info Found:**
{json.dumps(coverage_info, indent=2)}

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
                    state["step3_knowledge"] = step_result
                    state["test_definitions"] = step_result.get("test_definitions", test_definitions)
                    state["coverage_info"] = step_result.get("coverage_info", coverage_info)
                else:
                    # Fallback
                    state["step3_knowledge"] = {
                        "step": 3,
                        "status": "Completed",
                        "test_definitions": test_definitions,
                        "coverage_info": coverage_info
                    }
                    state["test_definitions"] = test_definitions
                    state["coverage_info"] = coverage_info
            else:
                state["step3_knowledge"] = {
                    "step": 3,
                    "status": "Completed",
                    "test_definitions": test_definitions,
                    "coverage_info": coverage_info
                }
                state["test_definitions"] = test_definitions
                state["coverage_info"] = coverage_info
            
            state["current_step"] = 3
            
        except Exception as e:
            state["error"] = f"Step 3 error: {str(e)}"
            state["step3_knowledge"] = {
                "step": 3,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _step4_generate_insights(self, state: LabAgentState) -> LabAgentState:
        """Step 4: Generate Insights - mirrors claims step4 pattern"""
        try:
            # Use LLM to process and structure the response
            user_message = f"""Based on the completed workflow, complete Step 4: Generate Insights.

**Previous Steps:**
- Step 1 (Retrieval): {json.dumps(state.get("step1_retrieval", {}), indent=2)}
- Step 2 (Analysis): {json.dumps(state.get("step2_analysis", {}), indent=2)}
- Step 3 (Knowledge): {json.dumps(state.get("step3_knowledge", {}), indent=2)}

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
                    state["step4_insights"] = step_result
                else:
                    # Fallback
                    state["step4_insights"] = {
                        "step": 4,
                        "status": "Completed",
                        "insights": "Lab report analysis completed.",
                        "suggested_questions": []
                    }
            else:
                state["step4_insights"] = {
                    "step": 4,
                    "status": "Completed",
                    "insights": "Lab report analysis completed.",
                    "suggested_questions": []
                }
            
            # Compile final result - EXACT same structure as claims agent
            state["final_result"] = {
                "workflow_completed": True,
                "steps": {
                    "step1": state.get("step1_retrieval", {}),
                    "step2": state.get("step2_analysis", {}),
                    "step3": state.get("step3_knowledge", {}),
                    "step4": state.get("step4_insights", {})
                },
                "user_id": state["user_id"],
                "lab_results": state.get("lab_results", []),
                "test_definitions": state.get("test_definitions", []),
                "coverage_info": state.get("coverage_info", [])
            }
            
            state["current_step"] = 4
            
        except Exception as e:
            state["error"] = f"Step 4 error: {str(e)}"
            state["step4_insights"] = {
                "step": 4,
                "status": "Error",
                "error": str(e)
            }
        
        return state
    
    def _extract_json_from_response(self, content: str) -> Optional[Dict[str, Any]]:
        """Extract JSON from LLM response - EXACT same method as claims agent"""
        try:
            import re
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                return json.loads(json_str)
            else:
                return json.loads(content)
        except Exception:
            return None
    
    def process_lab(
        self,
        user_id: str,
        doc_id: Optional[str] = None,
        doc_type: Optional[str] = None,
        task_description: str = "Process the lab report"
    ) -> Dict[str, Any]:
        """
        Process a lab report using the workflow - mirrors claims agent.process_claim()
        
        Args:
            user_id: User identifier
            doc_id: Document ID (optional)
            doc_type: Document type (optional)
            task_description: Task description
            
        Returns:
            Final workflow result
        """
        # Initialize state - EXACT same structure as claims agent
        initial_state: LabAgentState = {
            "user_id": user_id,
            "doc_id": doc_id,
            "doc_type": doc_type or "lab_report",
            "task_description": task_description,
            "step1_retrieval": None,
            "step2_analysis": None,
            "step3_knowledge": None,
            "step4_insights": None,
            "current_step": 0,
            "retrieved_lab_report": None,
            "lab_results": [],
            "test_definitions": [],
            "coverage_info": [],
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
    agent = LabsAgent()
    
    # Process a lab report
    print("=" * 60)
    print("LABS PROCESSING AGENT - EXAMPLE")
    print("=" * 60)
    
    result = agent.process_lab(
        user_id="user-123",
        doc_id="lab-abc-456",
        doc_type="lab_report",
        task_description="A new lab report has been uploaded. Please analyze the results."
    )
    
    print("\n" + "=" * 60)
    print("WORKFLOW RESULT")
    print("=" * 60)
    print(json.dumps(result, indent=2))

