#!/bin/bash

# Azure CLI Helper Script for CarePilot
# This script provides helper commands for managing Azure Storage

# Storage Account Configuration
STORAGE_ACCOUNT_NAME="hackstoragexz"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Azure Storage Helper for CarePilot${NC}"
echo "=================================="
echo ""

# List containers
echo -e "${GREEN}Listing containers in storage account: ${STORAGE_ACCOUNT_NAME}${NC}"
az storage container list \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --subscription "$SUBSCRIPTION_ID" \
  --output table

echo ""
echo -e "${YELLOW}Available commands:${NC}"
echo "  - List containers: az storage container list --account-name $STORAGE_ACCOUNT_NAME --subscription $SUBSCRIPTION_ID"
echo "  - Create container: az storage container create --name carepilot-data --account-name $STORAGE_ACCOUNT_NAME --subscription $SUBSCRIPTION_ID"
echo "  - List blobs: az storage blob list --container-name carepilot-data --account-name $STORAGE_ACCOUNT_NAME --subscription $SUBSCRIPTION_ID --output table"
echo "  - Upload blob: az storage blob upload --file data/doctors.json --container-name carepilot-data --name doctors.json --account-name $STORAGE_ACCOUNT_NAME --subscription $SUBSCRIPTION_ID"

