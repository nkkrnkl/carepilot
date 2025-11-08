#!/bin/bash

# Script to get Azure Storage Account Key for table storage

STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"

echo "🔑 Retrieving Azure Storage Account Key..."
echo ""

# Get the first key
ACCOUNT_KEY=$(az storage account keys list \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "[0].value" \
  --output tsv 2>/dev/null)

if [ -z "$ACCOUNT_KEY" ]; then
    echo "❌ Could not retrieve storage account key"
    echo "   Make sure you're logged in: az login"
    exit 1
fi

echo "✅ Storage Account Key retrieved successfully!"
echo ""
echo "📋 Add this to your .env file:"
echo "AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME"
echo "AZURE_STORAGE_ACCOUNT_KEY=$ACCOUNT_KEY"
echo ""
echo "💡 Or use the connection string (which includes the key):"
echo "   Run: ./scripts/get-connection-string.sh"
echo ""

