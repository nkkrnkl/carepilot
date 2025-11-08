"""
Lab Report Analysis Agent using LangGraph and K2 API

This module implements a LangGraph-based agent that analyzes lab reports
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

class LabAgentState(TypedDict):
    """State for the Lab Report Analysis Agent"""
    # Input
    user_id: str
    doc_id: Optional[str]
    doc_type: Optional[str]
    task_description: str
    analyte: Optional[str]  # Specific analyte to analyze (optional)
    
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

MASTER_SYSTEM_PROMPT = """You are 'CarePilot-Lab', an expert AI agent for Lab Report Analysis.

Your sole purpose is to analyze medical lab reports by executing a precise four-step workflow.

**Your Tools:**
You have access to a PineconeVectorStore instance with two primary methods:

1. `store.query_kb(query_text: str, top_k: int, filter: dict) -> dict`: Queries the shared 'kb' namespace. This namespace contains:
   - `source: "lab_test_definition"` (with metadata: `analyte`, `description`, `normal_range`, `clinical_significance`)
   - `source: "payer_policy"` (with metadata: `payer_id`, `coverage_rules`)
   - `source: "cpt_code"` (lab test CPT codes)
   - `source: "loinc_code"` (LOINC codes for lab tests)

2. `store.query_private(query_text: str, user_id: str, doc_types: list, top_k: int) -> dict`: Queries the secure 'private' namespace. This namespace contains:
   - `doc_type: "lab_report"` (with metadata: `text`, `chunk_index`, `doc_id`, `date_iso`, `analyte`, `value_num`, `value_raw`, `unit`, `ref_low`, `ref_high`, `flag`)

**Your Constraints:**
- **NEVER** query the 'private' namespace without a specific `user_id`.
- **NEVER** confuse 'kb' data (general lab test definitions) with 'private' data (a user's specific lab results).
- You must perform the following 4 steps **in order**.
- Your output for each step must be a structured JSON object.

**Workflow Steps:**
1. Retrieve Lab Report (Extract user's lab data)
2. Analyze Results (Identify abnormal values, trends, flags)
3. Query Knowledge Base (Get test definitions and coverage)
4. Generate Insights (Provide recommendations and explanations)

Always think step by step, query the vector store when needed, and provide structured JSON outputs."""


STEP_PROMPTS = {
    1: """**Step 1: Retrieve Lab Report**

**Thought:** I must retrieve the user's lab report data from the private namespace. If a specific analyte is requested, I should focus on that.

**Your Task:**
1. Query the private namespace for lab reports matching the user_id and doc_id (if provided)
2. If analyte is specified, filter for that specific analyte
3. Extract all lab results with their values, units, reference ranges, and flags
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 1,
  "status": "Completed",
  "report_count": 1,
  "results_found": 5,
  "lab_results": [
    {{
      "analyte": "A1C",
      "value": 6.5,
      "unit": "%",
      "ref_low": 4.0,
      "ref_high": 5.7,
      "flag": "H",
      "date_iso": "2025-01-15"
    }}
  ]
}}
```""",

    2: """**Step 2: Analyze Results**

**Thought:** I must analyze the retrieved lab results to identify abnormal values, trends, and clinical significance.

**Your Task:**
1. Identify which results are outside normal ranges (flagged as H/L/High/Low)
2. Assess the clinical significance of abnormal values
3. Note any patterns or trends if multiple results exist
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 2,
  "status": "Completed",
  "abnormal_count": 2,
  "abnormal_results": [
    {{
      "analyte": "A1C",
      "value": 6.5,
      "flag": "H",
      "clinical_significance": "Elevated A1C indicates prediabetes or diabetes",
      "severity": "moderate"
    }}
  ],
  "summary": "2 out of 5 results are outside normal ranges"
}}
```""",

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
```""",

    4: """**Step 4: Generate Insights**

**Thought:** I will now synthesize all the information to provide actionable insights, recommendations, and explanations for the user.

**Your Task:**
1. Combine lab results, analysis, and knowledge base information
2. Provide clear explanations of what each abnormal result means
3. Suggest next steps or recommendations
4. Return a structured JSON response

**Expected Output Format:**
```json
{{
  "step": 4,
  "status": "Completed",
  "insights": [
    {{
      "analyte": "A1C",
      "summary": "Your A1C level of 6.5% is elevated, indicating prediabetes",
      "explanation": "A1C measures your average blood sugar over the past 2-3 months. A level of 6.5% suggests prediabetes.",
      "recommendation": "Consider lifestyle modifications including diet and exercise. Follow up with your doctor in 3 months for repeat testing.",
      "urgency": "moderate"
    }}
  ],
  "overall_summary": "Your lab results show 2 abnormal values requiring attention."
}}
```"""
}


