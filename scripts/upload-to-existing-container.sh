#!/bin/bash

# Upload to existing container (doctor-data)
STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"
CONTAINER_NAME="doctor-data"  # Using existing container
DOCTORS_FILE="data/doctors.json"

echo "📤 Uploading doctors data to Azure Blob Storage..."
echo "Container: $CONTAINER_NAME"
echo ""

# Check if doctors.json exists
if [ ! -f "$DOCTORS_FILE" ]; then
    echo "❌ Error: $DOCTORS_FILE not found"
    echo "Please run 'npm run generate-doctors' first"
    exit 1
fi

# Get connection string
echo "🔑 Getting connection string..."
CONNECTION_STRING=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "connectionString" \
  --output tsv)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Failed to get connection string"
    exit 1
fi

# Upload the blob
echo "📤 Uploading doctors.json to container '$CONTAINER_NAME'..."
az storage blob upload \
  --file "$DOCTORS_FILE" \
  --container-name "$CONTAINER_NAME" \
  --name "doctors.json" \
  --connection-string "$CONNECTION_STRING" \
  --content-type "application/json" \
  --overwrite

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload successful!"
    echo ""
    
    # List blobs to verify
    echo "🔍 Verifying upload..."
    az storage blob list \
      --container-name "$CONTAINER_NAME" \
      --connection-string "$CONNECTION_STRING" \
      --output table
    
    # Get the blob URL
    echo ""
    BLOB_URL=$(az storage blob url \
      --container-name "$CONTAINER_NAME" \
      --name "doctors.json" \
      --connection-string "$CONNECTION_STRING" \
      --output tsv)
    
    echo "🌐 Your doctors data is available at:"
    echo "$BLOB_URL"
    echo ""
    echo "✅ Doctors data successfully uploaded to Azure Blob Storage!"
else
    echo "❌ Upload failed"
    exit 1
fi

