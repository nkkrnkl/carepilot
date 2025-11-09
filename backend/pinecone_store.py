"""
Pinecone Vector Store Manager for CarePilot

This module implements a Pinecone-based vector store with two namespaces:
1. 'kb' (Knowledge Base): Shared, transferable data (CPT codes, ICD-10, LOINC, payer policies)
2. 'private': User-specific PHI (lab reports, bills, clinical notes)

The single index 'care-pilot' uses namespaces to separate data types and metadata
to separate users for multi-tenancy support.

Pinecone Connection:
- Uses direct API connection with PINECONE_API_KEY (not through Azure)
- Azure AI Foundry Service is used separately for embeddings only
"""

import os
import time
import re
from typing import List, Dict, Optional, Any, Union
from urllib.parse import urlparse
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from openai import AzureOpenAI
# Lazy import DefaultAzureCredential - only needed when use_azure_ad=True
# This avoids architecture mismatch issues if cryptography is compiled for wrong arch
# import DefaultAzureCredential  # Moved to lazy import to avoid architecture issues
import uuid
import hashlib

# Load environment variables
load_dotenv()


class PineconeVectorStore:
    """
    Pinecone Vector Store Manager for CarePilot
    
    Uses Azure AI Foundry Service for embeddings (via Azure OpenAI) and 
    Pinecone (direct API) for vector storage.
    
    Manages a single Pinecone index 'care-pilot' with two namespaces:
    - 'kb': Knowledge base (shared data)
    - 'private': User-specific PHI
    
    Pinecone Configuration:
    - Uses default project: When initialized with API key, automatically uses the default project
    - Index creation: Creates serverless indexes in the default project
    - Permissions: Requires API key with 'All' permissions or 'Indexes: Create' permission
    
    Authentication:
    - Azure AI Foundry: Supports API key or Azure AD (DefaultAzureCredential) for embeddings
    - Pinecone: Uses API key authentication (PINECONE_API_KEY) - direct connection, not through Azure
    - All credentials can be provided via environment variables or constructor arguments
    """
    
    # Namespace constants
    NAMESPACE_KB = "kb"  # Knowledge Base
    NAMESPACE_PRIVATE = "private"  # User-specific PHI
    
    # Index name
    INDEX_NAME = "care-pilot"
    
    def __init__(
        self,
        pinecone_api_key: Optional[str] = None,
        azure_endpoint: Optional[str] = None,
        azure_api_key: Optional[str] = None,
        azure_deployment_name: Optional[str] = None,
        azure_api_version: str = "2023-05-15",
        embedding_model: Optional[str] = None,
        dimension: int = 3072,
        use_azure_ad: bool = False,
        create_index_if_not_exists: bool = True
    ):
        """
        Initialize Pinecone Vector Store with Azure AI Foundry Service for embeddings
        and Pinecone (direct API) for vector storage.
        
        Args:
            pinecone_api_key: Pinecone API key (defaults to PINECONE_API_KEY env var)
                             Direct connection to Pinecone - not through Azure
            azure_endpoint: Azure AI Foundry/OpenAI endpoint URL (defaults to AZURE_OPENAI_ENDPOINT env var)
            azure_api_key: Azure OpenAI API key (defaults to AZURE_OPENAI_API_KEY env var)
                          Not required if use_azure_ad=True
            azure_deployment_name: Azure OpenAI deployment name for embeddings 
                                  (defaults to AZURE_OPENAI_DEPLOYMENT_NAME env var)
            azure_api_version: Azure OpenAI API version (default: 2023-05-15)
            embedding_model: Embedding model deployment name (if different from azure_deployment_name)
            dimension: Vector dimension (default 3072 for text-embedding-3-large, can be 1024 or 256)
            use_azure_ad: Use Azure AD authentication instead of API key for embeddings (default: False)
            create_index_if_not_exists: Whether to create index if it doesn't exist
        """
        # ============================================================
        # PINECONE CONFIGURATION (Direct API Connection)
        # ============================================================
        # Pinecone uses direct API connection with API key (not through Azure)
        # PINECONE_API_KEY can be provided via:
        # 1. Constructor parameter (pinecone_api_key)
        # 2. Environment variable (PINECONE_API_KEY)
        # This matches the pattern used in test_pinecone_key.py
        self.pinecone_api_key = pinecone_api_key or os.getenv("PINECONE_API_KEY")
        if not self.pinecone_api_key:
            raise ValueError(
                "Pinecone API key (PINECONE_API_KEY) not found. "
                "Pinecone uses direct API connection with API key authentication.\n\n"
                "Please provide PINECONE_API_KEY using one of the following methods:\n"
                "1. Pass 'pinecone_api_key' parameter to PineconeVectorStore() constructor\n"
                "2. Set 'PINECONE_API_KEY' environment variable in your .env file\n"
                "3. Set 'PINECONE_API_KEY' as a system environment variable\n\n"
                "Get your Pinecone API key from Pinecone dashboard."
            )
        
        # Validate API key format (basic check - should be non-empty string)
        if not isinstance(self.pinecone_api_key, str) or len(self.pinecone_api_key.strip()) == 0:
            raise ValueError(
                "Invalid Pinecone API key format. "
                "PINECONE_API_KEY must be a non-empty string."
            )
        
        # Get Azure AI Foundry/OpenAI credentials
        self.azure_endpoint = azure_endpoint or os.getenv("AZURE_OPENAI_ENDPOINT")
        self.azure_api_key = azure_api_key or os.getenv("AZURE_OPENAI_API_KEY")
        self.azure_deployment_name = embedding_model or azure_deployment_name or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
        self.azure_api_version = azure_api_version or os.getenv("AZURE_OPENAI_API_VERSION", "2023-05-15")
        self.use_azure_ad = use_azure_ad or os.getenv("USE_AZURE_AD", "false").lower() == "true"
        
        # Normalize endpoint URL (remove path and query parameters if present)
        if self.azure_endpoint:
            # Extract base endpoint from full URL if needed
            # e.g., https://foundrymodelsk2hackathon.cognitiveservices.azure.com/openai/deployments/... 
            # -> https://foundrymodelsk2hackathon.cognitiveservices.azure.com/
            if "/openai/" in self.azure_endpoint or "/deployments/" in self.azure_endpoint:
                # Extract base URL (everything before /openai/)
                parsed = urlparse(self.azure_endpoint)
                self.azure_endpoint = f"{parsed.scheme}://{parsed.netloc}/"
            # Ensure trailing slash
            if not self.azure_endpoint.endswith('/'):
                self.azure_endpoint += '/'
        
        if not self.azure_endpoint:
            raise ValueError(
                "Azure AI Foundry endpoint not found. "
                "Pass it to the constructor or set 'AZURE_OPENAI_ENDPOINT' in your .env file."
            )
        
        if not self.azure_deployment_name:
            raise ValueError(
                "Azure OpenAI deployment name not found. "
                "Pass it to the constructor or set 'AZURE_OPENAI_DEPLOYMENT_NAME' in your .env file."
            )
        
        # Initialize Azure OpenAI client with API key or Azure AD
        if self.use_azure_ad:
            # Use Azure AD authentication (recommended for production)
            # Lazy import to avoid architecture mismatch issues
            from azure.identity import DefaultAzureCredential
            credential = DefaultAzureCredential()
            self.azure_client = AzureOpenAI(
                credential=credential,
                api_version=self.azure_api_version,
                azure_endpoint=self.azure_endpoint
            )
        else:
            # Use API key authentication
            if not self.azure_api_key:
                raise ValueError(
                    "Azure OpenAI API key not found. "
                    "Pass it to the constructor, set 'AZURE_OPENAI_API_KEY' in your .env file, "
                    "or set 'USE_AZURE_AD=true' to use Azure AD authentication."
                )
            self.azure_client = AzureOpenAI(
                api_key=self.azure_api_key,
                api_version=self.azure_api_version,
                azure_endpoint=self.azure_endpoint
            )
        
        # ============================================================
        # INITIALIZE PINECONE CLIENT (Direct API Connection - Default Project)
        # ============================================================
        # Pinecone uses direct API connection (not through Azure)
        # When initialized with just an API key, Pinecone automatically uses the default project
        # This is separate from Azure AI Foundry used for embeddings
        try:
            # Initialize Pinecone client with API key (direct connection)
            # This automatically uses the default project associated with the API key
            self.pc = Pinecone(api_key=self.pinecone_api_key)
            
            # Get default project information
            try:
                # List projects to verify default project access
                # Note: The API key is associated with a default project automatically
                indexes = list(self.pc.list_indexes())
                print(f"✓ Pinecone client initialized with PINECONE_API_KEY (using default project)")
                print(f"  - Found {len(indexes)} existing index(es) in default project")
            except Exception as list_error:
                # If listing fails, still continue (might be permissions issue)
                print(f"✓ Pinecone client initialized with PINECONE_API_KEY (using default project)")
                print(f"  ⚠ Could not list indexes: {list_error}")
        except Exception as e:
            raise ValueError(
                f"Failed to initialize Pinecone client with PINECONE_API_KEY. "
                f"Pinecone uses direct API connection with default project (not through Azure).\n"
                f"Please verify your PINECONE_API_KEY is correct and has permissions. Error: {e}"
            )
        
        self.embedding_model = self.azure_deployment_name
        self.dimension = dimension
        
        # Get or create index (direct Pinecone API)
        if create_index_if_not_exists:
            self._ensure_index_exists()
        
        # Get index connection (from default project)
        try:
            self.index = self.pc.Index(self.INDEX_NAME)
            print(f"✓ Connected to Pinecone index: {self.INDEX_NAME} (default project)")
        except Exception as e:
            raise ValueError(
                f"Failed to connect to Pinecone index '{self.INDEX_NAME}'. "
                f"Please verify your PINECONE_API_KEY and that the index exists in your default project. "
                f"Error: {e}"
            )
    
    def _ensure_index_exists(self):
        """
        Create Pinecone index if it doesn't exist (using default project)
        
        Uses ServerlessSpec which is the standard for Pinecone serverless indexes.
        The index will be created in the default project associated with the API key.
        """
        try:
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        except Exception as e:
            raise ValueError(
                f"Failed to list Pinecone indexes. "
                f"Please verify your PINECONE_API_KEY has permissions to list indexes. "
                f"Error: {e}"
            )
        
        if self.INDEX_NAME not in existing_indexes:
            print(f"Creating Pinecone index '{self.INDEX_NAME}' in default project...")
            print(f"  - Dimension: {self.dimension}")
            print(f"  - Metric: cosine")
            print(f"  - Spec: serverless")
            try:
                # Create index directly via Pinecone API using ServerlessSpec
                # This creates the index in the default project associated with the API key
                # ServerlessSpec is the standard specification for Pinecone serverless indexes
                self.pc.create_index(
                    name=self.INDEX_NAME,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",  # Default cloud provider
                        region="us-east-1"  # Default region - Pinecone will use appropriate region
                    )
                )
                print(f"✓ Index '{self.INDEX_NAME}' creation initiated!")
                
                # Wait for index to be ready (Pinecone indexes take a moment to initialize)
                max_wait_time = 60  # Maximum wait time in seconds
                wait_interval = 2  # Check every 2 seconds
                elapsed_time = 0
                
                print(f"  Waiting for index to be ready...")
                while elapsed_time < max_wait_time:
                    try:
                        # Check if index is ready by trying to connect to it
                        # If we can get index stats, it's ready
                        temp_index = self.pc.Index(self.INDEX_NAME)
                        temp_index.describe_index_stats()
                        print(f"✓ Index '{self.INDEX_NAME}' is ready!")
                        break
                    except Exception as check_error:
                        # Index might not be ready yet, wait and retry
                        error_msg = str(check_error).lower()
                        if "not found" in error_msg or "does not exist" in error_msg:
                            # Index doesn't exist yet, wait
                            pass
                        elif "not ready" in error_msg or "initializing" in error_msg:
                            # Index is still initializing
                            if elapsed_time % 10 == 0:
                                print(f"  Index is still initializing... ({elapsed_time}s elapsed)")
                        else:
                            # Other error, might mean it's ready but had a transient error
                            # Try one more time after a short wait
                            time.sleep(1)
                            try:
                                temp_index = self.pc.Index(self.INDEX_NAME)
                                temp_index.describe_index_stats()
                                print(f"✓ Index '{self.INDEX_NAME}' is ready!")
                                break
                            except Exception:
                                pass
                    
                    time.sleep(wait_interval)
                    elapsed_time += wait_interval
                    if elapsed_time % 10 == 0 and elapsed_time > 0:
                        print(f"  Still waiting... ({elapsed_time}s elapsed)")
                
                if elapsed_time >= max_wait_time:
                    print(f"  ⚠ Warning: Could not confirm index is ready within {max_wait_time}s. "
                          f"Index creation may still be in progress.")
                    print(f"  You can check index status in Pinecone dashboard or try again later.")
                    
            except Exception as e:
                error_msg = str(e)
                # Check if it's a permission error
                if "permission" in error_msg.lower() or "unauthorized" in error_msg.lower():
                    raise ValueError(
                        f"Permission denied: Failed to create Pinecone index '{self.INDEX_NAME}'. "
                        f"Please verify your PINECONE_API_KEY has 'All' permissions or 'Indexes: Create' permission. "
                        f"Error: {e}"
                    )
                # Check if index already exists (race condition)
                elif "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                    print(f"✓ Index '{self.INDEX_NAME}' already exists (created by another process).")
                else:
                    raise ValueError(
                        f"Failed to create Pinecone index '{self.INDEX_NAME}'. "
                        f"Please verify your PINECONE_API_KEY is correct and you have permissions to create indexes. "
                        f"Error: {e}"
                    )
        else:
            print(f"✓ Index '{self.INDEX_NAME}' already exists in default project.")
    
    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using Azure AI Foundry Service (Azure OpenAI)"""
        response = self.azure_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
    
    def _generate_id(self, text: str, prefix: str = "") -> str:
        """Generate a unique ID from text"""
        text_hash = hashlib.md5(text.encode()).hexdigest()
        return f"{prefix}_{text_hash}" if prefix else text_hash
    
    def _chunk_text(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        strategy: str = "sentence"
    ) -> List[str]:
        """
        Chunk text into smaller pieces for better embedding and retrieval
        
        Args:
            text: Text to chunk
            chunk_size: Maximum characters per chunk
            chunk_overlap: Number of characters to overlap between chunks
            strategy: Chunking strategy ('sentence', 'paragraph', 'fixed')
        
        Returns:
            List of text chunks
        """
        if len(text) <= chunk_size:
            return [text]
        
        if strategy == "paragraph":
            return self._chunk_by_paragraph(text, chunk_size, chunk_overlap)
        elif strategy == "sentence":
            return self._chunk_by_sentence(text, chunk_size, chunk_overlap)
        else:  # fixed
            return self._chunk_fixed(text, chunk_size, chunk_overlap)
    
    def _chunk_by_paragraph(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Chunk text by paragraphs (better for structured documents)"""
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If adding this paragraph would exceed chunk size
            if len(current_chunk) + len(para) + 2 > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Start new chunk with overlap
                    if overlap > 0 and len(current_chunk) > overlap:
                        current_chunk = current_chunk[-overlap:] + "\n\n" + para
                    else:
                        current_chunk = para
                else:
                    # Paragraph itself is too long, split it by sentence
                    sub_chunks = self._chunk_by_sentence(para, chunk_size, overlap)
                    chunks.extend(sub_chunks[:-1])
                    current_chunk = sub_chunks[-1] if sub_chunks else para
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_by_sentence(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Chunk text by sentences (better for natural language)"""
        import re
        
        # Split by sentence endings (more comprehensive pattern)
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            # If adding this sentence would exceed chunk size
            if len(current_chunk) + len(sentence) + 1 > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Start new chunk with overlap
                    if overlap > 0 and len(current_chunk) > overlap:
                        # Get last few sentences for overlap
                        overlap_text = current_chunk[-overlap:]
                        current_chunk = overlap_text + " " + sentence
                    else:
                        current_chunk = sentence
                else:
                    # Sentence itself is too long, split it
                    chunks.append(sentence[:chunk_size])
                    current_chunk = sentence[chunk_size - overlap:] if len(sentence) > chunk_size - overlap else sentence
            else:
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_fixed(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Chunk text with fixed size (simple sliding window with sentence boundary preference)"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                sentence_end = max(
                    chunk.rfind('. '),
                    chunk.rfind('.\n'),
                    chunk.rfind('? '),
                    chunk.rfind('! '),
                    chunk.rfind('\n\n'),
                    chunk.rfind('\n')
                )
                
                if sentence_end > chunk_size * 0.5:  # If we find a break in second half
                    chunk = chunk[:sentence_end + 1]
                    end = start + len(chunk)
            
            chunks.append(chunk.strip())
            
            # Move start position with overlap
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks
    
    # ==================== KNOWLEDGE BASE (kb) NAMESPACE ====================
    
    def add_cpt_code(
        self,
        code: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add CPT code to knowledge base namespace
        
        Args:
            code: CPT code (e.g., "99214")
            description: Description of the CPT code
            metadata: Additional metadata (will be merged with source metadata)
        
        Returns:
            Vector ID
        """
        text = f"CPT Code {code}: {description}"
        embedding = self._get_embedding(text)
        vector_id = self._generate_id(f"cpt_{code}", "cpt")
        
        metadata_dict = {
            "source": "cpt_code",
            "code": code,
            "description": description,
            "text": text
        }
        if metadata:
            metadata_dict.update(metadata)
        
        self.index.upsert(
            vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": metadata_dict
            }],
            namespace=self.NAMESPACE_KB
        )
        
        return vector_id
    
    def add_icd10_code(
        self,
        code: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add ICD-10 code to knowledge base namespace
        
        Args:
            code: ICD-10 code (e.g., "E11.9")
            description: Description of the ICD-10 code
            metadata: Additional metadata
        
        Returns:
            Vector ID
        """
        text = f"ICD-10 Code {code}: {description}"
        embedding = self._get_embedding(text)
        vector_id = self._generate_id(f"icd10_{code}", "icd10")
        
        metadata_dict = {
            "source": "icd10_code",
            "code": code,
            "description": description,
            "text": text
        }
        if metadata:
            metadata_dict.update(metadata)
        
        self.index.upsert(
            vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": metadata_dict
            }],
            namespace=self.NAMESPACE_KB
        )
        
        return vector_id
    
    def add_loinc_code(
        self,
        code: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add LOINC code to knowledge base namespace
        
        Args:
            code: LOINC code
            description: Description of the LOINC code
            metadata: Additional metadata
        
        Returns:
            Vector ID
        """
        text = f"LOINC Code {code}: {description}"
        embedding = self._get_embedding(text)
        vector_id = self._generate_id(f"loinc_{code}", "loinc")
        
        metadata_dict = {
            "source": "loinc_code",
            "code": code,
            "description": description,
            "text": text
        }
        if metadata:
            metadata_dict.update(metadata)
        
        self.index.upsert(
            vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": metadata_dict
            }],
            namespace=self.NAMESPACE_KB
        )
        
        return vector_id
    
    def add_payer_policy(
        self,
        payer_id: str,
        policy_text: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add payer policy to knowledge base namespace
        
        Args:
            payer_id: Payer identifier (e.g., "aetna", "medicare")
            policy_text: Policy text/description
            metadata: Additional metadata
        
        Returns:
            Vector ID
        """
        embedding = self._get_embedding(policy_text)
        vector_id = self._generate_id(f"policy_{payer_id}_{policy_text}", "policy")
        
        metadata_dict = {
            "source": "payer_policy",
            "payer_id": payer_id,
            "text": policy_text
        }
        if metadata:
            metadata_dict.update(metadata)
        
        self.index.upsert(
            vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": metadata_dict
            }],
            namespace=self.NAMESPACE_KB
        )
        
        return vector_id
    
    def add_lab_test_definition(
        self,
        test_name: str,
        definition: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add lab test definition to knowledge base namespace
        
        Args:
            test_name: Name of the lab test (e.g., "Creatinine")
            definition: Plain-English definition
            metadata: Additional metadata
        
        Returns:
            Vector ID
        """
        text = f"{test_name} Lab Test: {definition}"
        embedding = self._get_embedding(text)
        vector_id = self._generate_id(f"lab_{test_name}", "lab")
        
        metadata_dict = {
            "source": "lab_test_definition",
            "test_name": test_name,
            "definition": definition,
            "text": text
        }
        if metadata:
            metadata_dict.update(metadata)
        
        self.index.upsert(
            vectors=[{
                "id": vector_id,
                "values": embedding,
                "metadata": metadata_dict
            }],
            namespace=self.NAMESPACE_KB
        )
        
        return vector_id
    
    # ==================== PRIVATE NAMESPACE ====================
    
    def add_user_document(
        self,
        user_id: str,
        doc_type: str,
        doc_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        chunk_text: bool = True,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        chunk_strategy: str = "sentence"
    ) -> Union[str, List[str]]:
        """
        Add user-specific document to private namespace
        
        Args:
            user_id: User identifier (e.g., "user-123")
            doc_type: Document type (e.g., "lab_report", "bill", "clinical_note")
            doc_id: Document identifier
            text: Document text content
            metadata: Additional metadata (will be merged with required metadata)
            chunk_text: Whether to chunk the text (default: True)
            chunk_size: Maximum characters per chunk (default: 1000)
            chunk_overlap: Characters to overlap between chunks (default: 200)
            chunk_strategy: Chunking strategy - 'sentence', 'paragraph', or 'fixed' (default: 'sentence')
        
        Returns:
            Vector ID (if not chunked) or List of vector IDs (if chunked)
        """
        # If text is short or chunking is disabled, store as single vector
        if not chunk_text or len(text) <= chunk_size:
            embedding = self._get_embedding(text)
            vector_id = self._generate_id(f"{user_id}_{doc_type}_{doc_id}_{text}", "doc")
            
            # CRITICAL: Every vector must be tagged with owner and type
            metadata_dict = {
                "user_id": user_id,
                "doc_type": doc_type,
                "doc_id": doc_id,
                "text": text
            }
            if metadata:
                metadata_dict.update(metadata)
            
            self.index.upsert(
                vectors=[{
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata_dict
                }],
                namespace=self.NAMESPACE_PRIVATE
            )
            
            return vector_id
        
        # Chunk the text for better retrieval
        chunks = self._chunk_text(
            text, 
            chunk_size=chunk_size, 
            chunk_overlap=chunk_overlap,
            strategy=chunk_strategy
        )
        
        # Use the existing chunk method
        return self.add_user_document_chunks(
            user_id=user_id,
            doc_type=doc_type,
            doc_id=doc_id,
            chunks=chunks,
            metadata=metadata
        )
    
    def add_user_document_chunks(
        self,
        user_id: str,
        doc_type: str,
        doc_id: str,
        chunks: List[str],
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Add user document as multiple chunks to private namespace
        
        Args:
            user_id: User identifier
            doc_type: Document type
            doc_id: Document identifier
            chunks: List of text chunks
            metadata: Additional metadata for all chunks
        
        Returns:
            List of vector IDs
        """
        vector_ids = []
        vectors = []
        
        for chunk_idx, chunk_text in enumerate(chunks):
            embedding = self._get_embedding(chunk_text)
            vector_id = self._generate_id(
                f"{user_id}_{doc_type}_{doc_id}_{chunk_idx}_{chunk_text}",
                "chunk"
            )
            
            metadata_dict = {
                "user_id": user_id,
                "doc_type": doc_type,
                "doc_id": doc_id,
                "chunk_index": chunk_idx,
                "text": chunk_text
            }
            if metadata:
                metadata_dict.update(metadata)
            
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": metadata_dict
            })
            vector_ids.append(vector_id)
        
        # Batch upsert
        self.index.upsert(
            vectors=vectors,
            namespace=self.NAMESPACE_PRIVATE
        )
        
        return vector_ids
    
    # ==================== QUERY METHODS ====================
    
    def query_kb(
        self,
        query_text: str,
        top_k: int = 5,
        filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query knowledge base namespace
        
        Args:
            query_text: Query text
            top_k: Number of results to return
            filter: Metadata filter (e.g., {"source": {"$in": ["cpt_code", "payer_policy"]}})
        
        Returns:
            Query results with matches and metadata
        """
        query_embedding = self._get_embedding(query_text)
        
        query_response = self.index.query(
            namespace=self.NAMESPACE_KB,
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter
        )
        
        return {
            "matches": [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in query_response.matches
            ],
            "namespace": self.NAMESPACE_KB,
            "query": query_text
        }
    
    def query_private(
        self,
        query_text: str,
        user_id: str,
        doc_types: Optional[List[str]] = None,
        top_k: int = 5,
        additional_filter: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Query private namespace for a specific user
        
        Args:
            query_text: Query text
            user_id: User identifier (required for multi-tenancy)
            doc_types: List of document types to filter (e.g., ["bill", "lab_report"])
            top_k: Number of results to return
            additional_filter: Additional metadata filters
        
        Returns:
            Query results with matches and metadata
        """
        query_embedding = self._get_embedding(query_text)
        
        # CRITICAL: Build filter for multi-tenancy
        filter_dict = {
            "user_id": {"$eq": user_id}
        }
        
        if doc_types:
            filter_dict["doc_type"] = {"$in": doc_types}
        
        if additional_filter:
            filter_dict.update(additional_filter)
        
        query_response = self.index.query(
            namespace=self.NAMESPACE_PRIVATE,
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter_dict
        )
        
        return {
            "matches": [
                {
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata
                }
                for match in query_response.matches
            ],
            "namespace": self.NAMESPACE_PRIVATE,
            "user_id": user_id,
            "query": query_text
        }
    
    # ==================== UTILITY METHODS ====================
    
    def delete_user_data(self, user_id: str, namespace: str = NAMESPACE_PRIVATE):
        """Delete all vectors for a specific user"""
        # Note: Pinecone doesn't support delete by filter directly
        # This is a placeholder - in production, you'd need to:
        # 1. Query to get all vector IDs for the user
        # 2. Delete them in batches
        print(f"Warning: Bulk delete by user_id not implemented. "
              f"Use delete_vectors() with specific IDs instead.")
    
    def get_index_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        stats = self.index.describe_index_stats()
        return {
            "total_vector_count": stats.total_vector_count,
            "dimension": stats.dimension,
            "index_fullness": stats.index_fullness,
            "namespaces": {
                ns: {
                    "vector_count": ns_stats.vector_count
                }
                for ns, ns_stats in stats.namespaces.items()
            }
        }
    
    def test_pinecone_connection(self) -> bool:
        """
        Test Pinecone connection using PINECONE_API_KEY (default project)
        
        This method tests:
        - Direct API connection using PINECONE_API_KEY
        - Access to default project
        - Index accessibility
        
        Returns:
            True if connection is successful, raises exception otherwise
        """
        try:
            # Test by listing indexes (direct API connection, default project)
            indexes = list(self.pc.list_indexes())
            print(f"✓ Pinecone connection successful (default project)!")
            print(f"  - Found {len(indexes)} index(es) in default project")
            if indexes:
                print(f"  - Indexes: {[idx.name for idx in indexes]}")
            
            # Test index connection
            stats = self.index.describe_index_stats()
            print(f"✓ Index '{self.INDEX_NAME}' is accessible in default project")
            print(f"  - Total vectors: {stats.total_vector_count}")
            print(f"  - Dimension: {stats.dimension}")
            
            # Show namespace information if available
            if hasattr(stats, 'namespaces') and stats.namespaces:
                print(f"  - Namespaces: {list(stats.namespaces.keys())}")
                for ns_name, ns_stats in stats.namespaces.items():
                    print(f"    • {ns_name}: {ns_stats.vector_count} vectors")
            
            return True
        except Exception as e:
            raise ConnectionError(
                f"Pinecone connection test failed. "
                f"Pinecone uses direct API connection with PINECONE_API_KEY in default project (not through Azure). "
                f"Please verify your PINECONE_API_KEY is correct and has proper permissions. Error: {e}"
            )
    
    def get_pinecone_config(self) -> Dict[str, Any]:
        """
        Get Pinecone configuration information
        
        Returns:
            Dictionary with Pinecone configuration details
            Note: Pinecone uses direct API connection with default project (not through Azure)
        """
        config = {
            "connection_type": "Direct API (not through Azure)",
            "project": "Default project (associated with API key)",
            "authentication_method": "API Key (PINECONE_API_KEY)",
            "api_key_configured": bool(self.pinecone_api_key),
            "api_key_length": len(self.pinecone_api_key) if self.pinecone_api_key else 0,
            "index_name": self.INDEX_NAME,
            "dimension": self.dimension,
            "spec": "serverless",
            "namespaces": {
                "kb": self.NAMESPACE_KB,
                "private": self.NAMESPACE_PRIVATE
            },
            "note": "Pinecone uses direct API connection with default project (separate from Azure AI Foundry)"
        }
        
        # Try to get additional project/index information
        try:
            indexes = list(self.pc.list_indexes())
            config["indexes_in_project"] = [idx.name for idx in indexes]
            config["total_indexes"] = len(indexes)
        except Exception:
            config["indexes_in_project"] = "Unable to list indexes"
            config["total_indexes"] = "Unknown"
        
        return config


# ==================== EXAMPLE USAGE ====================

if __name__ == "__main__":
    # Initialize store
    store = PineconeVectorStore()
    
    # Add knowledge base data
    print("Adding CPT code...")
    store.add_cpt_code(
        code="99214",
        description="Office or other outpatient visit for the evaluation and management of an established patient"
    )
    
    print("Adding payer policy...")
    store.add_payer_policy(
        payer_id="aetna",
        policy_text="Aetna covers routine lab tests when medically necessary"
    )
    
    print("Adding lab test definition...")
    store.add_lab_test_definition(
        test_name="Creatinine",
        definition="A blood test that measures how well your kidneys are filtering waste from your blood"
    )
    
    # Add user-specific data
    print("Adding user document...")
    store.add_user_document(
        user_id="user-123",
        doc_type="lab_report",
        doc_id="lab-abc",
        text="Creatinine test result: 1.2 mg/dL (normal range: 0.6-1.2)"
    )
    
    store.add_user_document(
        user_id="user-123",
        doc_type="bill",
        doc_id="bill-xyz",
        text="Charge for Creatinine test: $150.00"
    )
    
    # Query examples
    print("\nQuerying knowledge base...")
    kb_results = store.query_kb(
        query_text="Creatinine CPT code",
        filter={"source": {"$in": ["cpt_code", "payer_policy"]}}
    )
    print(f"Found {len(kb_results['matches'])} results")
    
    print("\nQuerying private namespace...")
    private_results = store.query_private(
        query_text="Why was I charged for Creatinine test?",
        user_id="user-123",
        doc_types=["bill", "lab_report"]
    )
    print(f"Found {len(private_results['matches'])} results")
    
    # Get stats
    print("\nIndex stats:")
    stats = store.get_index_stats()
    print(stats)

