#!/bin/bash

# Quick script to verify doctors count in Azure Blob Storage

STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"
CONTAINER_NAME="doctor-data"

echo "🔍 Checking doctors in Azure Blob Storage..."
echo ""

# Get connection string
CONNECTION_STRING=$(az storage account show-connection-string \
  --name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --query "connectionString" \
  --output tsv 2>/dev/null)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Could not get connection string"
    exit 1
fi

# Download and check
TEMP_FILE="/tmp/doctors-check-$$.json"
az storage blob download \
  --container-name "$CONTAINER_NAME" \
  --name "doctors.json" \
  --file "$TEMP_FILE" \
  --connection-string "$CONNECTION_STRING" \
  --output none 2>&1

if [ $? -eq 0 ] && [ -f "$TEMP_FILE" ]; then
    # Count doctors using Node.js
    COUNT=$(node -e "const data = require('$TEMP_FILE'); console.log(data.length);" 2>/dev/null)
    
    if [ -n "$COUNT" ]; then
        echo "✅ Found $COUNT doctors in Azure Blob Storage"
        echo ""
        echo "📊 Blob Details:"
        az storage blob show \
          --container-name "$CONTAINER_NAME" \
          --name "doctors.json" \
          --connection-string "$CONNECTION_STRING" \
          --query "{Size: properties.contentLength, Type: properties.contentSettings.contentType, Modified: properties.lastModified}" \
          --output table
        
        echo ""
        echo "📋 Sample doctors:"
        node -e "const data = require('$TEMP_FILE'); data.slice(0, 5).forEach((d, i) => console.log(\`  \${i+1}. \${d.name} - \${d.specialty}\`));" 2>/dev/null
        
        rm -f "$TEMP_FILE"
        exit 0
    else
        echo "❌ Could not parse doctors data"
        rm -f "$TEMP_FILE"
        exit 1
    fi
else
    echo "❌ Failed to download doctors.json from blob storage"
    exit 1
fi

