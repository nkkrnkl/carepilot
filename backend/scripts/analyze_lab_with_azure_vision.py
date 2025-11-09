#!/usr/bin/env python3
"""
Azure Computer Vision Lab Report Analysis
Extracts text and analyzes lab report images using Azure Computer Vision Read API
"""

import sys
import json
import os
import time
from pathlib import Path
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Azure Computer Vision configuration
# These should be set in your .env file or environment variables
VISION_KEY = os.getenv("VISION_KEY")
VISION_ENDPOINT = os.getenv("VISION_ENDPOINT")


def analyze_image_from_file(image_path: str):
    """
    Analyze an image file using Azure Computer Vision Read API
    This uses the asynchronous Read API to extract text (OCR) from images
    """
    try:
        # Validate that image file exists
        if not os.path.exists(image_path):
            return {
                "success": False,
                "error": f"Image file not found: {image_path}",
                "error_type": "FileNotFoundError"
            }
        
        # Validate environment variables
        if not VISION_KEY or not VISION_ENDPOINT:
            return {
                "success": False,
                "error": "Azure Computer Vision credentials not set. Please set VISION_KEY and VISION_ENDPOINT environment variables.",
                "error_type": "ConfigurationError"
            }
        
        print(f"🔵 Creating Azure Computer Vision client...")
        print(f"🔵 Endpoint: {VISION_ENDPOINT}")
        print(f"🔵 Key: {VISION_KEY[:10]}...")
        
        # Create the client
        computervision_client = ComputerVisionClient(
            VISION_ENDPOINT,
            CognitiveServicesCredentials(VISION_KEY)
        )
        
        # Read image file
        print(f"🔵 Reading image file: {image_path}")
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        print(f"🔵 Image file size: {len(image_data)} bytes")
        
        # Call Read API with raw response (allows getting operation location)
        print(f"🔵 Calling Read API...")
        read_response = computervision_client.read_in_stream(
            image_data,
            raw=True
        )
        
        # Get the operation location (URL with an ID at the end) from the response
        read_operation_location = read_response.headers["Operation-Location"]
        # Grab the ID from the URL
        operation_id = read_operation_location.split("/")[-1]
        
        print(f"🔵 Operation ID: {operation_id}")
        print(f"🔵 Polling for results...")
        
        # Call the "GET" API and wait for it to retrieve the results
        max_attempts = 60  # Maximum 60 seconds wait time
        attempt = 0
        while attempt < max_attempts:
            read_result = computervision_client.get_read_result(operation_id)
            if read_result.status not in ['notStarted', 'running']:
                break
            time.sleep(1)
            attempt += 1
            if attempt % 5 == 0:
                print(f"🔵 Still processing... (attempt {attempt}/{max_attempts})")
        
        print(f"🔵 Read operation status: {read_result.status}")
        
        # Extract text from results
        extracted_text = ""
        lines_data = []
        
        if read_result.status == OperationStatusCodes.succeeded:
            print(f"🔵 Read operation succeeded")
            # Print the detected text, line by line
            for text_result in read_result.analyze_result.read_results:
                print(f"🔵 Processing read result with {len(text_result.lines)} lines")
                for line in text_result.lines:
                    extracted_text += line.text + "\n"
                    lines_data.append({
                        "text": line.text,
                        "bounding_box": line.bounding_box
                    })
        else:
            return {
                "success": False,
                "error": f"Read operation failed with status: {read_result.status}",
                "error_type": "ReadOperationFailed",
                "status": str(read_result.status)
            }
        
        print(f"🔵 Extracted {len(extracted_text)} characters of text from {len(lines_data)} lines")
        
        # Prepare result
        analysis_result = {
            "success": True,
            "extracted_text": extracted_text.strip(),
            "lines": lines_data,
            "line_count": len(lines_data),
            "operation_id": operation_id,
            "metadata": {
                "status": str(read_result.status),
            }
        }
        
        return analysis_result
        
    except ImportError as e:
        return {
            "success": False,
            "error": f"Missing Azure Computer Vision SDK. Please install: pip install azure-cognitiveservices-vision-computervision pillow msrest. Error: {str(e)}",
            "error_type": "ImportError"
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Error in analyze_image_from_file: {error_trace}")
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_trace
        }


