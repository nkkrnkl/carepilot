#!/usr/bin/env python3
"""
Simple test script for LabAgent
Run this to test if the lab agent works with your .env configuration
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from lab_agent import LabAgent
    print("✓ LabAgent imported successfully!")
    
    # Test initialization (this will load .env automatically)
    print("\nInitializing LabAgent...")
    agent = LabAgent()
    print("✓ LabAgent initialized successfully!")
    print("✓ Pinecone connection established!")
    print("✓ All dependencies loaded!")
    
    print("\n" + "="*60)
    print("Lab Agent is ready to use!")
    print("="*60)
    print("\nTo process a lab report, use:")
    print("""
    result = agent.process_lab(
        user_id="demo-user",
        file_path="path/to/your/lab_report.pdf",
        file_type="pdf"  # or "png", "jpg"
    )
    """)
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nMake sure you have installed all dependencies:")
    print("  cd backend && pip install -r requirements.txt")
    sys.exit(1)
    
except Exception as e:
    print(f"✗ Error: {e}")
    print("\nCheck that:")
    print("  1. All API keys are set in .env file")
    print("  2. Dependencies are installed: pip install -r backend/requirements.txt")
    print("  3. Pinecone index 'care-pilot' exists (will be created automatically)")
    sys.exit(1)

