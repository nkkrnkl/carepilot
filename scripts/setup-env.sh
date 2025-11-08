#!/bin/bash

# Script to set up .env file with Azure Storage connection string
# IMPORTANT: Replace these values with your own Azure resources

# Set your Azure Storage account name here
STORAGE_ACCOUNT_NAME="${AZURE_STORAGE_ACCOUNT_NAME:-your-storage-account-name}"

# Set your Azure subscription ID here
SUBSCRIPTION_ID="${AZURE_SUBSCRIPTION_ID:-your-subscription-id}"

# Check if values are still placeholders
if [ "$STORAGE_ACCOUNT_NAME" = "your-storage-account-name" ] || [ "$SUBSCRIPTION_ID" = "your-subscription-id" ]; then
    echo "⚠️  WARNING: Please set your Azure credentials!"
    echo ""
    echo "Option 1: Set environment variables before running this script:"
    echo "  export AZURE_STORAGE_ACCOUNT_NAME='your-storage-account'"
    echo "  export AZURE_SUBSCRIPTION_ID='your-subscription-id'"
    echo "  ./scripts/setup-env.sh"
    echo ""
    echo "Option 2: Edit this script and replace the placeholder values"
    echo ""
    echo "Option 3: Manually create .env file with your credentials (see .env.example)"
    exit 1
fi

echo "🔧 Setting up .env file for Azure Blob Storage..."
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. .env file not modified."
        exit 1
    fi
fi

# Get connection string
echo "📡 Retrieving connection string from Azure..."
CONNECTION_STRING=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "connectionString" \
  --output tsv 2>/dev/null)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Could not retrieve connection string from Azure"
    echo "   Make sure you're logged in: az login"
    exit 1
fi

# Get storage account key for table storage
echo "🔑 Retrieving storage account key..."
ACCOUNT_KEY=$(az storage account keys list \
  --name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "[0].value" \
  --output tsv 2>/dev/null)

# Create .env file
cat > .env << EOF
# Azure Blob Storage Configuration
# Generated on $(date)
AZURE_STORAGE_CONNECTION_STRING="$CONNECTION_STRING"
AZURE_BLOB_CONTAINER_NAME="doctor-data"

# Azure Table Storage Configuration
AZURE_STORAGE_ACCOUNT_NAME="$STORAGE_ACCOUNT_NAME"
AZURE_STORAGE_ACCOUNT_KEY="$ACCOUNT_KEY"
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📋 Contents:"
echo "   AZURE_STORAGE_CONNECTION_STRING: [hidden]"
echo "   AZURE_BLOB_CONTAINER_NAME: doctor-data"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart your dev server: npm run dev"
echo "   2. Visit: http://localhost:3000/features/scheduling"
echo "   3. Check the browser console for API logs"
echo ""