# ==================== LAB AGENT CLASS ====================

class LabAgent:
    """Lab Report Analysis Agent using LangGraph and K2 API"""
    
    def __init__(
        self,
        vector_store: Optional[PineconeVectorStore] = None,
        llm_client: Optional[K2APIClient] = None
    ):
        """
        Initialize Lab Agent
        
        Args:
            vector_store: PineconeVectorStore instance
            llm_client: K2APIClient instance
        """
        if not LANGGRAPH_AVAILABLE:
            raise ImportError(
                "LangGraph is required for LabAgent. "
                "Install with: pip install langgraph"
            )
        
        self.vector_store = vector_store or PineconeVectorStore()
        self.llm_client = llm_client or K2APIClient()
        
        # Build the workflow graph
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow"""
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
        """Step 1: Retrieve Lab Report"""
        try:
            user_id = state["user_id"]
            doc_id = state.get("doc_id")
            analyte = state.get("analyte")
            
            # Build query text
            if analyte:
                query_text = f"lab report {analyte} test result"
            else:
                query_text = "lab report test results values"
            
            # Build filter for doc_id if provided
            additional_filter = None
            if doc_id:
                additional_filter = {"doc_id": {"$eq": doc_id}}
            
            # Query private namespace for lab reports
            lab_report_query = self.vector_store.query_private(
                query_text=query_text,
                user_id=user_id,
                doc_types=["lab_report"],
                top_k=10,
                additional_filter=additional_filter
            )
            
            # Extract lab results from matches
            lab_results = []
            report_texts = []
            
            if lab_report_query.get("matches"):
                for match in lab_report_query["matches"]:
                    metadata = match.get("metadata", {})
                    
                    # Check if this is a lab result (has analyte) or a report chunk (has text)
                    if metadata.get("analyte"):
                        # This is a specific lab result
                        result = {
                            "analyte": metadata.get("analyte"),
                            "value_num": metadata.get("value_num"),
                            "value_raw": metadata.get("value_raw"),
                            "unit": metadata.get("unit"),
                            "ref_low": metadata.get("ref_low"),
                            "ref_high": metadata.get("ref_high"),
                            "flag": metadata.get("flag"),
                            "date_iso": metadata.get("date_iso"),
                            "doc_id": metadata.get("doc_id")
                        }
                        lab_results.append(result)
                    elif metadata.get("text"):
                        # This is a report chunk
                        report_texts.append(metadata.get("text", ""))
            
            # Combine report text
            combined_report_text = "\n\n".join(report_texts)
            
            # Use LLM to process and structure the response
            user_message = f"""Based on the following information, complete Step 1: Retrieve Lab Report.

**Lab Report Data Found:**
{json.dumps(lab_results, indent=2) if lab_results else "No structured lab results found"}

**Report Text Chunks:**
{combined_report_text[:2000] if combined_report_text else "No report text found"}

