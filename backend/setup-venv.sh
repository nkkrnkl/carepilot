#!/bin/bash
# Setup script for Azure Computer Vision Python dependencies

set -e

echo "🔵 Setting up Python virtual environment for Azure Computer Vision..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo "✅ Setup complete!"
echo ""
echo "To use the virtual environment:"
echo "  source backend/venv/bin/activate"
echo ""
echo "The Python bridge will automatically use this virtual environment."

