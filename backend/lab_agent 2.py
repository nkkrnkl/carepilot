# lab_analysis_agent.py
"""
Lab Analysis Agent using LangGraph, K2 API, and Pinecone Vector Store.

This module ingests a lab report (PDF/PNG), extracts values, enriches with RAG
(lab test definitions / reference ranges), structures results with K2, and
emits dashboard-ready cards for your UI.
"""

from typing import Dict, List, Any, Optional, TypedDict, Tuple
import os
import io
import json

# ---- Optional deps (soft imports with graceful fallbacks) ----
try:
    import pdfplumber  # for PDF text + tables
except Exception:
    pdfplumber = None

try:
    from PIL import Image
except Exception:
    Image = None

try:
    import pytesseract  # OCR for PNG/JPEG or rasterized PDF pages
except Exception:
    pytesseract = None

try:
    import fitz  # PyMuPDF for PDF to images (OCR fallback)
except Exception:
    fitz = None

# ---- LangGraph guard (match claims_agent.py pattern) ----
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
    # Input
    user_id: str
    file_path: str
    file_type: Optional[str]  # "pdf" | "png" | "jpg" | None
    task_description: str

    # Step outputs
    step1_ingest: Optional[Dict[str, Any]]
    step2_rag: Optional[Dict[str, Any]]
    step3_structured: Optional[Dict[str, Any]]
    step4_cards: Optional[Dict[str, Any]]

    # Working memory
    raw_text: str
    table_text_blocks: List[str]
    parsed_rows: List[Dict[str, Any]]  # rows: test, value, unit, reference_range, flag
    references: List[Dict[str, Any]]   # from RAG (lab definitions etc.)

    # Final output
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]
    current_step: int


# ==================== SYSTEM & STEP PROMPTS ====================

MASTER_SYSTEM_PROMPT = """You are 'CarePilot-Labs', an expert clinical lab interpreter.

GOAL: Convert raw extracted reports (text/tables) into clean, structured results
and compact, patient-friendly dashboard cards. Keep factual accuracy.
When unsure, be conservative and mark items as 'needs_review'.

RAG Sources available (via vector store):
- source: "lab_test_definition" (contains: canonical test names, common aliases, units, typical reference ranges)
- source: "payer_policy" (optional clinical coverage/medical necessity notes)

CONSTRAINTS:
- Do not hallucinate values that aren't in the extracted text.
- Prefer values from tables; if multiple duplicates, choose the most consistent set.
- Normalize test names to canonical forms where possible.
- Return well-formed JSON only.
"""

STEP_PROMPTS = {
    3: """**Step 3: Structure Lab Results**

You are given:
- Raw text segments from OCR/table extraction
- RAG results with lab definitions (aliases, common units, typical ranges)

TASK:
1) Parse/normalize each measured lab (e.g., 'HEMOGLOBIN', 'RBC COUNT', 'WBC', 'PLATELET COUNT', 'MCV', 'MCH', 'MCHC', 'RDW', 'PDW', 'MPV', 'P-LCR', 'PCT', etc.).
2) Output a list of JSON rows with fields:
   - test_name (canonical, e.g., "Hemoglobin")
   - raw_label (as seen)
   - value (numeric if possible)
   - unit (string)
   - reference_range (string if available or inferred from RAG; otherwise empty)
   - flag ("low" | "high" | "normal" | "unknown")
   - evidence (short snippet)
3) If the report has multiple columns (e.g., 3 dates), make one row per (test_name, column) with a 'panel_label' field to distinguish columns (e.g., "Col1", "Col2", "Col3").

RETURN JSON:
{"step": 3, "status": "Completed", "rows": [...]}""",

    4: """**Step 4: Build Dashboard Cards**

Given structured rows:
- Compute compact KPIs suitable for a patient/clinician dashboard.
- Produce:
  1) 'summary_cards': list of cards {title, value, unit, trend (optional), flag, detail}
     - Recommended cards: Hemoglobin, WBC, Platelets, MCV/MCHC, RDW, MPV, PDW
  2) 'condition_flags': anemia / leukocytosis / thrombocytopenia / thrombocytosis, etc., as:
     {name, present: bool, rationale}
  3) 'table_compact': a 2D mini-table possibly grouped by panel_label.

RETURN JSON:
{
  "step": 4,
  "status": "Completed",
  "summary_cards": [...],
  "condition_flags": [...],
  "table_compact": {
     "columns": ["Parameter", "Col1", "Col2", "Col3"],
     "rows": [["Hemoglobin","11.0 gm%","9.6 gm%","9.6 gm%"], ...]
  }
}"""
}


