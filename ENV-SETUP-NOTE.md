# Environment Variables Setup

## Azure Computer Vision

Add the following to your `.env` file:

```env
# Azure Computer Vision for Lab Analysis
VISION_KEY=your_vision_key_here
VISION_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
```

## Installation Steps

1. **Install Python Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   
   Or install directly:
   ```bash
   pip install --upgrade azure-cognitiveservices-vision-computervision
   pip install pillow
   pip install msrest
   ```

2. **Add Environment Variables**:
   - Open `.env` file in the project root
   - Add the `VISION_KEY` and `VISION_ENDPOINT` variables above
   - Save the file

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

## Verification

After setup, upload a lab report image or PDF to test the Azure Computer Vision integration. Check the server logs for:
- "Azure Computer Vision extracted text successfully"
- "Extracted [N] characters"

## Troubleshooting

If you encounter issues:

1. **Check Environment Variables**: Ensure `VISION_KEY` and `VISION_ENDPOINT` are set correctly
2. **Check Python Dependencies**: Run `pip install -r backend/requirements.txt`
3. **Check Azure Service**: Verify the Azure Computer Vision service is active in Azure Portal
4. **Check Logs**: Review server logs for detailed error messages

