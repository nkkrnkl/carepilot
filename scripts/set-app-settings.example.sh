#!/usr/bin/env bash
# Example script to set Azure App Service environment variables
# Copy this file and replace placeholder values with your actual keys
# Usage: bash scripts/set-app-settings.example.sh

set -euo pipefail

# Configuration - UPDATE THESE VALUES
RESOURCE_GROUP="${RESOURCE_GROUP:-your-app-name-rg}"
APP_NAME="${APP_NAME:-your-app-name}"

# API Keys - REPLACE WITH YOUR ACTUAL VALUES
OPENAI_API_KEY="${OPENAI_API_KEY:-your-openai-api-key}"
PINECONE_API_KEY="${PINECONE_API_KEY:-your-pinecone-api-key}"
PINECONE_INDEX_NAME="${PINECONE_INDEX_NAME:-care-pilot}"
AZURE_OPENAI_ENDPOINT="${AZURE_OPENAI_ENDPOINT:-https://your-endpoint.cognitiveservices.azure.com/}"
AZURE_OPENAI_API_KEY="${AZURE_OPENAI_API_KEY:-your-azure-openai-key}"
AZURE_OPENAI_DEPLOYMENT_NAME="${AZURE_OPENAI_DEPLOYMENT_NAME:-text-embedding-3-large-2}"
AZURE_OPENAI_API_VERSION="${AZURE_OPENAI_API_VERSION:-2023-05-15}"

# Database URL - IMPORTANT: See DEPLOYMENT.md for database options
# For SQLite (ephemeral, not recommended for production):
DATABASE_URL="${DATABASE_URL:-file:./dev.db}"

# For Azure Database for PostgreSQL (recommended):
# DATABASE_URL="${DATABASE_URL:-postgresql://user:password@server.postgres.database.azure.com:5432/dbname?sslmode=require}"

echo "Setting app settings for: $APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        NODE_ENV="production" \
        NEXT_TELEMETRY_DISABLED="1" \
        DATABASE_URL="$DATABASE_URL" \
        OPENAI_API_KEY="$OPENAI_API_KEY" \
        PINECONE_API_KEY="$PINECONE_API_KEY" \
        PINECONE_INDEX_NAME="$PINECONE_INDEX_NAME" \
        AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
        AZURE_OPENAI_API_KEY="$AZURE_OPENAI_API_KEY" \
        AZURE_OPENAI_DEPLOYMENT_NAME="$AZURE_OPENAI_DEPLOYMENT_NAME" \
        AZURE_OPENAI_API_VERSION="$AZURE_OPENAI_API_VERSION" \
    --output table

echo ""
echo "✅ App settings updated successfully!"
echo ""
echo "To verify, run:"
echo "  az webapp config appsettings list --resource-group $RESOURCE_GROUP --name $APP_NAME --output table"

