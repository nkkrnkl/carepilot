"""
Document Processor for extracting text from various file formats

Handles PDF, text files, and other document types for processing before chunking.
Uses UnstructuredPDFLoader from LangChain for robust PDF processing.
"""

import os
import tempfile
from typing import Optional, Dict, Any
from pathlib import Path
import base64

try:
    from langchain_community.document_loaders import UnstructuredPDFLoader
    UNSTRUCTURED_AVAILABLE = True
except ImportError:
    UNSTRUCTURED_AVAILABLE = False

# Fallback libraries (kept as backup)
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

try:
    from PyPDF2 import PdfReader
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False


class DocumentProcessor:
    """Process documents and extract text for vectorization"""
    
    def __init__(self):
        """Initialize document processor"""
        self.supported_formats = {
            '.pdf': self._extract_pdf_text,
            '.txt': self._extract_text_file,
            '.doc': self._extract_text_file,  # Placeholder - would need python-docx
            '.docx': self._extract_text_file,  # Placeholder - would need python-docx
        }
    
    def extract_text(
        self,
        file_content: bytes,
        file_name: str,
        file_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extract text from a document file
        
        Args:
            file_content: File content as bytes
            file_name: Name of the file
            file_type: MIME type of the file (optional)
        
        Returns:
            Dictionary with extracted text and metadata
        """
        # Determine file extension
        file_ext = Path(file_name).suffix.lower()
        
        # Get extraction method
        extract_method = self.supported_formats.get(file_ext)
        
        if not extract_method:
            # Try to extract as plain text
            try:
                text = file_content.decode('utf-8')
                return {
                    "text": text,
                    "method": "plain_text",
                    "success": True
                }
            except UnicodeDecodeError:
                return {
                    "text": "",
                    "method": "unknown",
                    "success": False,
                    "error": f"Unsupported file format: {file_ext}"
                }
        
        try:
            text = extract_method(file_content, file_name)
            method_name = "unstructured_pdf" if file_ext == ".pdf" and UNSTRUCTURED_AVAILABLE else file_ext
            return {
                "text": text,
                "method": method_name,
                "success": True
            }
        except Exception as e:
            return {
                "text": "",
                "method": file_ext,
                "success": False,
                "error": str(e)
            }
    
    def _extract_pdf_text(self, file_content: bytes, file_name: str) -> str:
        """
        Extract text from PDF file using UnstructuredPDFLoader
        
        UnstructuredPDFLoader provides better handling of complex PDF layouts,
        tables, and various document structures compared to basic PDF libraries.
        """
        # Try UnstructuredPDFLoader first (preferred method)
        if UNSTRUCTURED_AVAILABLE:
            try:
                # UnstructuredPDFLoader requires a file path, so we create a temporary file
                with tempfile.NamedTemporaryFile(
                    delete=False, 
                    suffix='.pdf',
                    prefix='pdf_extract_'
                ) as temp_file:
                    temp_file.write(file_content)
                    temp_file_path = temp_file.name
                
                try:
                    # Use UnstructuredPDFLoader with "elements" mode for better structure
                    # This splits the document into elements (titles, paragraphs, etc.)
                    loader = UnstructuredPDFLoader(
                        temp_file_path,
                        mode="elements"  # Split into structured elements
                    )
                    documents = loader.load()
                    
                    # Combine all document elements
                    text_parts = [doc.page_content for doc in documents if doc.page_content.strip()]
                    
                    if text_parts:
                        return "\n\n".join(text_parts)
                    else:
                        raise Exception("No text extracted from PDF")
                        
                finally:
                    # Clean up temporary file
                    try:
                        os.unlink(temp_file_path)
                    except Exception:
                        pass  # Ignore cleanup errors
                        
            except Exception as e:
                # Fall back to other methods if UnstructuredPDFLoader fails
                if not PDFPLUMBER_AVAILABLE and not PYPDF2_AVAILABLE:
                    raise Exception(f"UnstructuredPDFLoader failed and no fallback available: {str(e)}")
                # Continue to fallback methods below
        
        # Fallback to pdfplumber (better for complex PDFs)
        if PDFPLUMBER_AVAILABLE:
            try:
                import io
                pdf_file = io.BytesIO(file_content)
                text_parts = []
                
                with pdfplumber.open(pdf_file) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                
                if text_parts:
                    return "\n\n".join(text_parts)
            except Exception as e:
                # Fall back to PyPDF2 if pdfplumber fails
                if not PYPDF2_AVAILABLE:
                    raise e
        
        # Fallback to PyPDF2 (basic extraction)
        if PYPDF2_AVAILABLE:
            try:
                import io
                pdf_file = io.BytesIO(file_content)
                pdf_reader = PdfReader(pdf_file)
                text_parts = []
                
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                
                return "\n\n".join(text_parts)
            except Exception as e:
                raise Exception(f"Failed to extract PDF text: {str(e)}")
        
        raise Exception(
            "No PDF extraction library available. "
            "Install unstructured[pdf] (recommended), pdfplumber, or PyPDF2."
        )
    
    def _extract_text_file(self, file_content: bytes, file_name: str) -> str:
        """Extract text from plain text file"""
        try:
            # Try UTF-8 first
            return file_content.decode('utf-8')
        except UnicodeDecodeError:
            # Try other encodings
            for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    return file_content.decode(encoding)
                except UnicodeDecodeError:
                    continue
            raise Exception("Could not decode text file with any supported encoding")
    
    def chunk_text(
        self,
        text: str,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        strategy: str = "sentence"
    ) -> list[str]:
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
    
    def _chunk_by_paragraph(self, text: str, chunk_size: int, overlap: int) -> list[str]:
        """Chunk text by paragraphs"""
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
                    # Paragraph itself is too long, split it
                    chunks.append(para[:chunk_size])
                    current_chunk = para[chunk_size - overlap:]
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_by_sentence(self, text: str, chunk_size: int, overlap: int) -> list[str]:
        """Chunk text by sentences (with smart boundary detection)"""
        import re
        
        # Split by sentence endings
        sentences = re.split(r'(?<=[.!?])\s+', text)
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
                    current_chunk = sentence[chunk_size - overlap:]
            else:
                if current_chunk:
                    current_chunk += " " + sentence
                else:
                    current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    def _chunk_fixed(self, text: str, chunk_size: int, overlap: int) -> list[str]:
        """Chunk text with fixed size (simple sliding window)"""
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
                    chunk.rfind('\n\n')
                )
                
                if sentence_end > chunk_size * 0.5:
                    chunk = chunk[:sentence_end + 1]
                    end = start + len(chunk)
            
            chunks.append(chunk.strip())
            
            # Move start position with overlap
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks

