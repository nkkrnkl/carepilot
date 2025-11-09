# Labs Processing Agent - LangGraph Implementation

Complete guide for using the Labs Processing Agent with LangGraph and K2 API.

**This README is a 1:1 clone of CLAIMS_AGENT_README.md, adapted for lab reports.**

## Overview

The Labs Processing Agent is a LangGraph-based agent that processes lab reports using a 4-step workflow:

1. **Retrieve Lab Report** - Retrieves lab report from private namespace
2. **Analyze Results** - Identifies abnormal values and trends
3. **Query Knowledge Base** - Gets test definitions and coverage info
4. **Generate Insights** - Provides plain-English insights and suggested questions

## Architecture

### Components

- **LabsAgent**: Main agent class that orchestrates the workflow
- **PineconeVectorStore**: Vector store for RAG queries (SAME as claims)
- **K2APIClient**: LLM client for processing and decision-making (SAME as claims)
- **LangGraph**: Workflow orchestration framework (SAME as claims)

### Workflow

```
Step 1: Retrieve Lab Report
    ↓
Step 2: Analyze Results
    ↓
Step 3: Query Knowledge Base
    ↓
Step 4: Generate Insights
    ↓
END
```

## Setup

### Prerequisites

1. **Pinecone API Key**: Configured in `.env` (SAME as claims)
2. **Azure AI Foundry Service**: For embeddings (SAME as claims)
3. **K2 API Key**: For LLM calls (SAME as claims)
4. **LangGraph**: Install with `pip install langgraph` (SAME as claims)

### Installation

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Or from root directory
pip install -r backend/requirements.txt
```

### Configuration

Ensure your `.env` file contains (SAME env vars as claims):

```env
# Pinecone
PINECONE_API_KEY=your_pinecone_api_key

# Azure AI Foundry
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# K2 API
K2_API_KEY=your_k2_api_key
```

**Note**: No new environment variables are needed. The labs agent uses the EXACT same configuration as the claims agent.

## Usage

### Basic Usage

```python
# Note: Python files are in the backend/ directory
from labs_agent import LabsAgent
from pinecone_store import PineconeVectorStore

# Initialize agent
store = PineconeVectorStore()
agent = LabsAgent(vector_store=store)

# Process a lab report
result = agent.process_lab(
    user_id="user-123",
    doc_id="lab-abc-456",
    doc_type="lab_report",
    task_description="A new lab report has been uploaded. Please analyze the results."
)

# Access results
if result.get("workflow_completed"):
    step1 = result["steps"]["step1"]  # Lab report retrieval
    step2 = result["steps"]["step2"]  # Results analysis
    step3 = result["steps"]["step3"]  # Knowledge base query
    step4 = result["steps"]["step4"]  # Insights generation
    
    lab_results = result["lab_results"]  # Extracted lab parameters
```

### Complete Example

```python
from labs_agent import LabsAgent
from pinecone_store import PineconeVectorStore

# Initialize
store = PineconeVectorStore()
agent = LabsAgent(vector_store=store)

# Setup data (if not already in Pinecone)
store.add_user_document(
    user_id="user-123",
    doc_type="lab_report",
    doc_id="lab-001",
    text="Lab Report: Glucose: 95 mg/dL (normal: 70-100), LDL: 120 mg/dL (normal: <100)"
)

# Process lab report
result = agent.process_lab(
    user_id="user-123",
    doc_id="lab-001",
    doc_type="lab_report"
)

