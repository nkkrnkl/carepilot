#!/usr/bin/env python3
"""
Test script to verify Azure Computer Vision READ API implementation
Based on Microsoft tutorial: https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/quickstarts-sdk/image-analysis-client-library-40
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError

def test_vision_api():
    """Test Azure Computer Vision READ API with a sample image URL"""
    
    # Load environment variables (from project root)
    project_root = Path(__file__).parent.parent
    env_file = project_root / '.env.local'
    if env_file.exists():
        load_dotenv(env_file, override=True)
    else:
        # Try .env as fallback
        load_dotenv(project_root / '.env', override=True)
    
    endpoint = os.getenv("VISION_ENDPOINT")
    key = os.getenv("VISION_KEY")
    
    if not endpoint or not key:
        print(f"✗ VISION_ENDPOINT and VISION_KEY must be set in .env.local")
        print(f"  Looking for: {env_file}")
        print(f"  File exists: {env_file.exists()}")
        print(f"  VISION_ENDPOINT: {endpoint}")
        print(f"  VISION_KEY: {'Set' if key else 'Not set'}")
        return False
    
    try:
        # Create client (following tutorial)
        client = ImageAnalysisClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key)
        )
        
        print("✓ Client created successfully")
        print(f"  Endpoint: {endpoint}")
        
        # Test with a sample image URL from the tutorial
        image_url = "https://learn.microsoft.com/azure/ai-services/computer-vision/media/quickstarts/presentation.png"
        
        print(f"\n📸 Analyzing image: {image_url}")
        
        # Analyze with READ feature (following tutorial)
        result = client.analyze(
            image_url=image_url,
            visual_features=[VisualFeatures.READ]
        )
        
        print("\n✓ Analysis completed")
        print("\n📋 Result structure:")
        print(f"  Result type: {type(result)}")
        print(f"  Has 'Read' attribute: {hasattr(result, 'Read')}")
        print(f"  Has 'read' attribute: {hasattr(result, 'read')}")
        
        # Try to access Read property
        if hasattr(result, 'Read') and result.Read:
            read_result = result.Read
            print(f"\n  Read type: {type(read_result)}")
            print(f"  Has 'Blocks' attribute: {hasattr(read_result, 'Blocks')}")
            print(f"  Has 'blocks' attribute: {hasattr(read_result, 'blocks')}")
            
            if hasattr(read_result, 'Blocks') and read_result.Blocks:
                print(f"  Number of blocks: {len(read_result.Blocks)}")
                for i, block in enumerate(read_result.Blocks[:3]):  # Show first 3 blocks
                    print(f"\n  Block {i+1}:")
                    print(f"    Type: {type(block)}")
                    print(f"    Has 'Lines' attribute: {hasattr(block, 'Lines')}")
                    if hasattr(block, 'Lines') and block.Lines:
                        print(f"    Number of lines: {len(block.Lines)}")
                        for j, line in enumerate(block.Lines[:2]):  # Show first 2 lines
                            print(f"\n    Line {j+1}:")
                            print(f"      Type: {type(line)}")
                            print(f"      Has 'Text' attribute: {hasattr(line, 'Text')}")
                            print(f"      Has 'text' attribute: {hasattr(line, 'text')}")
                            if hasattr(line, 'Text') and line.Text:
                                print(f"      Text: '{line.Text}'")
                            elif hasattr(line, 'text') and line.text:
                                print(f"      text: '{line.text}'")
                            if hasattr(line, 'Words') and line.Words:
                                print(f"      Words count: {len(line.Words)}")
        
        # Also try lowercase access
        elif hasattr(result, 'read') and result.read:
            read_result = result.read
            print(f"\n  read type: {type(read_result)}")
            if hasattr(read_result, 'blocks') and read_result.blocks:
                print(f"  Number of blocks: {len(read_result.blocks)}")
        
        print("\n✓ Test completed successfully")
        return True
        
    except AzureError as e:
        print(f"\n✗ Azure API error: {e}")
        return False
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_vision_api()
    sys.exit(0 if success else 1)