**Task:** {state.get("task_description", "Analyze the lab report")}
**Analyte Filter:** {analyte or "None (analyze all)"}

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
                else:
                    # Fallback: create structured response
                    state["step1_retrieval"] = {
                        "step": 1,
                        "status": "Completed",
                        "report_count": len(set([r.get("doc_id") for r in lab_results if r.get("doc_id")])),
                        "results_found": len(lab_results),
                        "lab_results": lab_results
                    }
            else:
                # Fallback response
                state["step1_retrieval"] = {
                    "step": 1,
                    "status": "Completed",
                    "report_count": len(set([r.get("doc_id") for r in lab_results if r.get("doc_id")])),
                    "results_found": len(lab_results),
                    "lab_results": lab_results
                }
            
            # Store in state
            state["retrieved_lab_report"] = combined_report_text
            state["lab_results"] = lab_results
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
        """Step 2: Analyze Results"""
        try:
            lab_results = state.get("lab_results", [])
            
            # Use LLM to process and structure the response
            user_message = f"""Based on the following lab results, complete Step 2: Analyze Results.

**Lab Results:**
{json.dumps(lab_results, indent=2)}

**Previous Step Output:**
{json.dumps(state.get("step1_retrieval", {}), indent=2)}

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
                    # Fallback: analyze manually
                    abnormal_results = [
                        r for r in lab_results 
                        if r.get("flag") in ["H", "L", "High", "Low", "↑", "↓"]
                    ]
                    state["step2_analysis"] = {
                        "step": 2,
                        "status": "Completed",
                        "abnormal_count": len(abnormal_results),
                        "abnormal_results": abnormal_results,
                        "summary": f"{len(abnormal_results)} out of {len(lab_results)} results are outside normal ranges"
                    }
            else:
                # Fallback response
                abnormal_results = [
                    r for r in lab_results 
                    if r.get("flag") in ["H", "L", "High", "Low", "↑", "↓"]
                ]
                state["step2_analysis"] = {
                    "step": 2,
                    "status": "Completed",
                    "abnormal_count": len(abnormal_results),
                    "abnormal_results": abnormal_results,
                    "summary": f"{len(abnormal_results)} out of {len(lab_results)} results are outside normal ranges"
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
        """Step 3: Query Knowledge Base"""
        try:
            lab_results = state.get("lab_results", [])
            abnormal_results = state.get("step2_analysis", {}).get("abnormal_results", [])
            
            # Get unique analytes
            analytes = list(set([
                r.get("analyte") for r in lab_results 
                if r.get("analyte")
            ]))
            
            # Query KB for test definitions
            test_definitions = []
            for analyte in analytes:
                definition_query = self.vector_store.query_kb(
                    query_text=f"{analyte} lab test definition normal range clinical significance",
                    top_k=3,
                    filter={"source": {"$eq": "lab_test_definition"}}
                )
                
                if definition_query.get("matches"):
                    for match in definition_query["matches"]:
                        metadata = match.get("metadata", {})
                        if metadata.get("analyte") == analyte or analyte.lower() in str(metadata.get("text", "")).lower():
                            test_definitions.append({
                                "analyte": analyte,
                                "description": metadata.get("description") or metadata.get("text", ""),
                                "normal_range": metadata.get("normal_range", ""),
                                "clinical_significance": metadata.get("clinical_significance", "")
                            })
                            break
            
            # Query KB for coverage information
            coverage_info = []
            for analyte in analytes:
                coverage_query = self.vector_store.query_kb(
                    query_text=f"{analyte} lab test coverage authorization insurance",
                    top_k=3,
                    filter={"source": {"$eq": "payer_policy"}}
                )
                
                if coverage_query.get("matches"):
                    for match in coverage_query["matches"]:
                        metadata = match.get("metadata", {})
                        coverage_info.append({
                            "analyte": analyte,
                            "covered": True,
                            "policy_text": metadata.get("text", "")
                        })
                        break
            
            # Use LLM to process and structure the response
            user_message = f"""Based on the following information, complete Step 3: Query Knowledge Base.

**Lab Results:**
{json.dumps(lab_results, indent=2)}

**Test Definitions Found:**
{json.dumps(test_definitions, indent=2)}

**Coverage Information Found:**
{json.dumps(coverage_info, indent=2)}