print(f"Workflow completed: {result['workflow_completed']}")
print(f"Lab Results: {result.get('lab_results')}")
```

## Workflow Steps

### Step 1: Retrieve Lab Report

**Purpose**: Retrieve lab report from private namespace

**Process**:
1. Query private namespace for user's lab reports
2. Extract lab results and parameters
3. Return structured lab data

**Output**:
```json
{
  "step": 1,
  "status": "Completed",
  "retrieved_lab_report": "Lab report text...",
  "lab_results": [
    {"parameter": "Glucose", "value": "95", "unit": "mg/dL", "referenceRange": "70-100"}
  ]
}
```

### Step 2: Analyze Results

**Purpose**: Identify abnormal values and trends

**Process**:
1. Analyze lab results against reference ranges
2. Flag abnormal values
3. Return analysis summary

**Output**:
```json
{
  "step": 2,
  "status": "Completed",
  "analysis": {
    "normal_count": 3,
    "abnormal_count": 1,
    "flagged_parameters": ["LDL Cholesterol"]
  }
}
```

### Step 3: Query Knowledge Base

**Purpose**: Get test definitions and coverage information

**Process**:
1. Query KB for lab test definitions
2. Query KB for coverage/authorization rules
3. Return structured knowledge

**Output**:
```json
{
  "step": 3,
  "status": "Completed",
  "test_definitions": [
    {
      "analyte": "A1C",
      "description": "Hemoglobin A1C measures average blood glucose over 2-3 months",
      "normal_range": "4.0-5.7%",
      "clinical_significance": "Used to diagnose and monitor diabetes"
    }
  ],
  "coverage_info": [
    {
      "analyte": "A1C",
      "covered": true,
      "frequency": "Every 3 months for diabetics"
    }
  ]
}
```

### Step 4: Generate Insights

**Purpose**: Provide actionable insights and suggested questions

**Process**:
1. Compile analysis from previous steps
2. Generate plain-English insights
3. Suggest questions for clinician

**Output**:
```json
{
  "step": 4,
  "status": "Completed",
  "insights": "Your LDL cholesterol is slightly elevated...",
  "suggested_questions": [
    "Should I be concerned about my LDL cholesterol level?",
    "What lifestyle changes can help lower my cholesterol?"
  ]
}
```

## System Prompts

### Master System Prompt

The agent uses a master system prompt that defines:
- Role: CarePilot-Labs agent
- Tools: PineconeVectorStore methods (SAME as claims)
- Constraints: Never query private without user_id, follow workflow
- Output: Structured JSON for each step

### Step Prompts

Each step has a specific prompt that:
- Defines the step's purpose
- Provides expected output format
- Guides the LLM's thinking process

## RAG Queries

### Private Namespace Queries

```python
# Query user's lab reports
store.query_private(
    query_text="lab report test results values",
    user_id="user-123",
    doc_types=["lab_report"],
    top_k=10
)
```

### KB Namespace Queries

```python
# Query lab test definitions
store.query_kb(
    query_text="Glucose lab test definition normal range",
    top_k=3,
    filter={"source": {"$eq": "lab_test_definition"}}
)

