#!/bin/bash
# Start FastAPI server for Lab Analysis

cd "$(dirname "$0")"
source venv/bin/activate
uvicorn main:app --reload --port 8000 --host 0.0.0.0


