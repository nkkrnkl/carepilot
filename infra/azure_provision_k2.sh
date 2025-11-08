#!/usr/bin/env bash
# Azure App Service Provisioning Script for Existing K2 Resource Group
# Creates App Service Plan and Web App in the existing K2 resource group
# Usage: bash infra/azure_provision_k2.sh -a <appname> [options]

set -euo pipefail

# Default values
RESOURCE_GROUP="K2"
SKU="${SKU:-B1}"
APP_NAME=""
PLAN_NAME=""
REGION=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Help function
show_help() {
    cat << EOF
Azure App Service Provisioning Script for K2 Resource Group

Usage: $0 [OPTIONS]

Options:
  -a, --app-name NAME       App name (required, must be globally unique)
  -p, --plan-name NAME      App Service Plan name (default: <app-name>-plan)
  -s, --sku SKU             App Service Plan SKU (default: B1)
                            Options: F1 (Free), B1 (Basic), S1 (Standard), P1V2 (Premium)
  -r, --region REGION       Azure region (default: auto-detect from K2 resource group)
  -h, --help                Show this help message

Examples:
  $0 -a carepilot-prod
  $0 -a carepilot-prod -s S1
  $0 -a carepilot-prod -p my-plan -r eastus

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--app-name)
            APP_NAME="$2"
            shift 2
            ;;
        -p|--plan-name)
            PLAN_NAME="$2"
            shift 2
            ;;
        -s|--sku)
            SKU="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown option: $1${NC}" >&2
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$APP_NAME" ]]; then
    echo -e "${RED}Error: App name (-a|--app-name) is required${NC}" >&2
    show_help
    exit 1
fi

# Validate app name (Azure requirements: lowercase, alphanumeric and hyphens only, 2-60 chars)
if [[ ! "$APP_NAME" =~ ^[a-z0-9-]{2,60}$ ]]; then
    echo -e "${RED}Error: App name must be lowercase, alphanumeric with hyphens, 2-60 characters${NC}" >&2
    exit 1
fi

# Set defaults if not provided
PLAN_NAME="${PLAN_NAME:-${APP_NAME}-plan}"

# Get region from resource group if not provided
if [[ -z "$REGION" ]]; then
    REGION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv 2>/dev/null || echo "southindia")
    echo -e "${YELLOW}Using region from K2 resource group: $REGION${NC}"
fi

echo -e "${GREEN}=== Azure App Service Provisioning (K2 Resource Group) ===${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name:       $APP_NAME"
echo "Plan Name:      $PLAN_NAME"
echo "Region:         $REGION"
echo "SKU:            $SKU"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI not found. Please install: https://aka.ms/InstallAzureCLI${NC}" >&2
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Running 'az login'...${NC}"
    az login
fi

# Verify K2 resource group exists
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${RED}Error: Resource group '$RESOURCE_GROUP' not found${NC}" >&2
    echo "Please verify the resource group name and your access permissions."
    exit 1
fi

echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' found${NC}"
echo ""

# Show current subscription
CURRENT_SUB=$(az account show --query id -o tsv)
echo "Current subscription: $CURRENT_SUB"
echo ""

# Create App Service Plan (idempotent)
echo -e "${GREEN}Creating App Service Plan: $PLAN_NAME${NC}"
az appservice plan create \
    --name "$PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$REGION" \
    --is-linux \
    --sku "$SKU" \
    --output none || {
    echo -e "${YELLOW}App Service Plan may already exist, continuing...${NC}"
}

# Create Web App (idempotent)
echo -e "${GREEN}Creating Web App: $APP_NAME${NC}"
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --name "$APP_NAME" \
    --runtime "NODE|20-lts" \
    --output none || {
    echo -e "${YELLOW}Web App may already exist, continuing...${NC}"
}

# Configure Node.js version
echo -e "${GREEN}Configuring Node.js version...${NC}"
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        WEBSITE_NODE_DEFAULT_VERSION="~20" \
        SCM_DO_BUILD_DURING_DEPLOYMENT="true" \
    --output none

# Set startup command
echo -e "${GREEN}Setting startup command...${NC}"
az webapp config set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --startup-file "bash ./azure/startup.sh" \
    --output none

# Set placeholder app settings (user must update with real values)
echo -e "${GREEN}Setting placeholder app settings...${NC}"
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$APP_NAME" \
    --settings \
        NODE_ENV="production" \
        NEXT_TELEMETRY_DISABLED="1" \
        DATABASE_URL="file:./dev.db" \
        OPENAI_API_KEY="REPLACE_WITH_YOUR_KEY" \
        PINECONE_API_KEY="REPLACE_WITH_YOUR_KEY" \
        PINECONE_INDEX_NAME="care-pilot" \
        AZURE_OPENAI_ENDPOINT="REPLACE_WITH_YOUR_ENDPOINT" \
        AZURE_OPENAI_API_KEY="REPLACE_WITH_YOUR_KEY" \
        AZURE_OPENAI_DEPLOYMENT_NAME="text-embedding-3-large-2" \
        AZURE_OPENAI_API_VERSION="2023-05-15" \
    --output none

echo ""
echo -e "${GREEN}=== Provisioning Complete ===${NC}"
echo ""
echo -e "${GREEN}Web App URL:${NC} https://${APP_NAME}.azurewebsites.net"
echo ""
echo -e "${YELLOW}=== Next Steps ===${NC}"
echo ""
echo "1. Get Publish Profile:"
echo "   az webapp deployment list-publishing-profiles \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --name $APP_NAME \\"
echo "     --xml"
echo ""
echo "   Or in Azure Portal:"
echo "   Web App → Deployment Center → Manage publish profile → Get publish profile"
echo ""
echo "2. Add to GitHub Secrets:"
echo "   - Go to: https://github.com/nkkrnkl/carepilot/settings/secrets/actions"
echo "   - Add secret: AZURE_WEBAPP_PUBLISH_PROFILE"
echo "   - Paste the XML content from step 1"
echo ""
echo "3. (Optional) Set Repository Variable:"
echo "   - Go to: https://github.com/nkkrnkl/carepilot/settings/variables/actions"
echo "   - Add variable: AZURE_WEBAPP_NAME = $APP_NAME"
echo ""
echo "4. Update App Settings with real values:"
echo "   - Use Azure Portal: Web App → Configuration → Application settings"
echo "   - Or use: bash scripts/set-app-settings.example.sh"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Update placeholder app settings with real API keys!${NC}"
echo ""
echo -e "${YELLOW}⚠️  DATABASE WARNING:${NC}"
echo "   This app uses Prisma with SQLite. Azure App Service filesystem is ephemeral."
echo "   Data will be lost on restart. Consider migrating to Azure Database for PostgreSQL."
echo "   Note: You have SQL Server resources in K2 - consider using those for production."
echo ""

