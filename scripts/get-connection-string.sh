#!/bin/bash

# Get Azure Storage connection string using Azure CLI
# This will help you set up the .env file for Node.js scripts

STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"

echo "🔑 Getting Azure Storage connection string..."
echo ""

CONNECTION_STRING=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "connectionString" \
  --output tsv)

if [ $? -eq 0 ] && [ -n "$CONNECTION_STRING" ]; then
    echo "✅ Connection string retrieved successfully!"
    echo ""
    echo "Add this to your .env file:"
    echo "════════════════════════════════════════════════════════════"
    echo "AZURE_STORAGE_CONNECTION_STRING=$CONNECTION_STRING"
    echo "AZURE_BLOB_CONTAINER_NAME=carepilot-data"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Or run this command to create/update .env file:"
    echo "echo 'AZURE_STORAGE_CONNECTION_STRING=$CONNECTION_STRING' > .env"
    echo "echo 'AZURE_BLOB_CONTAINER_NAME=carepilot-data' >> .env"
    echo ""
    
    # Offer to create .env file automatically
    read -p "Would you like to create/update the .env file now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "AZURE_STORAGE_CONNECTION_STRING=$CONNECTION_STRING" > .env
        echo "AZURE_BLOB_CONTAINER_NAME=doctor-data" >> .env
        echo "✅ .env file created/updated!"
    fi
else
    echo "❌ Failed to retrieve connection string"
    echo "Make sure you're logged in to Azure CLI: az login"
    exit 1
fi

