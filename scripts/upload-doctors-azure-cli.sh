#!/bin/bash

# Upload doctors data to Azure Blob Storage using Azure CLI
# This script uses Azure CLI with account key authentication

STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"
CONTAINER_NAME="doctor-data"
DOCTORS_FILE="data/doctors.json"

echo "📤 Uploading doctors data to Azure Blob Storage..."
echo ""

# Check if doctors.json exists
if [ ! -f "$DOCTORS_FILE" ]; then
    echo "❌ Error: $DOCTORS_FILE not found"
    echo "Please run 'npm run generate-doctors' first"
    exit 1
fi

# Get account key
echo "🔑 Getting storage account key..."
ACCOUNT_KEY=$(az storage account keys list \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "[0].value" \
  --output tsv)

if [ -z "$ACCOUNT_KEY" ]; then
    echo "❌ Failed to get storage account key"
    echo "Make sure you're logged in: az login"
    exit 1
fi

# Create container if it doesn't exist
echo "📦 Checking if container '$CONTAINER_NAME' exists..."
CONTAINER_EXISTS=$(az storage container exists \
  --name "$CONTAINER_NAME" \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --account-key "$ACCOUNT_KEY" \
  --query "exists" \
  --output tsv 2>/dev/null)

if [ "$CONTAINER_EXISTS" != "true" ]; then
    echo "📦 Creating container '$CONTAINER_NAME'..."
    az storage container create \
      --name "$CONTAINER_NAME" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$ACCOUNT_KEY" \
      --public-access blob \
      --output none
    
    if [ $? -eq 0 ]; then
        echo "✅ Container created successfully"
        echo "⏳ Waiting for container to be available..."
        sleep 2
        
        # Verify container exists
        CONTAINER_EXISTS_AFTER=$(az storage container exists \
          --name "$CONTAINER_NAME" \
          --account-name "$STORAGE_ACCOUNT_NAME" \
          --account-key "$ACCOUNT_KEY" \
          --query "exists" \
          --output tsv 2>/dev/null)
        
        if [ "$CONTAINER_EXISTS_AFTER" != "true" ]; then
            echo "⚠️  Container creation may not have propagated yet, trying anyway..."
        fi
    else
        echo "❌ Failed to create container"
        exit 1
    fi
else
    echo "✅ Container already exists"
fi

# Upload the blob
echo "📤 Uploading doctors.json..."
az storage blob upload \
  --file "$DOCTORS_FILE" \
  --container-name "$CONTAINER_NAME" \
  --name "doctors.json" \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --account-key "$ACCOUNT_KEY" \
  --content-type "application/json" \
  --overwrite

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload successful!"
    echo ""
    echo "📊 Upload details:"
    echo "   - Container: $CONTAINER_NAME"
    echo "   - Blob: doctors.json"
    echo "   - Account: $STORAGE_ACCOUNT_NAME"
    echo ""
    
    # Get the blob URL
    BLOB_URL=$(az storage blob url \
      --container-name "$CONTAINER_NAME" \
      --name "doctors.json" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$ACCOUNT_KEY" \
      --output tsv)
    
    echo "🌐 Your doctors data is now available at:"
    echo "   $BLOB_URL"
    echo ""
    
    # Verify the upload
    echo "🔍 Verifying upload..."
    BLOB_SIZE=$(az storage blob show \
      --container-name "$CONTAINER_NAME" \
      --name "doctors.json" \
      --account-name "$STORAGE_ACCOUNT_NAME" \
      --account-key "$ACCOUNT_KEY" \
      --query "properties.contentLength" \
      --output tsv)
    
    LOCAL_SIZE=$(stat -f%z "$DOCTORS_FILE" 2>/dev/null || stat -c%s "$DOCTORS_FILE" 2>/dev/null)
    
    echo "   - Local file size: $LOCAL_SIZE bytes"
    echo "   - Blob size: $BLOB_SIZE bytes"
    
    if [ "$LOCAL_SIZE" -eq "$BLOB_SIZE" ]; then
        echo "   ✅ File sizes match - upload verified!"
    else
        echo "   ⚠️  File sizes don't match - please check the upload"
    fi
else
    echo "❌ Upload failed"
    exit 1
fi

