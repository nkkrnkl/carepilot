# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**CarePilot** is an AI-powered healthcare navigation system built with Next.js 16, integrating Azure cloud services and Python-based AI agents for medical knowledge management, claims processing, and lab report analysis.

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend Services**: 
  - Azure SQL Database (SQL authentication)
  - Azure Blob Storage (documents)
  - Azure Table Storage (legacy)
  - Pinecone Vector Store (medical knowledge)
- **AI/ML**: 
  - Python backend with LangGraph agents
  - Azure OpenAI (embeddings via text-embedding-3-large)
  - RAG retrieval for medical queries
- **Authentication**: Auth0 (Next.js SDK)

## Essential Commands

### Development
```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Database & Scripts
```bash
# SQL Database
npm run create-sql-tables         # Create/update SQL tables
npm run test-sql-connection       # Test SQL database connectivity
npm run migrate-user-table        # Migrate user table schema
npm run migrate-doctors-to-sql    # Migrate doctors to SQL

# Mock Data & Azure
npm run generate-doctors          # Generate mock doctor data
npm run upload-doctors            # Upload doctors to Azure
npm run check-doctors             # Check doctor count in Azure
npm run list-containers           # List Azure Blob containers

# Table Storage (legacy)
npm run create-tables             # Create Azure Table Storage tables
npm run test-tables               # Test Table Storage connection
npm run delete-document-table     # Delete document table
```

### Python Backend
```bash
cd backend
pip install -r requirements.txt  # Install Python dependencies

# Python scripts are invoked via Node.js python-bridge (lib/python-bridge.ts)
```

## Architecture

### Hybrid Stack (Node.js + Python)
The application uses a **hybrid architecture**:
- **Next.js** handles web UI, API routes, and user interactions
- **Python backend** (`backend/`) provides AI agents for:
  - Claims processing (`claims_agent.py`)
  - Lab report analysis (`lab_agent.py`) 
  - Medical knowledge RAG retrieval (`rag_retriever.py`)
  - Document processing (`document_processor.py`)
  - Pinecone vector operations (`pinecone_store.py`)

**Bridge Communication**: Node.js spawns Python processes via `lib/python-bridge.ts`, passing data through environment variables and JSON.

### Database Architecture

#### Azure SQL Database (Primary)
**Server**: `k2sqldatabaseserver.database.windows.net`  
**Database**: `K2Database`  
**Authentication**: SQL authentication (username/password)

**Main Tables**:
1. **`user_table`**: Patient data (PK: `emailAddress`)
   - Personal info, insurance details
   - `documents` column stores JSON array of document metadata
   - Foreign keys: `providerId` → `provider_table`, `insurerId` → `insurer_table`

2. **`doctorInformation_table`**: Doctor profiles for scheduling (PK: `id`)
   - JSON columns: `languages`, `slots`, `reasons` (stored as NVARCHAR(MAX))
   - Used by appointment booking system

3. **`userAppointmentScheduled_table`**: Appointments (PK: `appointment_id`)
   - Links users to doctors via `userEmailAddress` and `doctorId`
   - Status: 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'

4. **`provider_table`**: Healthcare providers (PK: `provider_id`)
5. **`insurer_table`**: Insurance companies (PK: `unique_id`)

**Connection**: Managed by `lib/azure/sql-storage.ts` using `mssql` package with connection pooling.

**See `DATABASE-SCHEMA.md` for complete schema with ERD.**

#### Pinecone Vector Store
**Index**: `care-pilot` (dimension: 3072)  
**Namespaces**:
- `kb`: Shared medical knowledge (CPT/ICD-10/LOINC codes, payer policies, lab test definitions)
- `private`: User-specific PHI (lab reports, bills, clinical notes)

**Operations**: All vector operations in `backend/pinecone_store.py`

### Authentication Flow (Auth0)

**Provider**: Auth0 SDK (`@auth0/nextjs-auth0`)  
**Configuration**: See `AUTH0-SETUP.md`

**Key Files**:
- `middleware.ts`: Auth0 middleware for protected routes
- `lib/auth.ts` & `lib/auth0.ts`: Auth utility functions
- `app/api/auth/[...auth0]/route.ts`: Auth callback handlers

**Usage**:
- Client components: `const { user } = useUser()` from `@auth0/nextjs-auth0/client`
- Server components: `const session = await getSession()` from `@auth0/nextjs-auth0`

**Login/Logout**:
- Login: `/api/auth/login`
- Logout: `/api/auth/logout`
- Protected pages redirect to login if unauthenticated

### API Routes Structure

```
app/api/
├── auth/[...auth0]/        # Auth0 handlers
├── users/                  # User CRUD operations
├── doctors/                # Doctor search/retrieval
├── appointments/           # Appointment booking
├── claims/                 # Claims processing (Python bridge)
└── labs/                   # Lab report processing (Python bridge)
```

**Pattern**: API routes in Next.js call Python backend via `lib/python-bridge.ts` for AI operations.

### Frontend Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout with Auth0 provider
├── signin/, signup/            # Auth pages
├── patient/                    # Patient dashboard
├── doctorportal/               # Doctor portal
├── profile/, settings/         # User management
├── overview/, features/        # Marketing pages
└── exact/                      # (purpose unclear)

components/
├── ui/                         # shadcn/ui components
└── auth/                       # Auth-related components
```

