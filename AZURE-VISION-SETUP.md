# Azure Computer Vision Setup for Lab Analysis

## Overview
The lab analysis feature now uses Azure Computer Vision to extract text from lab report images and PDFs. This provides high-quality OCR (Optical Character Recognition) for processing lab reports.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Azure Computer Vision
VISION_KEY=your_vision_key_here
VISION_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
```

## Installation

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

This will install `azure-cognitiveservices-vision-computervision`, `pillow`, and `msrest` which are required for Azure Computer Vision integration.

Alternatively, install directly:
```bash
pip install --upgrade azure-cognitiveservices-vision-computervision
pip install pillow
pip install msrest
```

## How It Works

### Processing Flow

1. **File Upload**: User uploads a PDF or image (PNG/JPG) of a lab report
2. **PDF Conversion**: If a PDF is uploaded, it's converted to an image (first page)
3. **Azure Computer Vision Read API**: The image is analyzed using Azure Computer Vision's asynchronous Read API to extract text (OCR)
   - The Read API is called with the image file
   - An operation ID is returned
   - The script polls for results until the operation completes
   - Text is extracted line by line from the results
4. **Text Parsing**: The extracted text is parsed using OpenAI to extract structured lab data (parameters, dates, etc.)
5. **Lab Agent**: Optionally, the lab agent processes the file for advanced analysis
6. **Storage**: Results are saved to the database and Pinecone vector store

### Fallback Chain

The system uses a fallback chain for reliability:

1. **Primary**: Azure Computer Vision (text extraction) → OpenAI (text parsing)
2. **Secondary**: Lab Agent (if available)
3. **Tertiary**: OpenAI Vision (direct image analysis)

## Files

### Python Script
- `backend/scripts/analyze_lab_with_azure_vision.py`: Python script that uses Azure Computer Vision Read API to extract text from images
  - Uses `ComputerVisionClient` from `azure-cognitiveservices-vision-computervision`
  - Implements asynchronous Read API with polling for results
  - Supports both file-based and URL-based image analysis

### API Route
- `app/api/labs/upload/route.ts`: Updated upload route that integrates Azure Computer Vision

### Library Functions
- `lib/openai.ts`: Added `extractLabDataFromText()` function to parse extracted text

## Usage

The Azure Computer Vision integration is automatically used when uploading lab reports. No additional configuration is needed once the environment variables are set.

## Features

- **Text Extraction**: Extracts printed and handwritten text from lab report images
- **High Accuracy**: Azure Computer Vision provides high-accuracy OCR
- **Multiple Formats**: Supports PDF, PNG, and JPG files
- **Structured Data**: Extracted text is parsed into structured lab parameters

## API Reference

### Azure Computer Vision Read API

The implementation uses the **Read API** which is specifically designed for extracting printed and handwritten text from images:

- **Asynchronous Processing**: The Read API uses an asynchronous pattern
  1. Call `read_in_stream()` or `read()` with the image
  2. Get an operation ID from the response
  3. Poll `get_read_result()` until the operation completes
  4. Extract text line by line from the results

- **Features**:
  - Extracts printed text (OCR)
  - Extracts handwritten text
  - Returns text with bounding box coordinates
  - Supports multiple languages
  - High accuracy for documents and forms

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure `VISION_KEY` and `VISION_ENDPOINT` are set in `.env`
   - Restart the development server after updating `.env`

2. **Python Dependencies**
   - Run `pip install -r backend/requirements.txt` to install required packages
   - Ensure `azure-ai-vision-imageanalysis` is installed

3. **API Errors**
   - Verify the Azure Computer Vision key and endpoint are correct
   - Check Azure portal for service status
   - Review server logs for detailed error messages

## Next Steps

- Consider adding support for multi-page PDFs
- Implement caching for repeated analyses
- Add support for additional image formats
- Enhance error handling and user feedback

