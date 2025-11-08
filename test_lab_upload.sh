#!/bin/bash
# Test script to debug lab upload functionality

echo "=== Lab Upload Debug Test ==="
echo ""

# Test 1: Check Python venv
echo "1. Checking Python virtual environment..."
if [ -f "backend/venv/bin/python3" ]; then
    echo "   ✓ Virtual environment exists"
    backend/venv/bin/python3 --version
else
    echo "   ✗ Virtual environment missing"
fi
echo ""

# Test 2: Check Python dependencies
echo "2. Checking Python dependencies..."
cd backend
source venv/bin/activate
python3 -c "import openai; import pinecone; from pinecone_store import PineconeVectorStore; print('   ✓ All imports successful')" 2>&1 | head -5
cd ..
echo ""

# Test 3: Test text extraction script
echo "3. Testing text extraction script..."
if [ -f "backend/scripts/extract_text.py" ]; then
    echo "   ✓ Script exists"
    chmod +x backend/scripts/extract_text.py
else
    echo "   ✗ Script missing"
fi
echo ""

# Test 4: Test lab processing script
echo "4. Testing lab processing script..."
if [ -f "backend/scripts/process_lab_report.py" ]; then
    echo "   ✓ Script exists"
    chmod +x backend/scripts/process_lab_report.py
else
    echo "   ✗ Script missing"
fi
echo ""

# Test 5: Check environment variables
echo "5. Checking environment variables..."
cd backend
source venv/bin/activate
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv('../.env')
keys = ['OPENAI_API_KEY', 'PINECONE_API_KEY', 'AZURE_OPENAI_API_KEY']
for key in keys:
    val = os.getenv(key)
    if val:
        print(f'   ✓ {key}: SET (length: {len(val)})')
    else:
        print(f'   ✗ {key}: MISSING')
"
cd ..
echo ""

# Test 6: Test API endpoint
echo "6. Testing API endpoint availability..."
if curl -s http://localhost:3000/api/labs/upload > /dev/null 2>&1; then
    echo "   ✓ API endpoint is accessible"
else
    echo "   ✗ API endpoint not accessible (is server running?)"
fi
echo ""

echo "=== Debug Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Open browser console (F12) and try uploading"
echo "2. Check server terminal for [python-bridge] and [lab-upload] logs"
echo "3. Check for errors in browser Network tab"