### Medical Knowledge System

The system stores three types of medical knowledge in Pinecone:

1. **Medical Codes (Ontology)**:
   - CPT codes (procedure coding)
   - ICD-10 codes (diagnosis coding)
   - LOINC codes (lab test standardization)

2. **Payer Policies**: Insurance coverage rules and billing requirements per payer (e.g., Aetna, Medicare)

3. **Lab Test Definitions**: Plain-English explanations of lab tests for patient education

**RAG Workflow** (`backend/rag_retriever.py`):
- User asks question → Extract medical terms
- Query Pinecone `kb` namespace for relevant knowledge
- Query Pinecone `private` namespace for user's documents
- Combine context → Generate answer with Azure OpenAI

### Document Processing

**Flow**:
1. User uploads document (PDF, image) via frontend
2. Stored in Azure Blob Storage (container per user)
3. Metadata saved to `user_table.documents` JSON column
4. Python `document_processor.py` extracts text (pdfplumber, PyPDF2, pytesseract)
5. Text embedded with Azure OpenAI → Stored in Pinecone `private` namespace

## Configuration & Environment

**Required Variables** (`.env` or `.env.local`):

```bash
# Auth0
AUTH0_SECRET='...'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://dev-mkzc2baz7coa6cg6.us.auth0.com'
AUTH0_CLIENT_ID='...'
AUTH0_CLIENT_SECRET='...'

# Azure SQL (use individual credentials)
AZURE_SQL_SERVER='k2sqldatabaseserver.database.windows.net'
AZURE_SQL_DATABASE='K2Database'
AZURE_SQL_USER='carepilot'
AZURE_SQL_PASSWORD='...'

# Azure Storage (optional - legacy)
AZURE_STORAGE_CONNECTION_STRING='...'

# Pinecone
PINECONE_API_KEY='...'

# Azure OpenAI (for embeddings)
AZURE_OPENAI_ENDPOINT='...'
AZURE_OPENAI_API_KEY='...'
AZURE_OPENAI_DEPLOYMENT_NAME='text-embedding-3-large-2'
AZURE_OPENAI_API_VERSION='2023-05-15'
```

**Critical**: SQL authentication uses **individual credentials** (`AZURE_SQL_USER`/`AZURE_SQL_PASSWORD`), not connection strings. Connection string parsing exists but credentials take precedence.

## Development Patterns

### TypeScript Path Aliases
Configured in `tsconfig.json`:
- `@/*` → Root directory (`./*`)
- Example: `import { Button } from "@/components/ui/button"`

### shadcn/ui Components
**Config**: `components.json`  
**Style**: `new-york` variant  
**Theme**: Neutral base color with CSS variables  
**Icons**: Lucide React

### SQL Operations

**Connection Pattern**:
```typescript
import { query, execute } from "@/lib/azure/sql-storage";

// Query
const users = await query<UserEntity>("SELECT * FROM user_table WHERE emailAddress = @email", { email });

// Execute
await execute("INSERT INTO user_table (...) VALUES (...)", { ... });
```

**Connection Pool**: Automatically managed with reconnection logic in `getConnectionPool()`

