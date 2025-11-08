#!/bin/bash

# Simple upload script - try to upload and handle errors
STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"
CONTAINER_NAME="carepilot-data"
DOCTORS_FILE="data/doctors.json"

echo "📤 Simple upload script for doctors data"
echo ""

# Get connection string
CONNECTION_STRING=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "connectionString" \
  --output tsv 2>/dev/null)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Could not get connection string. Trying account key method..."
    ACCOUNT_KEY=$(az storage account keys list \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --subscription "$SUBSCRIPTION_ID" \
      --query "[0].value" \
      --output tsv 2>/dev/null)
    
    if [ -z "$ACCOUNT_KEY" ]; then
        echo "❌ Could not get account key either"
        echo "Please check your Azure login: az login"
        exit 1
    fi
    
    echo "✅ Got account key, creating container..."
    az storage container create \
      --name "$CONTAINER_NAME" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$ACCOUNT_KEY" \
      --public-access blob 2>&1
    
    echo "Uploading with account key..."
    az storage blob upload \
      --file "$DOCTORS_FILE" \
      --container-name "$CONTAINER_NAME" \
      --name "doctors.json" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$ACCOUNT_KEY" \
      --content-type "application/json" \
      --overwrite 2>&1
else
    echo "✅ Got connection string"
    echo "Creating container and uploading..."
    
    # Try to create container (ignore if exists)
    az storage container create \
      --name "$CONTAINER_NAME" \
      --connection-string "$CONNECTION_STRING" \
      --public-access blob 2>&1 | grep -v "already exists" || true
    
    # Wait a moment
    sleep 1
    
    # Upload
    echo "Uploading blob..."
    az storage blob upload \
      --file "$DOCTORS_FILE" \
      --container-name "$CONTAINER_NAME" \
      --name "doctors.json" \
      --connection-string "$CONNECTION_STRING" \
      --content-type "application/json" \
      --overwrite 2>&1
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload completed!"
    echo ""
    echo "🔍 Verifying..."
    if [ -n "$CONNECTION_STRING" ]; then
        az storage blob list \
          --container-name "$CONTAINER_NAME" \
          --connection-string "$CONNECTION_STRING" \
          --output table 2>&1
    else
        az storage blob list \
          --container-name "$CONTAINER_NAME" \
          --account-name "$STORAGE_ACCOUNT_NAME" \
          --account-key "$ACCOUNT_KEY" \
          --output table 2>&1
    fi
else
    echo "❌ Upload failed - check error messages above"
    exit 1
fi