**Previous Steps:**
- Step 1: {json.dumps(state.get("step1_retrieval", {}), indent=2)}
- Step 2: {json.dumps(state.get("step2_analysis", {}), indent=2)}

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
                else:
                    # Fallback: create structured response
                    state["step3_knowledge"] = {
                        "step": 3,
                        "status": "Completed",
                        "test_definitions": test_definitions,
                        "coverage_info": coverage_info
                    }
            else:
                # Fallback response
                state["step3_knowledge"] = {
                    "step": 3,
                    "status": "Completed",
                    "test_definitions": test_definitions,
                    "coverage_info": coverage_info
                }
            
            # Store in state
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
        """Step 4: Generate Insights"""
        try:
            # Use LLM to process and structure the response
            user_message = f"""Based on the completed workflow, complete Step 4: Generate Insights.

**Previous Steps:**
- Step 1 (Retrieval): {json.dumps(state.get("step1_retrieval", {}), indent=2)}
- Step 2 (Analysis): {json.dumps(state.get("step2_analysis", {}), indent=2)}
- Step 3 (Knowledge): {json.dumps(state.get("step3_knowledge", {}), indent=2)}

**Lab Results:**
{json.dumps(state.get("lab_results", []), indent=2)}

**Test Definitions:**
{json.dumps(state.get("test_definitions", []), indent=2)}

**Coverage Information:**
{json.dumps(state.get("coverage_info", []), indent=2)}

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
                    # Fallback: create structured response
                    abnormal_results = state.get("step2_analysis", {}).get("abnormal_results", [])
                    insights = []
                    for result in abnormal_results:
                        analyte = result.get("analyte", "Unknown")
                        value = result.get("value_num") or result.get("value_raw", "N/A")
                        flag = result.get("flag", "")
                        
                        insights.append({
                            "analyte": analyte,
                            "summary": f"Your {analyte} level of {value} is {flag.lower()}",
                            "explanation": f"The {analyte} test result is outside the normal range.",
                            "recommendation": "Please consult with your healthcare provider for further evaluation.",
                            "urgency": "moderate"
                        })
                    
                    state["step4_insights"] = {
                        "step": 4,
                        "status": "Completed",
                        "insights": insights,
                        "overall_summary": f"Your lab results show {len(abnormal_results)} abnormal values requiring attention."
                    }
            else:
                # Fallback response
                abnormal_results = state.get("step2_analysis", {}).get("abnormal_results", [])
                insights = []
                for result in abnormal_results:
                    analyte = result.get("analyte", "Unknown")
                    value = result.get("value_num") or result.get("value_raw", "N/A")
                    flag = result.get("flag", "")
                    
                    insights.append({
                        "analyte": analyte,
                        "summary": f"Your {analyte} level of {value} is {flag.lower()}",
                        "explanation": f"The {analyte} test result is outside the normal range.",
                        "recommendation": "Please consult with your healthcare provider for further evaluation.",
                        "urgency": "moderate"
                    })
                
                state["step4_insights"] = {
                    "step": 4,
                    "status": "Completed",
                    "insights": insights,
                    "overall_summary": f"Your lab results show {len(abnormal_results)} abnormal values requiring attention."
                }
            
            # Compile final result
            state["final_result"] = {
                "workflow_completed": True,
                "steps": {
                    "step1": state.get("step1_retrieval", {}),
                    "step2": state.get("step2_analysis", {}),
                    "step3": state.get("step3_knowledge", {}),
                    "step4": state.get("step4_insights", {})
                },
                "user_id": state["user_id"],
                "doc_id": state.get("doc_id"),
                "insights": state.get("step4_insights", {}).get("insights", [])
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
    
    def analyze_lab_report(
        self,
        user_id: str,
        doc_id: Optional[str] = None,
        doc_type: Optional[str] = None,
        analyte: Optional[str] = None,
        task_description: str = "Analyze the lab report"
    ) -> Dict[str, Any]:
        """
        Analyze a lab report using the 4-step workflow
        
        Args:
            user_id: User identifier
            doc_id: Document ID (optional, to analyze specific report)
            doc_type: Document type (optional, defaults to "lab_report")
            analyte: Specific analyte to analyze (optional, analyzes all if not provided)
            task_description: Task description
            
        Returns:
            Final workflow result
        """
        # Initialize state
        initial_state: LabAgentState = {
            "user_id": user_id,
            "doc_id": doc_id,
            "doc_type": doc_type or "lab_report",
            "task_description": task_description,
            "analyte": analyte,
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
    agent = LabAgent()
    
    # Analyze a lab report
    print("=" * 60)
    print("LAB REPORT ANALYSIS AGENT - EXAMPLE")
    print("=" * 60)
    
    result = agent.analyze_lab_report(
        user_id="default-user",
        doc_id=None,  # Analyze all lab reports for this user
        analyte=None,  # Analyze all analytes, or specify "A1C" for specific analyte
        task_description="A new lab report has been uploaded. Please analyze the results and provide insights."
    )
    
    print("\n" + "=" * 60)
    print("WORKFLOW RESULT")
    print("=" * 60)
    print(json.dumps(result, indent=2))

