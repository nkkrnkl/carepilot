# Debugging Azure Vision Integration

## Quick Checklist

1. **Server Restart**: Make sure the development server has been restarted after code changes
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

2. **Python Dependencies**: Ensure Azure Computer Vision SDK is installed
   ```bash
   cd backend
   pip install --upgrade azure-cognitiveservices-vision-computervision
   pip install pillow
   pip install msrest
   ```

3. **Environment Variables**: Check `.env` file has the correct credentials
```env
VISION_KEY=your_vision_key_here
VISION_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
```

4. **Check Server Logs**: When uploading a file, look for these log messages:
   - `🔵 Starting Azure Computer Vision analysis...`
   - `🔵 Calling Azure Vision script: [path]`
   - `🔵 Azure Vision result: [result]`
   - `✅ Azure Computer Vision extracted text successfully` OR
   - `❌ Azure Computer Vision failed: [error]`

## Common Issues

### Issue: "Both lab agent and OpenAI Vision failed" error

This means Azure Vision is not being attempted or is failing silently.

**Debug steps:**
1. Check server console logs when uploading
2. Look for Azure Vision log messages (🔵, ✅, ❌)
3. If no Azure Vision logs appear, the script might not be executing
4. Check if Python script exists: `backend/scripts/analyze_lab_with_azure_vision.py`
5. Test Python script directly:
   ```bash
   cd backend/scripts
   python3 analyze_lab_with_azure_vision.py
   ```

### Issue: Azure Vision script not found

**Solution:**
- Verify file exists: `ls -la backend/scripts/analyze_lab_with_azure_vision.py`
- Check file permissions: `chmod +x backend/scripts/analyze_lab_with_azure_vision.py`

### Issue: Python import errors

**Solution:**
```bash
pip install --upgrade azure-cognitiveservices-vision-computervision
pip install pillow
pip install msrest
```

### Issue: Environment variables not loaded

**Solution:**
- Verify `.env` file exists in project root
- Restart development server after updating `.env`
- Check if `python-dotenv` is installed: `pip install python-dotenv`

## Testing Azure Vision Directly

Create a test script to verify Azure Vision works:

```python
# test_azure_vision.py
import os
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from msrest.authentication import CognitiveServicesCredentials
from dotenv import load_dotenv

load_dotenv()

VISION_KEY = os.getenv("VISION_KEY")
VISION_ENDPOINT = os.getenv("VISION_ENDPOINT")

print(f"Key: {VISION_KEY[:10]}...")
print(f"Endpoint: {VISION_ENDPOINT}")

client = ComputerVisionClient(
    VISION_ENDPOINT,
    CognitiveServicesCredentials(VISION_KEY)
)

print("✅ Azure Vision client created successfully")
```

Run it:
```bash
python3 test_azure_vision.py
```

## Expected Flow

1. File uploaded → Saved to disk
2. **Azure Vision called first** → `🔵 Starting Azure Computer Vision analysis...`
3. Python script executed → `🔵 Calling Azure Vision script...`
4. Text extracted → `✅ Azure Computer Vision extracted text successfully`
5. OpenAI parses text → `✅ Successfully parsed Azure Vision extracted text`
6. Data saved to database

If step 2-4 fails, you'll see error logs with detailed information.

## Getting Detailed Logs

The updated code now includes extensive logging:
- 🔵 = Information/Processing
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning

Check your server console for these messages when uploading a file.

