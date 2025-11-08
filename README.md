# CarePilot - Pinecone Vector Store and RAG Retriever

Complete guide for using Pinecone Vector Store and RAG Retriever for medical knowledge management and retrieval.

## Overview

This system uses Pinecone (direct API) for vector storage with Azure AI Foundry Service for embeddings. It supports three main use cases:

1. **Medical Codes (Ontology)**: CPT, ICD-10, and LOINC codes
2. **Payer Policies**: Insurance payer policies and billing rules
3. **Lab Test Definitions**: Plain-English definitions of lab tests

## Setup

### Prerequisites

1. **Pinecone API Key**: Get your API key from [Pinecone Dashboard](https://app.pinecone.io/)
2. **Azure AI Foundry Service**: Configured for embeddings
3. **Python Environment**: Python 3.8+

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in your project root:

```env
# Pinecone (Direct API - uses default project)
PINECONE_API_KEY=your_pinecone_api_key_here

# Azure AI Foundry Service (for embeddings)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15
```

## Architecture

### Two Namespaces

- **`kb` (Knowledge Base)**: Shared medical knowledge (CPT codes, ICD-10, LOINC, payer policies, lab tests)
- **`private`**: User-specific PHI (lab reports, bills, clinical notes)

### Index

- **Index Name**: `care-pilot`
- **Default Dimension**: 3072 (for text-embedding-3-large)
- **Spec**: Serverless (created in default project)

---

## Use Case 1: Medical Codes (Ontology)

Store and retrieve CPT, ICD-10, and LOINC codes for medical coding and claims processing.

### Adding CPT Codes

```python
from pinecone_store import PineconeVectorStore

# Initialize store
store = PineconeVectorStore()

# Add CPT codes
store.add_cpt_code(
    code="99214",
    description="Office or other outpatient visit for the evaluation and management of an established patient, which requires a medically appropriate history and/or examination and moderate level of medical decision making"
)

store.add_cpt_code(
    code="85025",
    description="Complete blood count (CBC), automated (Hgb, Hct, RBC, WBC and platelet count)"
)

store.add_cpt_code(
    code="80053",
    description="Comprehensive metabolic panel"
)
```

### Adding ICD-10 Codes

```python
# Add ICD-10 codes
store.add_icd10_code(
    code="E11.9",
    description="Type 2 diabetes mellitus without complications"
)

store.add_icd10_code(
    code="I10",
    description="Essential (primary) hypertension"
)

store.add_icd10_code(
    code="M79.3",
    description="Panniculitis, unspecified"
)
```

### Adding LOINC Codes

```python
# Add LOINC codes
store.add_loinc_code(
    code="2160-0",
    description="Creatinine [Mass/volume] in Serum or Plasma"
)

store.add_loinc_code(
    code="2339-0",
    description="Glucose [Mass/volume] in Blood"
)

store.add_loinc_code(
    code="2085-9",
    description="Cholesterol, Total [Mass/volume] in Serum or Plasma"
)
```

### Querying Medical Codes

```python
# Query CPT codes
cpt_results = store.query_kb(
    query_text="office visit established patient",
    top_k=5,
    filter={"source": {"$eq": "cpt_code"}}
)

print(f"Found {len(cpt_results['matches'])} CPT codes")
for match in cpt_results['matches']:
    print(f"  - {match['metadata']['code']}: {match['metadata']['description']}")

# Query ICD-10 codes
icd10_results = store.query_kb(
    query_text="diabetes type 2",
    top_k=5,
    filter={"source": {"$eq": "icd10_code"}}
)

print(f"Found {len(icd10_results['matches'])} ICD-10 codes")
for match in icd10_results['matches']:
    print(f"  - {match['metadata']['code']}: {match['metadata']['description']}")

# Query LOINC codes
loinc_results = store.query_kb(
    query_text="creatinine blood test",
    top_k=5,
    filter={"source": {"$eq": "loinc_code"}}
)

print(f"Found {len(loinc_results['matches'])} LOINC codes")
for match in loinc_results['matches']:
    print(f"  - {match['metadata']['code']}: {match['metadata']['description']}")
```

### Bulk Import Medical Codes

```python
import csv

# Example: Bulk import CPT codes from CSV
def import_cpt_codes_from_csv(csv_path: str, store: PineconeVectorStore):
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            store.add_cpt_code(
                code=row['code'],
                description=row['description']
            )
    print(f"Imported CPT codes from {csv_path}")

# Usage
# import_cpt_codes_from_csv("cpt_codes.csv", store)
```

---

## Use Case 2: Payer Policies and Billing Rules

Store and retrieve insurance payer policies and billing rules for coverage verification and claims processing.

### Adding Payer Policies

```python
from pinecone_store import PineconeVectorStore

# Initialize store
store = PineconeVectorStore()

# Add Aetna policies
store.add_payer_policy(
    payer_id="aetna",
    policy_text="Aetna covers routine lab tests when medically necessary. Pre-authorization required for tests over $500."
)

store.add_payer_policy(
    payer_id="aetna",
    policy_text="Aetna covers preventive care services including annual physical exams, mammograms, and colonoscopies at 100% with no deductible."
)

# Add Medicare policies
store.add_payer_policy(
    payer_id="medicare",
    policy_text="Medicare Part B covers medically necessary lab tests ordered by a doctor. Beneficiaries pay 20% coinsurance after deductible."
)

store.add_payer_policy(
    payer_id="medicare",
    policy_text="Medicare covers screening mammograms once every 12 months for women 40 and older at no cost."
)

# Add UnitedHealthcare policies
store.add_payer_policy(
    payer_id="unitedhealthcare",
    policy_text="UnitedHealthcare requires pre-authorization for non-emergency imaging studies including MRI and CT scans."
)

store.add_payer_policy(
    payer_id="unitedhealthcare",
    policy_text="UnitedHealthcare covers telemedicine visits at the same rate as in-person visits for most plan types."
)
```

### Adding Billing Rules

```python
# Add billing rules
store.add_payer_policy(
    payer_id="aetna",
    policy_text="Aetna billing rule: Modifier 25 can be used when a significant, separately identifiable evaluation and management service is provided on the same day as a procedure."
)

store.add_payer_policy(
    payer_id="medicare",
    policy_text="Medicare billing rule: Use modifier 59 to indicate a distinct procedural service that is not normally reported together with another procedure."
)

store.add_payer_policy(
    payer_id="medicare",
    policy_text="Medicare billing rule: Global surgery period is 90 days for major procedures. Post-operative care is included in the global fee."
)
```

### Querying Payer Policies

```python
# Query policies for a specific payer
aetna_policies = store.query_kb(
    query_text="routine lab tests coverage",
    top_k=5,
    filter={
        "source": {"$eq": "payer_policy"},
        "payer_id": {"$eq": "aetna"}
    }
)

print(f"Found {len(aetna_policies['matches'])} Aetna policies")
for match in aetna_policies['matches']:
    print(f"  - {match['metadata']['text']}")

# Query policies across all payers
all_policies = store.query_kb(
    query_text="pre-authorization requirements",
    top_k=10,
    filter={"source": {"$eq": "payer_policy"}}
)

print(f"Found {len(all_policies['matches'])} policies across all payers")
for match in all_policies['matches']:
    payer = match['metadata'].get('payer_id', 'unknown')
    print(f"  - [{payer}] {match['metadata']['text']}")
```

### Using RAG Retriever for Payer Policy Queries

```python
from rag_retriever import CarePilotRAGRetriever

# Initialize RAG retriever
retriever = CarePilotRAGRetriever()

# Query payer policies using RAG
result = retriever.get_context_for_question(
    user_id="user-123",
    question="What are Aetna's coverage policies for lab tests?",
    doc_types=["bill"],  # Can also search user bills if needed
    top_k_kb=10
)

print("Payer Policy Context:")
for match in result['kb_context']['matches']:
    if match['metadata'].get('source') == 'payer_policy':
        print(f"  - {match['metadata']['text']}")
```

---

## Use Case 3: Lab Test Definitions

Store and retrieve plain-English definitions of lab tests for patient education and billing explanations.

### Adding Lab Test Definitions

```python
from pinecone_store import PineconeVectorStore

# Initialize store
store = PineconeVectorStore()

# Add lab test definitions
store.add_lab_test_definition(
    test_name="Creatinine",
    definition="A blood test that measures how well your kidneys are filtering waste from your blood. Normal range is typically 0.6-1.2 mg/dL for men and 0.5-1.1 mg/dL for women."
)

store.add_lab_test_definition(
    test_name="Glucose",
    definition="A blood test that measures the amount of sugar (glucose) in your blood. Used to diagnose and monitor diabetes. Normal fasting glucose is typically 70-100 mg/dL."
)

store.add_lab_test_definition(
    test_name="Hemoglobin A1C",
    definition="A blood test that measures your average blood sugar level over the past 2-3 months. Used to diagnose and monitor diabetes. Normal range is typically 4.0-5.6%. Levels above 6.5% indicate diabetes."
)

store.add_lab_test_definition(
    test_name="Cholesterol",
    definition="A blood test that measures the amount of cholesterol in your blood. Includes total cholesterol, LDL (bad) cholesterol, HDL (good) cholesterol, and triglycerides. Used to assess heart disease risk."
)

store.add_lab_test_definition(
    test_name="PSA",
    definition="Prostate-specific antigen test. A blood test used to screen for prostate cancer in men. Normal levels are typically less than 4.0 ng/mL, though levels can vary with age."
)

store.add_lab_test_definition(
    test_name="Complete Blood Count (CBC)",
    definition="A common blood test that measures the number of red blood cells, white blood cells, and platelets in your blood. Used to screen for a variety of conditions including anemia, infection, and blood disorders."
)
```

### Querying Lab Test Definitions

```python
# Query lab test definitions
lab_results = store.query_kb(
    query_text="kidney function test",
    top_k=5,
    filter={"source": {"$eq": "lab_test_definition"}}
)

print(f"Found {len(lab_results['matches'])} lab test definitions")
for match in lab_results['matches']:
    test_name = match['metadata'].get('test_name', 'Unknown')
    definition = match['metadata'].get('definition', '')
    print(f"  - {test_name}: {definition}")

# Query specific test
creatinine_results = store.query_kb(
    query_text="creatinine",
    top_k=3,
    filter={"source": {"$eq": "lab_test_definition"}}
)

for match in creatinine_results['matches']:
    print(f"  - {match['metadata']['test_name']}: {match['metadata']['definition']}")
```

### Using RAG Retriever for Lab Test Questions

```python
from rag_retriever import CarePilotRAGRetriever

# Initialize RAG retriever
retriever = CarePilotRAGRetriever()

# Answer question about lab test using RAG
result = retriever.answer_question(
    user_id="user-123",
    question="What is a Creatinine test and what do the results mean?",
    doc_types=["lab_report"]  # Can also search user's lab reports
)

print(f"Question: {result['question']}")
print(f"Answer: {result['answer']}")
print(f"\nLab Test Definitions Found: {len([m for m in result['context']['kb_context']['matches'] if m['metadata'].get('source') == 'lab_test_definition'])}")
```

---

## Complete Example: All Three Use Cases

```python
from pinecone_store import PineconeVectorStore
from rag_retriever import CarePilotRAGRetriever

# Initialize store and retriever
store = PineconeVectorStore()
retriever = CarePilotRAGRetriever(vector_store=store)

# ==========================================
# 1. Add Medical Codes (Ontology)
# ==========================================
print("Adding medical codes...")

# CPT codes
store.add_cpt_code(
    code="99214",
    description="Office visit for established patient with moderate complexity"
)
store.add_cpt_code(
    code="80053",
    description="Comprehensive metabolic panel"
)

# ICD-10 codes
store.add_icd10_code(
    code="E11.9",
    description="Type 2 diabetes mellitus without complications"
)

# LOINC codes
store.add_loinc_code(
    code="2160-0",
    description="Creatinine [Mass/volume] in Serum or Plasma"
)

# ==========================================
# 2. Add Payer Policies
# ==========================================
print("Adding payer policies...")

store.add_payer_policy(
    payer_id="aetna",
    policy_text="Aetna covers routine lab tests when medically necessary"
)

store.add_payer_policy(
    payer_id="medicare",
    policy_text="Medicare Part B covers medically necessary lab tests with 20% coinsurance"
)

# ==========================================
# 3. Add Lab Test Definitions
# ==========================================
print("Adding lab test definitions...")

store.add_lab_test_definition(
    test_name="Creatinine",
    definition="A blood test that measures kidney function. Normal range: 0.6-1.2 mg/dL"
)

store.add_lab_test_definition(
    test_name="Glucose",
    definition="A blood test that measures blood sugar. Normal fasting: 70-100 mg/dL"
)

# ==========================================
# 4. Query Using RAG Retriever
# ==========================================
print("\nQuerying with RAG retriever...")

# Example: User asks about a bill
result = retriever.answer_question(
    user_id="user-123",
    question="Why was I charged $150 for my Creatinine test? What is a Creatinine test?",
    doc_types=["bill", "lab_report"]
)

print(f"\nQuestion: {result['question']}")
print(f"\nAnswer:\n{result['answer']}")
print(f"\nContext Used:")
print(f"  - Private context matches: {len(result['context']['private_context']['matches'])}")
print(f"  - KB context matches: {len(result['context']['kb_context']['matches'])}")
print(f"  - Extracted terms: {result['context']['extracted_terms']}")
```

---

## Advanced Usage

### Batch Operations

```python
# Batch add multiple codes
cpt_codes = [
    {"code": "99213", "description": "Office visit, low complexity"},
    {"code": "99214", "description": "Office visit, moderate complexity"},
    {"code": "99215", "description": "Office visit, high complexity"},
]

for cpt in cpt_codes:
    store.add_cpt_code(**cpt)

# Batch add lab tests
lab_tests = [
    {"test_name": "Creatinine", "definition": "Kidney function test"},
    {"test_name": "Glucose", "definition": "Blood sugar test"},
]

for test in lab_tests:
    store.add_lab_test_definition(**test)
```

### Custom Metadata

```python
# Add codes with custom metadata
store.add_cpt_code(
    code="99214",
    description="Office visit for established patient",
    metadata={
        "category": "Evaluation and Management",
        "typical_fee": 150.00,
        "typical_duration": 30
    }
)

# Add payer policy with custom metadata
store.add_payer_policy(
    payer_id="aetna",
    policy_text="Coverage policy for lab tests",
    metadata={
        "effective_date": "2024-01-01",
        "policy_number": "POL-12345",
        "requires_auth": True
    }
)
```

### Querying Multiple Sources

```python
# Query all medical knowledge (codes, policies, lab tests)
all_kb = store.query_kb(
    query_text="diabetes lab tests",
    top_k=10,
    filter={
        "source": {
            "$in": ["cpt_code", "icd10_code", "loinc_code", "payer_policy", "lab_test_definition"]
        }
    }
)

print(f"Found {len(all_kb['matches'])} results across all knowledge sources")
for match in all_kb['matches']:
    source = match['metadata']['source']
    print(f"  - [{source}] {match['metadata'].get('text', match['metadata'].get('description', ''))}")
```

### Index Statistics

```python
# Get index statistics
stats = store.get_index_stats()
print(f"Total vectors: {stats['total_vector_count']}")
print(f"Dimension: {stats['dimension']}")
print(f"Index fullness: {stats['index_fullness']}")
print("\nVectors by namespace:")
for ns, ns_stats in stats['namespaces'].items():
    print(f"  {ns}: {ns_stats['vector_count']} vectors")
```

### Testing Connection

```python
# Test Pinecone connection
store.test_pinecone_connection()

# Get configuration
config = store.get_pinecone_config()
print(config)
```

---

## Troubleshooting

### Common Issues

1. **Index Not Found**
   - Ensure `PINECONE_API_KEY` is set correctly
   - Check that the index `care-pilot` exists or allow auto-creation
   - Verify API key has "All" permissions

2. **Permission Errors**
   - Ensure API key has "Indexes: Create" permission
   - Check API key permissions in Pinecone dashboard

3. **Embedding Errors**
   - Verify Azure AI Foundry credentials are correct
   - Check that deployment name matches your Azure setup
   - Ensure dimension matches (default: 3072)

4. **Query Returns No Results**
   - Check that data was successfully added to the index
   - Verify namespace is correct (`kb` for knowledge base)
   - Check filter syntax is correct

### Getting Help

- Check Pinecone logs in the dashboard
- Verify environment variables are set correctly
- Test connection: `store.test_pinecone_connection()`
- Check index stats: `store.get_index_stats()`

---

## Best Practices

1. **Batch Operations**: Use batch operations for bulk imports to improve performance
2. **Metadata**: Add relevant metadata to improve filtering and search
3. **Namespaces**: Always use the `kb` namespace for shared knowledge
4. **Error Handling**: Implement proper error handling for production use
5. **Monitoring**: Regularly check index statistics and performance
6. **Backup**: Consider backing up your index configuration and metadata

---

## API Reference

### PineconeVectorStore Methods

- `add_cpt_code(code, description, metadata=None)` - Add CPT code
- `add_icd10_code(code, description, metadata=None)` - Add ICD-10 code
- `add_loinc_code(code, description, metadata=None)` - Add LOINC code
- `add_payer_policy(payer_id, policy_text, metadata=None)` - Add payer policy
- `add_lab_test_definition(test_name, definition, metadata=None)` - Add lab test definition
- `query_kb(query_text, top_k=5, filter=None)` - Query knowledge base
- `get_index_stats()` - Get index statistics
- `test_pinecone_connection()` - Test Pinecone connection

### CarePilotRAGRetriever Methods

- `get_context_for_question(user_id, question, doc_types=None, top_k_private=5, top_k_kb=5)` - Get context for question
- `answer_question(user_id, question, doc_types=None, system_prompt=None)` - Answer question using RAG
- `get_context_for_claim(user_id, claim_data)` - Get context for claim processing

---

## License

[Your License Here]

## Support

For issues and questions, please open an issue on GitHub.

# CarePilot

CarePilot is an AI-powered healthcare navigation system that helps streamline your healthcare experience.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
