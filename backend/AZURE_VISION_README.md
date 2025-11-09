# Azure Computer Vision READ API Integration

## Overview

The document processing pipeline has been updated to use **Azure Computer Vision Image Analysis 4.0 READ API** as the primary method for extracting text from images and PDFs. This provides superior OCR capabilities compared to local libraries, especially for:

- Scanned documents
- Complex PDF layouts
- Images with text (photos, screenshots)
- Handwritten text recognition
- Multi-page PDF documents

## Configuration

### 1. Install Dependencies

The Azure Computer Vision SDK has been added to `requirements.txt`:

```bash
pip install -r backend/requirements.txt
```

This will install `azure-ai-vision-imageanalysis`.

### 2. Set Environment Variables

Add the following to your `.env` or `.env.local` file:

```env
# Azure Computer Vision (Image Analysis 4.0)
VISION_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
VISION_KEY=your_vision_api_key_here
```

**To get your credentials:**
1. Go to Azure Portal
2. Create or select a Computer Vision resource
3. Copy the **Endpoint** URL
4. Copy one of the **Keys** (Key1 or Key2)

### 3. How It Works

The `DocumentProcessor` class now:

1. **Primary Method**: Uses Azure Computer Vision READ API
   - Automatically detects text in images and PDFs
   - Handles complex layouts and multi-page documents
   - Provides high-accuracy OCR

2. **Fallback Methods**: If Azure Computer Vision is not configured, falls back to:
   - `UnstructuredPDFLoader` (for PDFs)
   - `pdfplumber` (for PDFs)
   - `PyPDF2` (for PDFs)

## Supported File Formats

### Images (requires Azure Computer Vision):
- `.jpg`, `.jpeg`
- `.png`
- `.bmp`
- `.gif`
- `.tiff`, `.tif`

### PDFs:
- Uses Azure Computer Vision READ API if configured
- Falls back to local libraries if not configured

### Text Files:
- `.txt` - Direct text extraction (no Azure Vision needed)

## Usage

The document processor is used automatically when you upload documents through the API:

```python
from document_processor import DocumentProcessor

# Initialize (reads VISION_ENDPOINT and VISION_KEY from environment)
processor = DocumentProcessor()

# Or pass credentials explicitly
processor = DocumentProcessor(
    vision_endpoint="https://your-endpoint.cognitiveservices.azure.com/",
    vision_key="your_key"
)

# Extract text from a file
result = processor.extract_text(
    file_content=file_bytes,
    file_name="document.pdf",
    file_type="application/pdf"
)

if result["success"]:
    text = result["text"]
    method = result["method"]  # Will be "azure_vision_read" if using Azure Vision
```

## Benefits

1. **Better Accuracy**: Azure Computer Vision provides state-of-the-art OCR
2. **Handles Scanned Documents**: Can extract text from scanned PDFs and images
3. **Complex Layouts**: Better handling of tables, multi-column layouts, etc.
4. **No Local Dependencies**: Reduces need for local OCR libraries
5. **Scalable**: Cloud-based processing scales automatically

## Troubleshooting

### "Azure Computer Vision client not initialized"

This means `VISION_ENDPOINT` and `VISION_KEY` are not set. Either:
- Add them to your `.env` file, or
- Pass them to `DocumentProcessor()` constructor

### "No text extracted from document"

- Check that the document actually contains text (not just images)
- Verify your Azure Computer Vision resource is active
- Check that your API key is valid

### Falls back to local libraries

If Azure Computer Vision fails, the system automatically falls back to local PDF extraction libraries. This ensures the system continues to work even if Azure Vision is unavailable.

## Migration Notes

- Existing code using `DocumentProcessor` will continue to work
- If Azure Vision is not configured, it falls back to previous methods
- No breaking changes to the API

## Cost Considerations

Azure Computer Vision READ API is billed per transaction. Check Azure pricing for current rates. For high-volume usage, consider:
- Using local libraries for simple PDFs
- Using Azure Vision for scanned documents and images
- Implementing caching for frequently accessed documents

