# Claims Processing Agent - LangGraph Implementation

Complete guide for using the Claims Processing Agent with LangGraph and K2 API.

## Overview

The Claims Processing Agent is a LangGraph-based agent that processes medical claims using a 4-step workflow:

1. **Pre-Check Coverage** - Retrieves payer information and policies
2. **Assemble Codes** - RAG-assisted coding (CPT and ICD-10)
3. **Generate Clean Claim** - Validation and scrubbing
4. **Monitor Status** - Final status and monitoring

## Architecture

### Components

- **ClaimsAgent**: Main agent class that orchestrates the workflow
- **PineconeVectorStore**: Vector store for RAG queries
- **K2APIClient**: LLM client for processing and decision-making
- **LangGraph**: Workflow orchestration framework

### Workflow

```
Step 1: Pre-Check Coverage
    ↓
Step 2: Assemble Codes
    ↓
Step 3: Generate Clean Claim
    ↓
Step 4: Monitor Status
    ↓
END
```

## Setup

### Prerequisites

1. **Pinecone API Key**: Configured in `.env`
2. **Azure AI Foundry Service**: For embeddings
3. **K2 API Key**: For LLM calls
4. **LangGraph**: Install with `pip install langgraph`

### Installation

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Or from root directory
pip install -r backend/requirements.txt
```

### Configuration

Ensure your `.env` file contains:

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

## Usage

### Basic Usage

```python
# Note: Python files are in the backend/ directory
# When running from backend directory or with proper Python path:
from claims_agent import ClaimsAgent
from pinecone_store import PineconeVectorStore

# Initialize agent
store = PineconeVectorStore()
agent = ClaimsAgent(vector_store=store)

# Process a claim
result = agent.process_claim(
    user_id="user-123",
    doc_id="note-abc-456",
    doc_type="clinical_note",
    task_description="A new clinical note has been uploaded. Please process the claim."
)

# Access results
if result.get("workflow_completed"):
    step1 = result["steps"]["step1"]  # Coverage check
    step2 = result["steps"]["step2"]  # Code assembly
    step3 = result["steps"]["step3"]  # Claim generation
    step4 = result["steps"]["step4"]  # Status monitoring
    
    claim = result["claim"]  # Final claim JSON
```

### Complete Example

```python
from claims_agent import ClaimsAgent
from pinecone_store import PineconeVectorStore

# Initialize
store = PineconeVectorStore()
agent = ClaimsAgent(vector_store=store)

# Setup data (if not already in Pinecone)
store.add_user_document(
    user_id="user-123",
    doc_type="plan_document",
    doc_id="plan-001",
    text="Patient is covered by Aetna PPO plan."
)

store.add_user_document(
    user_id="user-123",
    doc_type="clinical_note",
    doc_id="note-abc-456",
    text="Patient presents with sore throat. Assessment: Acute Pharyngitis (J02.9). Office visit: 25 minutes."
)

# Process claim
result = agent.process_claim(
    user_id="user-123",
    doc_id="note-abc-456",
    doc_type="clinical_note"
)

print(f"Workflow completed: {result['workflow_completed']}")
print(f"Payer ID: {result.get('payer_id')}")
print(f"Claim: {result.get('claim')}")
```

## Workflow Steps

### Step 1: Pre-Check Coverage

**Purpose**: Identify payer and retrieve relevant policies

**Process**:
1. Query private namespace for user's insurance plan
2. Extract payer ID (Aetna, Medicare, etc.)
3. Query KB namespace for payer policies
4. Return structured coverage information

**Output**:
```json
{
  "step": 1,
  "status": "Completed",
  "payer_id": "aetna",
  "retrieved_policy_context": "Policy details..."
}
```

### Step 2: Assemble Codes

**Purpose**: Extract and match medical codes from clinical notes

**Process**:
1. Retrieve clinical note from private namespace
2. Query KB for matching ICD-10 codes (diagnosis)
3. Query KB for matching CPT codes (procedures)
4. Return suggested codes with justifications

**Output**:
```json
{
  "step": 2,
  "status": "Completed",
  "suggested_cpt": [
    {"code": "99214", "justification": "Office visit, est patient, 20-29 min"}
  ],
  "suggested_icd10": [
    {"code": "J02.9", "justification": "Acute Pharyngitis"}
  ]
}
```

### Step 3: Generate Clean Claim

**Purpose**: Validate codes and generate final claim

**Process**:
1. Check for conflicts between codes and payer policies
2. Validate code combinations
3. Generate clean claim JSON
4. Return validated claim

**Output**:
```json
{
  "step": 3,
  "status": "Clean",
  "claim_json": {
    "payer_id": "aetna",
    "user_id": "user-123",
    "cpt_codes": ["99214"],
    "icd10_codes": ["J02.9"],
    "validation_notes": "No policy conflicts found."
  }
}
```

### Step 4: Monitor Status

**Purpose**: Finalize claim status and set monitoring

**Process**:
1. Compile all workflow steps
2. Set claim status
3. Return monitoring information

**Output**:
```json
{
  "step": 4,
  "status": "Submitted",
  "monitoring_note": "Awaiting EOB from payer."
}
```

## System Prompts

### Master System Prompt

The agent uses a master system prompt that defines:
- Role: CarePilot-Claims agent
- Tools: PineconeVectorStore methods
- Constraints: Never query private without user_id, follow 4-step workflow
- Output: Structured JSON for each step

### Step Prompts

Each step has a specific prompt that:
- Defines the step's purpose
- Provides expected output format
- Guides the LLM's thinking process

## RAG Queries

### Private Namespace Queries

```python
# Query user's insurance plan
store.query_private(
    query_text="patient insurance plan payer",
    user_id="user-123",
    doc_types=["plan_document"],
    top_k=3
)

