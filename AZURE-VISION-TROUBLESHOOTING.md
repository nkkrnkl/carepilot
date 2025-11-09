# Azure Computer Vision Troubleshooting Guide

## Common Issues and Solutions

### 1. "Couldn't parse this file. Azure Vision, Lab Agent, and OpenAI Vision all failed."

This error indicates that Azure Computer Vision is not working properly. Check the following:

#### Check 1: Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Make sure `azure-cognitiveservices-vision-computervision` is installed:
```bash
pip list | grep azure-cognitiveservices-vision-computervision
```

Or install directly:
```bash
pip install --upgrade azure-cognitiveservices-vision-computervision
pip install pillow
pip install msrest
```

#### Check 2: Environment Variables
Ensure `.env` file contains:
```env
VISION_KEY=your_vision_key_here
VISION_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
```

#### Check 3: Server Logs
Check the server logs for detailed error messages. Look for:
- `🔵 Starting Azure Computer Vision analysis...`
- `✅ Azure Computer Vision extracted text successfully`
- `❌ Azure Computer Vision failed: [error message]`

#### Check 4: Python Script Execution
Test the Python script directly:
```bash
cd backend/scripts
python3 analyze_lab_with_azure_vision.py
```

### 2. "Azure Vision returned empty text"

This means Azure Vision processed the image but didn't extract any text. Possible causes:
- Image is too blurry or low quality
- Image doesn't contain text
- Text is in an unsupported language
- Image format issues

**Solution**: Try a different image or check image quality.

### 3. "Missing Azure Computer Vision SDK"

This means the Python package is not installed.

**Solution**:
```bash
pip install --upgrade azure-cognitiveservices-vision-computervision
pip install pillow
pip install msrest
```

### 4. "Azure Computer Vision credentials not set"

This means the environment variables are not loaded.

**Solution**:
1. Check `.env` file exists and contains `VISION_KEY` and `VISION_ENDPOINT`
2. Restart the development server after updating `.env`
3. Verify environment variables are loaded: `echo $VISION_KEY`

### 5. "Image file not found"

This means the file path is incorrect.

**Solution**:
- Check that the file was uploaded successfully
- Verify file permissions
- Check server logs for the actual file path

## Debugging Steps

1. **Enable Detailed Logging**: The script now includes detailed logging with emojis:
   - 🔵 = Information/Processing
   - ✅ = Success
   - ❌ = Error
   - ⚠️ = Warning

2. **Check Server Console**: Look for Azure Vision log messages in the server console.

3. **Test Python Script Directly**:
   ```bash
   cd backend/scripts
   python3 analyze_lab_with_azure_vision.py input.json output.json
   ```
   
   Create `input.json`:
   ```json
   {
     "image_path": "/path/to/your/image.png"
   }
   ```

4. **Verify Azure Service**: Check Azure Portal to ensure the Computer Vision service is active and the key/endpoint are correct.

## Expected Flow

1. File uploaded → Saved to disk
2. PDF converted to image (if PDF)
3. Azure Vision script called with image path
4. Azure Vision extracts text
5. OpenAI parses extracted text
6. Data saved to database

## Getting Help

If issues persist:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Test the Python script directly
4. Check Azure Portal for service status
5. Verify image file format and quality