# Query coverage info
store.query_kb(
    query_text="lab test coverage authorization policy",
    top_k=5,
    filter={"source": {"$eq": "payer_policy"}}
)
```

## API Routes

### POST /api/labs/ingest

Upload a lab report PDF/image for processing.

**Request**:
- `file`: PDF or image file
- `userId`: User identifier
- `docId`: Document identifier
- `reportDate` (optional): Report date
- `hospital` (optional): Hospital name
- `doctor` (optional): Doctor name

**Response**:
```json
{
  "success": true,
  "docId": "lab-001",
  "vectorId": "chunk_...",
  "vectorIds": ["chunk_..."],
  "chunkCount": 3
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/labs/ingest \
  -F "file=@lab_report.pdf" \
  -F "userId=user-123" \
  -F "docId=lab-001"
```

### GET /api/labs/search

Search lab reports using RAG.

**Query Parameters**:
- `q`: Search query
- `userId`: User identifier
- `topK`: Number of results (default: 5)

**Response**:
```json
{
  "success": true,
  "matches": [
    {
      "id": "chunk_...",
      "score": 0.85,
      "metadata": {...}
    }
  ],
  "query": "LDL cholesterol",
  "userId": "user-123"
}
```

**Example**:
```bash
curl "http://localhost:3000/api/labs/search?q=LDL%20cholesterol&userId=user-123"
```

### GET /api/labs/parameters

List all unique parameter names for a user.

**Query Parameters**:
- `userId`: User identifier

**Response**:
```json
{
  "success": true,
  "parameters": ["Glucose", "LDL Cholesterol", "A1C"],
  "userId": "user-123"
}
```

**Example**:
```bash
curl "http://localhost:3000/api/labs/parameters?userId=user-123"
```

### GET /api/labs/timeseries

Get time series data for a specific parameter.

**Query Parameters**:
- `name`: Parameter name (e.g., "LDL-C")
- `userId`: User identifier

**Response**:
```json
{
  "success": true,
  "parameterName": "LDL-C",
  "timeseries": [
    {"date": "2024-01-15", "value": 110, "unit": "mg/dL", "docId": "lab-001"},
    {"date": "2024-04-15", "value": 120, "unit": "mg/dL", "docId": "lab-002"}
  ],
  "userId": "user-123"
}
```

**Example**:
```bash
curl "http://localhost:3000/api/labs/timeseries?name=LDL-C&userId=user-123"
```

## Error Handling

The agent includes comprehensive error handling (SAME as claims):

- **Step-level errors**: Each step catches exceptions and returns error status
- **Fallback responses**: If LLM fails, uses RAG query results directly
- **State preservation**: Errors don't break the workflow, state is preserved

## Example Output

```json
{
  "workflow_completed": true,
  "steps": {
    "step1": {
      "step": 1,
      "status": "Completed",
      "retrieved_lab_report": "Lab Report: Glucose: 95 mg/dL...",
      "lab_results": [
        {"parameter": "Glucose", "value": "95", "unit": "mg/dL", "referenceRange": "70-100"}
      ]
    },
    "step2": {
      "step": 2,
      "status": "Completed",
      "analysis": {
        "normal_count": 3,
        "abnormal_count": 1,
        "flagged_parameters": ["LDL Cholesterol"]
      }
    },
    "step3": {
      "step": 3,
      "status": "Completed",
      "test_definitions": [...],
      "coverage_info": [...]
    },
    "step4": {
      "step": 4,
      "status": "Completed",
      "insights": "Your LDL cholesterol is slightly elevated...",
      "suggested_questions": [...]
    }
  },
  "user_id": "user-123",
  "lab_results": [...],
  "test_definitions": [...],
  "coverage_info": [...]
}
```

## Running the Example

```bash
# Run the example script
python labs_agent.py
```

This will:
1. Initialize the agent
2. Setup example data in Pinecone
3. Process a sample lab report
4. Display the results

## Advanced Usage

### Custom LLM Client

```python
from api import K2APIClient
from labs_agent import LabsAgent

# Create custom LLM client
llm_client = K2APIClient(api_key="your-api-key")

# Initialize agent with custom client
agent = LabsAgent(llm_client=llm_client)
```

### Custom Vector Store

```python
from pinecone_store import PineconeVectorStore
from labs_agent import LabsAgent

# Create custom vector store (SAME config as claims)
store = PineconeVectorStore(
    dimension=3072,
    create_index_if_not_exists=True
)

# Initialize agent with custom store
agent = LabsAgent(vector_store=store)
```

## Parity with Claims Agent

The Labs Agent maintains **exact parity** with the Claims Agent:

✅ **Same Pinecone index**: `care-pilot`  
✅ **Same namespaces**: `kb` and `private`  
✅ **Same embedding model**: text-embedding-3-large (3072 dims)  
✅ **Same chunking**: chunk_size=1000, chunk_overlap=200, strategy="sentence"  
✅ **Same metadata keys**: user_id, doc_type, doc_id, chunk_index, text  
✅ **Same retry/batch config**: Identical batch sizes and retry logic  
✅ **Same ID policy**: Hash-based IDs with prefix  
✅ **Same namespace policy**: Uses `private` namespace, filters by doc_type  

**Only differences**:
- `doc_type`: "lab_report" (instead of "clinical_note", "bill")
- Additional metadata: `reportDate`, `hospital`, `doctor` (optional, non-breaking)
- Workflow steps adapted for lab analysis (but same structure)

## Troubleshooting

### Common Issues

1. **LangGraph Import Error**
   - Solution: Install LangGraph with `pip install langgraph`

2. **Pinecone Connection Error**
   - Solution: Verify `PINECONE_API_KEY` is set correctly

3. **K2 API Error**
   - Solution: Verify `K2_API_KEY` is set correctly

4. **No Results from Queries**
   - Solution: Ensure lab reports are added to Pinecone before processing

5. **LLM Response Parsing Error**
   - Solution: The agent includes fallback logic, but check LLM responses

### Debugging

Enable verbose logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Best Practices

1. **Data Preparation**: Ensure all required data is in Pinecone before processing
2. **Error Handling**: Always check `workflow_completed` status
3. **State Management**: The agent preserves state across steps
4. **Validation**: Review lab results before finalizing insights
5. **Monitoring**: Track processing status through Step 4 output

## API Reference

### LabsAgent Class

#### `__init__(vector_store, llm_client)`
Initialize the labs agent.

#### `process_lab(user_id, doc_id, doc_type, task_description)`
Process a lab report using the 4-step workflow.

**Returns**: Dictionary with workflow results

### State Structure

```python
class LabAgentState(TypedDict):
    user_id: str
    doc_id: Optional[str]
    doc_type: Optional[str]
    task_description: str
    step1_retrieval: Optional[Dict[str, Any]]
    step2_analysis: Optional[Dict[str, Any]]
    step3_knowledge: Optional[Dict[str, Any]]
    step4_insights: Optional[Dict[str, Any]]
    current_step: int
    retrieved_lab_report: Optional[str]
    lab_results: List[Dict[str, Any]]
    test_definitions: List[Dict[str, Any]]
    coverage_info: List[Dict[str, Any]]
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the example script
3. Check Pinecone and K2 API status
4. Verify all environment variables are set (SAME as claims)

## Quick Start (Labs)

```bash
# 1. Set environment variables (same as claims)
export PINECONE_API_KEY=your_key
export AZURE_OPENAI_ENDPOINT=your_endpoint
export AZURE_OPENAI_API_KEY=your_key
export K2_API_KEY=your_key

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Upload a lab report
curl -X POST http://localhost:3000/api/labs/ingest \
  -F "file=@lab_report.pdf" \
  -F "userId=user-123" \
  -F "docId=lab-001"

# 4. Search lab reports
curl "http://localhost:3000/api/labs/search?q=glucose&userId=user-123"

# 5. Get time series
curl "http://localhost:3000/api/labs/timeseries?name=Glucose&userId=user-123"
```

## License

[Your License Here]