# ==================== AGENT CLASS ====================

class LabAnalysisAgent:
    """Lab Analysis Agent using LangGraph, K2 API, and Pinecone"""

    def __init__(
        self,
        vector_store: Optional[PineconeVectorStore] = None,
        llm_client: Optional[K2APIClient] = None
    ):
        if not LANGGRAPH_AVAILABLE:
            raise ImportError("LangGraph is required. pip install langgraph")

        self.store = vector_store or PineconeVectorStore()
        self.llm = llm_client or K2APIClient()
        self.workflow = self._build_workflow()

    # -------- Workflow graph --------
    def _build_workflow(self) -> StateGraph:
        g = StateGraph(LabAgentState)

        g.add_node("step1_ingest", self._step1_ingest_file)
        g.add_node("step2_rag", self._step2_rag_enrich)
        g.add_node("step3_structured", self._step3_structure_with_llm)
        g.add_node("step4_cards", self._step4_build_cards)

        g.set_entry_point("step1_ingest")
        g.add_edge("step1_ingest", "step2_rag")
        g.add_edge("step2_rag", "step3_structured")
        g.add_edge("step3_structured", "step4_cards")
        g.add_edge("step4_cards", END)

        return g.compile()

    # -------- Step 1: Ingest --------
    def _step1_ingest_file(self, state: LabAgentState) -> LabAgentState:
        try:
            path = state["file_path"]
            ext = (state.get("file_type") or os.path.splitext(path)[1][1:]).lower()
            text_blocks: List[str] = []
            whole_text = ""

            if ext in ("pdf",) and pdfplumber:
                with pdfplumber.open(path) as pdf:
                    for page in pdf.pages:
                        # text
                        t = page.extract_text() or ""
                        if t.strip():
                            text_blocks.append(t)
                        # tables → stringify row-wise
                        try:
                            tables = page.extract_tables() or []
                            for tbl in tables:
                                # convert rows to aligned text for LLM
                                rows = ["\t".join([c or "" for c in r]) for r in tbl if r]
                                if rows:
                                    text_blocks.append("\n".join(rows))
                        except Exception:
                            pass
                whole_text = "\n\n".join(text_blocks)

                # If we failed to get text (scanned PDF), OCR as fallback
                if not whole_text.strip() and fitz and pytesseract and Image:
                    whole_text = self._ocr_pdf_with_pymupdf(path)

            elif ext in ("png", "jpg", "jpeg", "tiff") and pytesseract and Image:
                whole_text = self._ocr_image(path)
                text_blocks = [whole_text] if whole_text else []

            else:
                # best-effort fallback
                with open(path, "rb") as f:
                    raw = f.read()
                try:
                    whole_text = raw.decode("utf-8", errors="ignore")
                except Exception:
                    whole_text = ""

            state["raw_text"] = whole_text or ""
            state["table_text_blocks"] = text_blocks
            state["step1_ingest"] = {
                "step": 1,
                "status": "Completed" if whole_text else "Partial",
                "notes": "OCR/PDF extraction complete",
                "chars": len(whole_text)
            }
            state["current_step"] = 1

        except Exception as e:
            state["error"] = f"Step 1 error: {e}"
            state["step1_ingest"] = {"step": 1, "status": "Error", "error": str(e)}
        return state

    def _ocr_image(self, path: str) -> str:
        try:
            img = Image.open(path)
            return pytesseract.image_to_string(img)
        except Exception:
            return ""

    def _ocr_pdf_with_pymupdf(self, path: str) -> str:
        try:
            doc = fitz.open(path)
            out = []
            for page in doc:
                pix = page.get_pixmap()  # rasterize
                if Image and pytesseract:
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    out.append(pytesseract.image_to_string(img))
            return "\n".join(out)
        except Exception:
            return ""

    # -------- Step 2: RAG Enrichment --------
    def _step2_rag_enrich(self, state: LabAgentState) -> LabAgentState:
        try:
            # Ask for general lab test definitions that likely match our content
            query_text = (state.get("raw_text") or "")[:4000] or "hematology panel lab report"
            lab_defs = self.store.query_kb(
                query_text=query_text,
                top_k=15,
                filter={"source": {"$eq": "lab_test_definition"}}
            )
            refs = [m.get("metadata", {}) for m in lab_defs.get("matches", [])]

            state["references"] = refs
            state["step2_rag"] = {
                "step": 2,
                "status": "Completed",
                "ref_count": len(refs)
            }
            state["current_step"] = 2
        except Exception as e:
            state["error"] = f"Step 2 error: {e}"
            state["step2_rag"] = {"step": 2, "status": "Error", "error": str(e)}
        return state

    # -------- Step 3: LLM Structuring --------
    def _step3_structure_with_llm(self, state: LabAgentState) -> LabAgentState:
        try:
            chunks = state.get("table_text_blocks", []) or [state.get("raw_text", "")]
            refs = state.get("references", [])

            user_message = f"""You will structure lab results.

=== EXTRACTED TEXT CHUNKS ===
{json.dumps(chunks[:8], ensure_ascii=False, indent=2)}

=== RAG LAB DEFINITIONS (top) ===
{json.dumps(refs[:12], ensure_ascii=False, indent=2)}

{STEP_PROMPTS[3]}

Return only the JSON object."""
            msgs = [
                {"role": "system", "content": MASTER_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ]
            res = self.llm.chat(msgs)
            rows: List[Dict[str, Any]] = []

            content = res.get("choices", [{}])[0].get("message", {}).get("content", "") if res else ""
            parsed = self._extract_json(content)
            if parsed and "rows" in parsed:
                rows = parsed["rows"]

            # fallback: naïve heuristic parse (very lightweight)
            if not rows:
                rows = self._heuristic_rows_from_text(state.get("raw_text", ""))

            state["parsed_rows"] = rows
            state["step3_structured"] = {
                "step": 3, "status": "Completed" if rows else "Partial", "rows_count": len(rows)
            }
            state["current_step"] = 3
        except Exception as e:
            state["error"] = f"Step 3 error: {e}"
            state["step3_structured"] = {"step": 3, "status": "Error", "error": str(e)}
        return state

    def _heuristic_rows_from_text(self, text: str) -> List[Dict[str, Any]]:
        # extremely simple parser to not block if LLM fails
        candidates = [
            "hemoglobin", "rbc count", "wbc", "platelet", "mcv", "mch", "mchc", "rdw", "mpv", "pdw", "p-lcr", "pct"
        ]
        out = []
        lower = text.lower()
        for label in candidates:
            if label in lower:
                # grab short tail after label; best effort
                idx = lower.find(label)
                snippet = text[idx: idx + 80]
                out.append({
                    "test_name": label.title(),
                    "raw_label": label,
                    "value": "",
                    "unit": "",
                    "reference_range": "",
                    "flag": "unknown",
                    "evidence": snippet,
                    "panel_label": "Col1"
                })
        return out

    def _extract_json(self, content: str) -> Optional[Dict[str, Any]]:
        import re
        try:
            m = re.search(r"\{.*\}", content, flags=re.DOTALL)
            if m:
                return json.loads(m.group(0))
            return json.loads(content)
        except Exception:
            return None

    # -------- Step 4: Dashboard Cards --------
    def _step4_build_cards(self, state: LabAgentState) -> LabAgentState:
        try:
            rows = state.get("parsed_rows", [])

            # Normalize into a compact table grouped by panel_label
            params = {}
            panels = set()
            for r in rows:
                param = r.get("test_name") or r.get("raw_label") or "Unknown"
                panel = r.get("panel_label", "Col1")
                panels.add(panel)
                params.setdefault(param, {})
                val = f"{r.get('value','')}{(' ' + r.get('unit','')).strip()}"
                params[param][panel] = val.strip() or (r.get("evidence") or "")[:24]

            sorted_panels = sorted(list(panels))
            header = ["Parameter"] + sorted_panels
            tab_rows = []
            for p, cols in params.items():
                tab_rows.append([p] + [cols.get(c, "") for c in sorted_panels])

            # Basic condition flags (very conservative; UI copy only)
            def find_val(name_substr: str) -> Optional[str]:
                for r in rows:
                    if name_substr.lower() in (r.get("test_name","")+r.get("raw_label","")).lower():
                        return str(r.get("value", "")).strip() or None
                return None

            flags = []
            # Add simple examples; the UI can expand
            for key in ("Hemoglobin", "WBC", "Platelet"):
                v = find_val(key.lower())
                if v is None:
                    continue
                flags.append({
                    "name": f"{key} check",
                    "present": True,
                    "rationale": f"{key} reported as {v} (see table)"
                })

            # Summary cards: pick a handful if present
            card_defs = ["Hemoglobin", "WBC", "Platelet", "MCV", "MCHC", "RDW", "MPV", "PDW"]
            cards = []
            for cd in card_defs:
                # take first matching row for simplicity
                match = next((r for r in rows if cd.lower() in (r.get("test_name","")+r.get("raw_label","")).lower()), None)
                if match:
                    cards.append({
                        "title": cd,
                        "value": match.get("value", ""),
                        "unit": match.get("unit", ""),
                        "flag": match.get("flag", "unknown"),
                        "detail": match.get("reference_range","") or match.get("evidence","")[:60]
                    })

            payload = {
                "step": 4,
                "status": "Completed",
                "summary_cards": cards,
                "condition_flags": flags,
                "table_compact": {"columns": header, "rows": tab_rows}
            }
            state["step4_cards"] = payload
            state["final_result"] = {
                "workflow_completed": True,
                "steps": {
                    "step1": state.get("step1_ingest", {}),
                    "step2": state.get("step2_rag", {}),
                    "step3": state.get("step3_structured", {}),
                    "step4": state.get("step4_cards", {})
                },
                "dashboard": payload
            }
            state["current_step"] = 4
        except Exception as e:
            state["error"] = f"Step 4 error: {e}"
            state["step4_cards"] = {"step": 4, "status": "Error", "error": str(e)}
        return state

    # -------- Public API --------
    def process_lab(
        self,
        user_id: str,
        file_path: str,
        file_type: Optional[str] = None,
        task_description: str = "Process the lab report"
    ) -> Dict[str, Any]:
        """Run the 4-step lab workflow and return dashboard JSON."""
        init: LabAgentState = {
            "user_id": user_id,
            "file_path": file_path,
            "file_type": file_type,
            "task_description": task_description,
            "step1_ingest": None,
            "step2_rag": None,
            "step3_structured": None,
            "step4_cards": None,
            "raw_text": "",
            "table_text_blocks": [],
            "parsed_rows": [],
            "references": [],
            "final_result": None,
            "error": None,
            "current_step": 0,
        }
        try:
            final_state = self.workflow.invoke(init)
            return final_state.get("final_result", final_state)
        except Exception as e:
            return {"workflow_completed": False, "error": str(e), "state": init}


if __name__ == "__main__":
    # Example local run
    agent = LabAnalysisAgent()
    result = agent.process_lab(
        user_id="user-123",
        file_path="sample_reports/hematology_report.pdf",
        task_description="New lab uploaded; generate dashboard."
    )
    print(json.dumps(result, indent=2))
