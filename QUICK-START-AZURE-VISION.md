# Quick Start: Azure Computer Vision Setup

## Problem Solved

Azure Computer Vision wasn't working because the Python dependencies weren't installed. This has been fixed by:

1. ✅ Creating a Python virtual environment in `backend/venv`
2. ✅ Installing all required dependencies (including Azure Computer Vision SDK)
3. ✅ Updating the Python bridge to automatically use the virtual environment

## Setup Complete! ✅

The virtual environment is already set up and ready to use. The Python bridge will automatically detect and use it.

## Verify Installation

To verify everything is working:

```bash
cd backend
source venv/bin/activate
python -c "from azure.cognitiveservices.vision.computervision import ComputerVisionClient; print('✅ Azure Computer Vision SDK is installed!')"
```

## If You Need to Reinstall

If you need to recreate the virtual environment:

```bash
cd backend
./setup-venv.sh
```

Or manually:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## How It Works

1. The Python bridge (`lib/python-bridge.ts`) automatically detects if `backend/venv/bin/python` exists
2. If it exists, it uses that Python interpreter (which has all dependencies installed)
3. If it doesn't exist, it falls back to system `python3`

## Testing

1. Restart your development server: `npm run dev`
2. Upload a lab report
3. Check server logs for:
   - `🐍 Using Python executable: [path to venv python]`
   - `🔵 Starting Azure Computer Vision analysis...`
   - `✅ Azure Computer Vision extracted text successfully`

## Troubleshooting

If you see "ModuleNotFoundError: No module named 'azure'":
- Make sure the virtual environment exists: `ls -la backend/venv/bin/python`
- Reinstall dependencies: `cd backend && source venv/bin/activate && pip install -r requirements.txt`

If Azure Vision still doesn't work:
- Check server logs for detailed error messages
- Verify environment variables are set in `.env`:
  - `VISION_KEY=...`
  - `VISION_ENDPOINT=...`