# Query clinical note
store.query_private(
    query_text="clinical note assessment plan",
    user_id="user-123",
    doc_types=["clinical_note"],
    top_k=5
)
```

### KB Namespace Queries

```python
# Query payer policies
store.query_kb(
    query_text="Aetna policy for established patient office visit",
    top_k=5,
    filter={
        "source": {"$eq": "payer_policy"},
        "payer_id": {"$eq": "aetna"}
    }
)

# Query ICD-10 codes
store.query_kb(
    query_text="Acute Pharyngitis",
    top_k=1,
    filter={"source": {"$eq": "icd10_code"}}
)

# Query CPT codes
store.query_kb(
    query_text="established patient office visit 25 minutes",
    top_k=1,
    filter={"source": {"$eq": "cpt_code"}}
)
```

## Error Handling

The agent includes comprehensive error handling:

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
      "payer_id": "aetna",
      "retrieved_policy_context": "Aetna covers office visits..."
    },
    "step2": {
      "step": 2,
      "status": "Completed",
      "suggested_cpt": [
        {"code": "99214", "justification": "Office visit..."}
      ],
      "suggested_icd10": [
        {"code": "J02.9", "justification": "Acute Pharyngitis"}
      ]
    },
    "step3": {
      "step": 3,
      "status": "Clean",
      "claim_json": {
        "payer_id": "aetna",
        "user_id": "user-123",
        "cpt_codes": ["99214"],
        "icd10_codes": ["J02.9"],
        "validation_notes": "No policy conflicts found."
      }
    },
    "step4": {
      "step": 4,
      "status": "Submitted",
      "monitoring_note": "Awaiting EOB from payer."
    }
  },
  "user_id": "user-123",
  "payer_id": "aetna",
  "claim": {
    "payer_id": "aetna",
    "user_id": "user-123",
    "cpt_codes": ["99214"],
    "icd10_codes": ["J02.9"],
    "validation_notes": "No policy conflicts found."
  }
}
```

## Running the Example

```bash
# Run the example script
python claims_agent_example.py
```

This will:
1. Initialize the agent
2. Setup example data in Pinecone
3. Process a sample claim
4. Display the results

## Advanced Usage

### Custom LLM Client

```python
from api import K2APIClient
from claims_agent import ClaimsAgent

# Create custom LLM client
llm_client = K2APIClient(api_key="your-api-key")

# Initialize agent with custom client
agent = ClaimsAgent(llm_client=llm_client)
```

### Custom Vector Store

```python
from pinecone_store import PineconeVectorStore
from claims_agent import ClaimsAgent

# Create custom vector store
store = PineconeVectorStore(
    dimension=3072,
    create_index_if_not_exists=True
)

# Initialize agent with custom store
agent = ClaimsAgent(vector_store=store)
```

### Processing Multiple Claims

```python
# Process multiple claims
claims = [
    {"user_id": "user-123", "doc_id": "note-001"},
    {"user_id": "user-456", "doc_id": "note-002"},
    {"user_id": "user-789", "doc_id": "note-003"}
]

results = []
for claim in claims:
    result = agent.process_claim(
        user_id=claim["user_id"],
        doc_id=claim["doc_id"]
    )
    results.append(result)
```

## Troubleshooting

### Common Issues

1. **LangGraph Import Error**
   - Solution: Install LangGraph with `pip install langgraph`

2. **Pinecone Connection Error**
   - Solution: Verify `PINECONE_API_KEY` is set correctly

3. **K2 API Error**
   - Solution: Verify `K2_API_KEY` is set correctly

4. **No Results from Queries**
   - Solution: Ensure data is added to Pinecone before processing claims

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
4. **Validation**: Review suggested codes before finalizing claims
5. **Monitoring**: Track claim status through Step 4 output

## API Reference

### ClaimsAgent Class

#### `__init__(vector_store, llm_client)`
Initialize the claims agent.

#### `process_claim(user_id, doc_id, doc_type, task_description)`
Process a claim using the 4-step workflow.

**Returns**: Dictionary with workflow results

### State Structure

```python
class AgentState(TypedDict):
    user_id: str
    doc_id: Optional[str]
    doc_type: Optional[str]
    task_description: str
    step1_coverage: Optional[Dict[str, Any]]
    step2_codes: Optional[Dict[str, Any]]
    step3_claim: Optional[Dict[str, Any]]
    step4_status: Optional[Dict[str, Any]]
    current_step: int
    payer_id: Optional[str]
    final_result: Optional[Dict[str, Any]]
    error: Optional[str]
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the example script
3. Check Pinecone and K2 API status
4. Verify all environment variables are set

## License

[Your License Here]

