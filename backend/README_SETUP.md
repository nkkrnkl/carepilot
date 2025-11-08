# CarePilot Setup - Quick Start

## Architecture

- **Azure AI Foundry Service**: For generating embeddings (via Azure OpenAI)
- **Pinecone**: For vector storage (direct API connection, not through Azure)

## Quick Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
# Pinecone (Direct API - not through Azure)
PINECONE_API_KEY=your_pinecone_api_key_here

# Azure AI Foundry Service (for embeddings)
AZURE_OPENAI_ENDPOINT=https://foundryResourceaymaan.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# K2 API (for LLM calls)
K2_API_KEY=your_k2_api_key_here
```

## Key Points

1. **Pinecone**: Uses direct API connection with `PINECONE_API_KEY` (not through Azure)
2. **Azure AI Foundry**: Used only for generating embeddings
3. **No Azure Region**: Pinecone doesn't need `AZURE_REGION` (direct API connection)

## Documentation

- `SETUP_GUIDE.md` - Complete setup guide
- `CONFIGURE_YOUR_RESOURCES.md` - Configuration for your specific resources
- `SETUP_WITH_YOUR_CREDENTIALS.md` - Setup with your credentials

