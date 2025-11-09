#!/usr/bin/env python3
"""
Python script to extract lab report data using Azure AI Projects - called from Next.js API routes
"""

import sys
import json
import os
import tempfile
import base64
from pathlib import Path

# Add backend directory to path to import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

try:
    from azure.ai.projects import AIProjectClient
    from azure.identity import DefaultAzureCredential
    from azure.core.credentials import AzureKeyCredential
    from azure.ai.agents.models import ListSortOrder
except ImportError as e:
    print(json.dumps({"error": f"Failed to import Azure AI Projects: {str(e)}. Install with: pip install azure-ai-projects"}))
    sys.exit(1)

# Load environment variables
import os
try:
    from dotenv import load_dotenv
    # Load .env from project root
    env_path = Path(__file__).parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

def main():
    # Read input from file
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing input/output file arguments"}))
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    try:
        # Read input data
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        
        # Get extraction parameters
        user_id = input_data.get("userId")
        document_id = input_data.get("documentId")
        file_content_base64 = input_data.get("fileContent")  # Base64 encoded file content
        file_name = input_data.get("fileName", "lab_report.pdf")
        file_type = input_data.get("fileType", "pdf")
        
        if not user_id or not document_id:
            raise ValueError("userId and documentId are required")
        
        if not file_content_base64:
            raise ValueError("fileContent (base64) is required")
        
        # Decode base64 file content
        file_bytes = base64.b64decode(file_content_base64)
        
        # Save to temporary file
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"{document_id}_{file_name}")
        
        try:
            # Write file to temp location
            with open(temp_file_path, 'wb') as f:
                f.write(file_bytes)
            
            # Initialize Azure AI Project Client
            print("Initializing Azure AI Project Client...", flush=True)
            endpoint = "https://foundrymodelsk2hackathon.services.ai.azure.com/api/projects/k2"
            
            # Try API key first, then fall back to DefaultAzureCredential
            credential = None
            api_key = os.getenv("AZURE_AI_PROJECTS_API_KEY") or os.getenv("K2_API_KEY")
            
            if api_key:
                try:
                    credential = AzureKeyCredential(api_key)
                    print("✅ Using API key authentication", flush=True)
                except Exception as e:
                    print(f"⚠️ Failed to use API key, trying DefaultAzureCredential: {e}", flush=True)
                    credential = None
            
            if not credential:
                try:
                    credential = DefaultAzureCredential()
                    print("✅ Using DefaultAzureCredential (Azure CLI login)", flush=True)
                except Exception as e:
                    error_msg = f"Failed to initialize credentials: {str(e)}. Try: az login or set AZURE_AI_PROJECTS_API_KEY"
                    print(f"❌ {error_msg}", flush=True)
                    raise Exception(error_msg)
            
            try:
                project = AIProjectClient(
                    credential=credential,
                    endpoint=endpoint
                )
                print(f"✅ AIProjectClient initialized with endpoint: {endpoint}", flush=True)
            except Exception as e:
                error_msg = f"Failed to initialize AIProjectClient: {str(e)}"
                print(f"❌ {error_msg}", flush=True)
                if "401" in str(e) or "Unauthorized" in str(e):
                    print("💡 Authentication failed. Try: az login or set AZURE_AI_PROJECTS_API_KEY in .env", flush=True)
                raise Exception(error_msg)
            
            # Get the lab analysis agent
            agent_id = "asst_uSJgSalr4lidc8QuUTZk4PQJ"
            try:
                agent = project.agents.get_agent(agent_id)
                print(f"✅ Retrieved agent: {agent_id}", flush=True)
            except Exception as e:
                error_msg = f"Failed to get agent {agent_id}: {str(e)}"
                print(f"❌ {error_msg}", flush=True)
                print("💡 Make sure you're authenticated with Azure CLI: az login", flush=True)
                raise Exception(error_msg)
            
            # Create a thread
            try:
                thread = project.agents.threads.create()
                print(f"✅ Created thread, ID: {thread.id}", flush=True)
            except Exception as e:
                error_msg = f"Failed to create thread: {str(e)}"
                print(f"❌ {error_msg}", flush=True)
                raise Exception(error_msg)
            
            # Extract text from PDF first (if it's a PDF)
            extracted_text = ""
            if file_name.lower().endswith('.pdf'):
                try:
                    # Try to extract text from PDF using extract_text.py
                    extract_script = backend_dir / "scripts" / "extract_text.py"
                    if extract_script.exists():
                        import subprocess
                        import json as json_module
                        
                        # Create temp input file for extract_text.py
                        temp_input = os.path.join(temp_dir, f"{document_id}_input.json")
                        temp_output = os.path.join(temp_dir, f"{document_id}_output.json")
                        
                        with open(temp_input, 'w') as f:
                            json_module.dump({
                                "fileContent": file_content_base64,
                                "fileName": file_name,
                                "fileType": file_type
                            }, f)
                        
                        # Run extract_text.py
                        result = subprocess.run(
                            [sys.executable, str(extract_script), temp_input, temp_output],
                            capture_output=True,
                            text=True,
                            timeout=60
                        )
                        
                        if result.returncode == 0 and os.path.exists(temp_output):
                            with open(temp_output, 'r') as f:
                                extract_result = json_module.load(f)
                            if extract_result.get("success") and extract_result.get("data", {}).get("text"):
                                extracted_text = extract_result["data"]["text"]
                                print(f"Extracted {len(extracted_text)} characters from PDF", flush=True)
                        
                        # Clean up temp files
                        for f in [temp_input, temp_output]:
                            if os.path.exists(f):
                                try:
                                    os.remove(f)
                                except:
                                    pass
                except Exception as e:
                    print(f"Warning: Could not extract text from PDF: {e}", flush=True)
            
            # Prepare the message content
            if extracted_text:
                # Include extracted text in the message
                message_content = f"""Please analyze this lab report and extract all lab parameters, values, units, and reference ranges.

File: {file_name}
Document ID: {document_id}
User ID: {user_id}

Lab Report Content:
{extracted_text[:8000]}

Please extract:
1. Lab report title
2. Date of the report
3. Hospital/clinic name
4. Doctor name (if available)
5. All lab parameters with:
   - Parameter name
   - Value
   - Unit
   - Reference range (if available)

Return the results in a structured JSON format with:
- title: string
- date: string (YYYY-MM-DD format if available)
- hospital: string or null
- doctor: string or null
- parameters: array of objects with name, value, unit, referenceRange fields
"""
            else:
                # If we couldn't extract text, ask agent to process the file
                message_content = f"""Please analyze this lab report file and extract all lab parameters, values, units, and reference ranges.

File: {file_name}
Document ID: {document_id}
User ID: {user_id}
File Location: {temp_file_path}

Please extract:
1. Lab report title
2. Date of the report
3. Hospital/clinic name
4. Doctor name (if available)
5. All lab parameters with:
   - Parameter name
   - Value
   - Unit
   - Reference range (if available)

Return the results in a structured JSON format with:
- title: string
- date: string (YYYY-MM-DD format if available)
- hospital: string or null
- doctor: string or null
- parameters: array of objects with name, value, unit, referenceRange fields
"""
            
            # Create message with file attachment
            # Note: Azure AI Projects may support file attachments, but for now we'll send the content as text
            # If the file is small enough, we could encode it and include it
            try:
                message = project.agents.messages.create(
                    thread_id=thread.id,
                    role="user",
                    content=message_content
                )
                print(f"✅ Created message in thread", flush=True)
            except Exception as e:
                error_msg = f"Failed to create message: {str(e)}"
                print(f"❌ {error_msg}", flush=True)
                raise Exception(error_msg)
            
            # Run the agent
            print("Running agent...", flush=True)
            try:
                run = project.agents.runs.create_and_process(
                    thread_id=thread.id,
                    agent_id=agent.id
                )
            except Exception as e:
                error_msg = f"Failed to run agent: {str(e)}"
                print(f"❌ {error_msg}", flush=True)
                # Check if it's an authentication error
                if "401" in str(e) or "Unauthorized" in str(e) or "authentication" in str(e).lower():
                    print("💡 Authentication error. Make sure you're logged in: az login", flush=True)
                raise Exception(error_msg)
            
            if run.status == "failed":
                error_msg = f"Run failed: {run.last_error}" if run.last_error else "Run failed with unknown error"
                print(f"❌ {error_msg}", flush=True)
                raise Exception(error_msg)
            
            print(f"✅ Run completed with status: {run.status}", flush=True)
            
            # Get messages from the thread
            try:
                messages = project.agents.messages.list(thread_id=thread.id, order=ListSortOrder.ASCENDING)
            except Exception as e:
                error_msg = f"Failed to list messages: {str(e)}"
                print(f"❌ {error_msg}", flush=True)
                raise Exception(error_msg)
            
            # Extract the assistant's response
            assistant_response = None
            for message in messages:
                if message.role == "assistant" and message.text_messages:
                    assistant_response = message.text_messages[-1].text.value
                    break
            
            if not assistant_response:
                raise Exception("No response from agent - assistant did not return any text messages")
            
            print(f"✅ Received response from agent (length: {len(assistant_response)})", flush=True)
            
            # Check if response is HTML (error page)
            if assistant_response.strip().startswith("<!DOCTYPE") or assistant_response.strip().startswith("<html"):
                error_msg = "Agent returned HTML instead of JSON. This usually indicates an authentication or API error."
                print(f"❌ {error_msg}", flush=True)
                print(f"Response preview: {assistant_response[:500]}", flush=True)
                raise Exception(error_msg)
            
            # Try to parse the response as JSON
            # The agent should return structured JSON with lab data
            try:
                # Try to extract JSON from the response
                # The response might be wrapped in markdown code blocks
                response_text = assistant_response.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:]  # Remove ```json
                if response_text.startswith("```"):
                    response_text = response_text[3:]  # Remove ```
                if response_text.endswith("```"):
                    response_text = response_text[:-3]  # Remove closing ```
                response_text = response_text.strip()
                
                parsed_response = json.loads(response_text)
            except json.JSONDecodeError:
                # If not JSON, try to extract structured data from the text
                # For now, we'll create a basic structure
                parsed_response = {
                    "title": file_name.replace(".pdf", "").replace("_", " ").title(),
                    "date": None,
                    "hospital": None,
                    "doctor": None,
                    "parameters": [],
                    "rawResponse": assistant_response
                }
            
            # Build lab report data structure matching the expected format
            lab_data = {
                "title": parsed_response.get("title") or file_name.replace(".pdf", "").replace("_", " ").title(),
                "date": parsed_response.get("date"),
                "hospital": parsed_response.get("hospital"),
                "doctor": parsed_response.get("doctor"),
                "rawExtract": assistant_response,
                "parameters": parsed_response.get("parameters", []),
            }
            
            # Convert parameters to the expected format if needed
            if lab_data["parameters"] and isinstance(lab_data["parameters"], list):
                # Ensure each parameter has the right structure
                formatted_parameters = {}
                for param in lab_data["parameters"]:
                    if isinstance(param, dict):
                        param_name = param.get("name") or param.get("parameter") or "Unknown"
                        formatted_parameters[param_name] = {
                            "value": param.get("value") or param.get("result") or "",
                            "unit": param.get("unit") or "",
                            "referenceRange": param.get("referenceRange") or param.get("reference_range") or None
                        }
                lab_data["parameters"] = formatted_parameters
            
            # Write output
            output_result = {
                "success": True,
                "labData": lab_data,
                "dashboard": {
                    "summary_cards": [],
                    "condition_flags": [],
                    "table_compact": lab_data["parameters"]
                },
                "steps": {
                    "step1": {"status": "Completed", "message": "File uploaded"},
                    "step2": {"status": "Completed", "message": "Agent processed lab report"},
                    "step3": {"status": "Completed", "message": "Data extracted"}
                },
                "workflowCompleted": True,
                "message": "Lab report processed successfully using Azure AI Projects"
            }
            
            with open(output_file, 'w') as f:
                json.dump(output_result, f, indent=2)
            
            print(json.dumps({"success": True}))
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception as e:
                    print(f"Warning: Failed to delete temp file {temp_file_path}: {e}", file=sys.stderr)
        
    except Exception as e:
        import traceback
        error_result = {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }
        with open(output_file, 'w') as f:
            json.dump(error_result, f, indent=2)
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