**JSON Columns**: Parse manually after retrieval:
```typescript
const user = await query<UserEntity>("SELECT * FROM user_table WHERE ...");
const documents = JSON.parse(user[0].documents || "[]");
```

### Python Integration

**Invoking Python**:
```typescript
import { executePython } from "@/lib/python-bridge";

const result = await executePython("backend/claims_agent.py", {
  user_id: "user@example.com",
  claim_data: JSON.stringify(claimData)
});

if (result.success) {
  const data = result.data; // Parsed JSON from Python stdout
}
```

**Python Side** (example):
```python
import os
import json

# Read options
options = json.loads(os.environ.get("PYTHON_OPTIONS_JSON", "{}"))
user_id = options.get("user_id")

# Process and output JSON
result = {"status": "success", "data": {...}}
print(json.dumps(result))  # Stdout is parsed by Node.js
```

## Common Tasks

### Adding a New API Route
1. Create route file: `app/api/[name]/route.ts`
2. Export handler: `export async function GET/POST/PUT/DELETE(request: Request) { ... }`
3. For Python integration, use `executePython()` from `lib/python-bridge.ts`
4. Always check Auth0 session for protected routes:
   ```typescript
   import { getSession } from "@auth0/nextjs-auth0";
   const session = await getSession();
   if (!session) return new Response("Unauthorized", { status: 401 });
   ```

### Working with SQL Database
- **Schema changes**: Update `scripts/create-sql-tables.ts`, then run `npm run create-sql-tables`
- **Testing connection**: `npm run test-sql-connection`
- **Migrations**: Create new migration script in `scripts/`, follow pattern in `migrate-user-table.ts`

### Adding shadcn/ui Components
```bash
npx shadcn@latest add [component-name]
```
Components are added to `components/ui/` and configured via `components.json`

### Python Backend Development
- Always update `backend/requirements.txt` when adding dependencies
- Python scripts should output JSON to stdout for Node.js parsing
- Use environment variable `PYTHON_OPTIONS_JSON` to receive complex objects from Node.js
- Test Python scripts standalone: `cd backend && python3 claims_agent.py`

## Troubleshooting

### SQL Connection Issues
- Use individual credentials (`AZURE_SQL_USER`/`AZURE_SQL_PASSWORD`), not connection strings
- Test: `npm run test-sql-connection`
- Check firewall rules on Azure SQL Database
- Connection pooling retries on failure (see `lib/azure/sql-storage.ts`)

### Auth0 Issues
- "Invalid state" → Clear cookies, ensure `AUTH0_SECRET` is set
- "Redirect URI mismatch" → Verify callback URLs in Auth0 dashboard match exactly
- See `AUTH0-TROUBLESHOOTING.md` for detailed debugging

### Python Bridge Errors
- Ensure `python3` is in PATH
- Check Python dependencies: `pip install -r backend/requirements.txt`
- Python errors appear in `result.error` from `executePython()`
- Check stdout/stderr in Python script execution result

### Pinecone/Vector Store
- Verify `PINECONE_API_KEY` is set and valid
- Index `care-pilot` must exist with dimension 3072
- Use `backend/pinecone_store.py` methods: `test_pinecone_connection()`, `get_index_stats()`

## Documentation References

- **Database Schema**: `DATABASE-SCHEMA.md` (complete ERD and table definitions)
- **Auth0 Setup**: `AUTH0-SETUP.md`, `AUTH0-TROUBLESHOOTING.md`
- **SQL Setup**: Multiple guides (`QUICK-START-SQL.md`, `SQL-DATABASE-SETUP.md`, etc.)
- **Azure Storage**: `README-AZURE-SETUP.md`, `BLOB-STORAGE-STATUS.md`
- **Python Backend**: `backend/README.md`, `backend/CLAIMS_AGENT_README.md`, `backend/INSTALLATION.md`
- **Pinecone/RAG**: `README.md` (comprehensive guide on medical codes, payer policies, lab tests)

## Notes

- Project uses React 19 and Next.js 16 (latest features)
- SQL Database uses NVARCHAR for all strings (Unicode support)
- Multiple legacy `.md` files exist for SQL setup - prioritize `DATABASE-SCHEMA.md` for schema truth
- `carepilot` directory at root appears to be legacy/unused
- Python scripts use Azure AI Foundry Service (not OpenAI directly) for embeddings
