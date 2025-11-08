import requests
import json
import os
from dotenv import load_dotenv

# Load variables from the .env file into the environment
load_dotenv()

class K2APIClient:
    """
    A simple Python client for the K2 Think LLM API.
    Reads the API key from the 'K2_API_KEY' environment variable.
    """
    
    def __init__(self, api_key: str = None):
        """
        Initializes the client.
        
        Args:
            api_key: Your K2 Think API Key. If None, it tries to
                     fetch from the 'K2_API_KEY' environment variable.
        """
        # If no key is provided, try to get it from the environment
        if api_key is None:
            api_key = os.getenv("K2_API_KEY")
        
        if not api_key:
            raise ValueError(
                "API key not found. "
                "Pass it to the constructor or set 'K2_API_KEY' in your .env file."
            )
            
        self.api_url = "https://llm-api.k2think.ai/v1/chat/completions"
        self.headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def chat(self, messages: list, model: str = "MBZUAI-IFM/K2-Think") -> dict:
        """
        Sends a standard, non-streaming chat completion request.
        (Implementation is the same as before)
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": False
        }
        
        try:
            response = requests.post(
                self.api_url, 
                headers=self.headers, 
                json=payload
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as http_err:
            print(f"HTTP error occurred: {http_err} - {response.text}")
        except requests.exceptions.RequestException as req_err:
            print(f"An error occurred: {req_err}")
        return None

    def stream_chat(self, messages: list, model: str = "MBZUAI-IFM/K2-Think"):
        """
        Sends a streaming chat completion request.
        (Implementation is the same as before)
        """
        payload = {
            "model": model,
            "messages": messages,
            "stream": True
        }
        
        try:
            response = requests.post(
                self.api_url, 
                headers=self.headers, 
                json=payload, 
                stream=True
            )
            response.raise_for_status()
            
            for line in response.iter_lines():
                if line:
                    yield line
                    
        except requests.exceptions.HTTPError as http_err:
            print(f"HTTP error occurred: {http_err} - {response.text}")
        except requests.exceptions.RequestException as req_err:
            print(f"An error occurred: {req_err}")
        yield None

# --- Example Usage ---
if __name__ == "__main__":
    
    try:
        # 1. Initialize the client.
        # It will automatically look for the .env file thanks to load_dotenv()
        # and then os.getenv("K2_API_KEY") in the constructor.
        client = K2APIClient()
        
        # 2. Define your messages
        messages = [
            {"role": "user", "content": "What is the capital of France?"}
        ]
        
        # --- Example 1: Standard (Non-Streaming) Request ---
        print("--- Testing Standard Chat Request ---")
        response_data = client.chat(messages)
        
        if response_data:
            print(json.dumps(response_data, indent=2))
        else:
            print("Failed to get a response.")

        print("\n" + "="*50 + "\n")

        # --- Example 2: Streaming Request ---
        print("--- Testing Streaming Chat Request ---")
        stream = client.stream_chat(messages)
        
        if stream:
            for line_bytes in stream:
                if line_bytes:
                    print(line_bytes.decode('utf-8'))
        else:
            print("Failed to start stream.")
            
    except ValueError as e:
        print(f"Configuration error: {e}")