def analyze_image_from_url(image_url: str):
    """
    Analyze an image from URL using Azure Computer Vision Read API
    """
    try:
        # Validate environment variables
        if not VISION_KEY or not VISION_ENDPOINT:
            return {
                "success": False,
                "error": "Azure Computer Vision credentials not set. Please set VISION_KEY and VISION_ENDPOINT environment variables.",
                "error_type": "ConfigurationError"
            }
        
        print(f"🔵 Creating Azure Computer Vision client...")
        
        # Create the client
        computervision_client = ComputerVisionClient(
            VISION_ENDPOINT,
            CognitiveServicesCredentials(VISION_KEY)
        )
        
        # Call Read API with URL and raw response
        print(f"🔵 Calling Read API with URL: {image_url}")
        read_response = computervision_client.read(
            image_url,
            raw=True
        )
        
        # Get the operation location (URL with an ID at the end) from the response
        read_operation_location = read_response.headers["Operation-Location"]
        # Grab the ID from the URL
        operation_id = read_operation_location.split("/")[-1]
        
        print(f"🔵 Operation ID: {operation_id}")
        print(f"🔵 Polling for results...")
        
        # Call the "GET" API and wait for it to retrieve the results
        max_attempts = 60  # Maximum 60 seconds wait time
        attempt = 0
        while attempt < max_attempts:
            read_result = computervision_client.get_read_result(operation_id)
            if read_result.status not in ['notStarted', 'running']:
                break
            time.sleep(1)
            attempt += 1
            if attempt % 5 == 0:
                print(f"🔵 Still processing... (attempt {attempt}/{max_attempts})")
        
        print(f"🔵 Read operation status: {read_result.status}")
        
        # Extract text from results
        extracted_text = ""
        lines_data = []
        
        if read_result.status == OperationStatusCodes.succeeded:
            print(f"🔵 Read operation succeeded")
            # Print the detected text, line by line
            for text_result in read_result.analyze_result.read_results:
                print(f"🔵 Processing read result with {len(text_result.lines)} lines")
                for line in text_result.lines:
                    extracted_text += line.text + "\n"
                    lines_data.append({
                        "text": line.text,
                        "bounding_box": line.bounding_box
                    })
        else:
            return {
                "success": False,
                "error": f"Read operation failed with status: {read_result.status}",
                "error_type": "ReadOperationFailed",
                "status": str(read_result.status)
            }
        
        print(f"🔵 Extracted {len(extracted_text)} characters of text from {len(lines_data)} lines")
        
        # Prepare result
        analysis_result = {
            "success": True,
            "extracted_text": extracted_text.strip(),
            "lines": lines_data,
            "line_count": len(lines_data),
            "operation_id": operation_id,
            "metadata": {
                "status": str(read_result.status),
            }
        }
        
        return analysis_result
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Error in analyze_image_from_url: {error_trace}")
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_trace
        }


def main():
    """
    Main function to handle command line arguments
    """
    if len(sys.argv) < 3:
        error_result = {
            "success": False,
            "error": "Missing arguments. Usage: python analyze_lab_with_azure_vision.py <input_file> <output_file>"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # Read input JSON
        print(f"🔵 Reading input file: {input_file}")
        if not os.path.exists(input_file):
            error_result = {
                "success": False,
                "error": f"Input file not found: {input_file}",
                "error_type": "FileNotFoundError"
            }
            with open(output_file, 'w') as f:
                json.dump(error_result, f, indent=2)
            sys.exit(1)
        
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        
        print(f"🔵 Input data: {json.dumps(input_data, indent=2)}")
        
        # Get image path or URL
        image_path = input_data.get("image_path")
        image_url = input_data.get("image_url")
        
        if not image_path and not image_url:
            result = {
                "success": False,
                "error": "Either 'image_path' or 'image_url' must be provided in input data"
            }
        elif image_path:
            # Analyze from file
            print(f"🔵 Analyzing image from file: {image_path}")
            result = analyze_image_from_file(image_path)
        else:
            # Analyze from URL
            print(f"🔵 Analyzing image from URL: {image_url}")
            result = analyze_image_from_url(image_url)
        
        # Write result to output file
        print(f"🔵 Writing result to output file: {output_file}")
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        if result.get("success"):
            print(f"✅ Analysis successful. Extracted {len(result.get('extracted_text', ''))} characters.")
        else:
            print(f"❌ Analysis failed: {result.get('error')}")
        
        sys.exit(0)
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Error in main: {error_trace}")
        error_result = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": error_trace
        }
        try:
            with open(output_file, 'w') as f:
                json.dump(error_result, f, indent=2)
        except:
            print(f"❌ Failed to write error to output file: {output_file}")
        sys.exit(1)


if __name__ == "__main__":
    main()

