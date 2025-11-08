#!/bin/bash

# Interactive script to help set up Azure SQL Database credentials
# Usage: ./scripts/get-sql-credentials.sh

echo "🔐 Azure SQL Database Credentials Setup"
echo "========================================"
echo ""

# Check if .env or env file exists, use env if it exists (since that's what the project uses)
ENV_FILE=".env"
if [ -f "env" ] && [ ! -f ".env" ]; then
    ENV_FILE="env"
    echo "📝 Using existing 'env' file (without dot)"
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating $ENV_FILE file..."
    touch "$ENV_FILE"
fi

echo "📋 Azure SQL Server Information:"
echo "   Server: k2sqldatabaseserver.database.windows.net"
echo "   Database: K2Database"
echo "   Subscription: 41f56be4-b097-45ca-b7a6-b064a0c7189e"
echo "   Resource Group: K2"
echo ""

echo "To get your SQL credentials:"
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to: SQL Server > k2sqldatabaseserver"
echo "3. Go to: Settings > SQL administrators"
echo "4. Set up SQL Authentication (username and password)"
echo "5. Go to: Settings > Networking"
echo "6. Add your IP address to firewall rules"
echo ""

read -p "Do you have your SQL credentials ready? (y/n): " ready

if [ "$ready" != "y" ] && [ "$ready" != "Y" ]; then
    echo ""
    echo "Please follow these steps:"
    echo "1. Open Azure Portal: https://portal.azure.com"
    echo "2. Search for 'k2sqldatabaseserver'"
    echo "3. Go to Settings > SQL administrators"
    echo "4. Click 'Set admin' or 'Add SQL admin'"
    echo "5. Enter a username and password"
    echo "6. Go to Settings > Networking"
    echo "7. Add your IP address"
    echo ""
    echo "Then run this script again."
    exit 0
fi

echo ""
echo "Enter your Azure SQL Database credentials:"
echo ""

# Get SQL username
read -p "SQL Username: " SQL_USER

# Get SQL password (hidden input)
read -sp "SQL Password: " SQL_PASSWORD
echo ""

# Confirm password
read -sp "Confirm Password: " SQL_PASSWORD_CONFIRM
echo ""

if [ "$SQL_PASSWORD" != "$SQL_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords do not match!"
    exit 1
fi

# Remove existing SQL credentials from env file if they exist
if [ -f "$ENV_FILE" ]; then
    # Create backup
    cp "$ENV_FILE" "${ENV_FILE}.bak"
    # Remove existing SQL lines
    grep -v "^AZURE_SQL" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
    mv "${ENV_FILE}.tmp" "$ENV_FILE"
fi

# Add new credentials
echo "" >> "$ENV_FILE"
echo "# Azure SQL Database" >> "$ENV_FILE"
echo "AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net" >> "$ENV_FILE"
echo "AZURE_SQL_DATABASE=K2Database" >> "$ENV_FILE"
echo "AZURE_SQL_USER=$SQL_USER" >> "$ENV_FILE"
echo "AZURE_SQL_PASSWORD=$SQL_PASSWORD" >> "$ENV_FILE"

# Create connection string
CONNECTION_STRING="Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=$SQL_USER;Password=$SQL_PASSWORD;Encrypt=true;TrustServerCertificate=false"
echo "AZURE_SQL_CONNECTION_STRING=$CONNECTION_STRING" >> "$ENV_FILE"

echo ""
echo "✅ Credentials added to $ENV_FILE file!"
echo ""
echo "📝 Added variables:"
echo "   - AZURE_SQL_SERVER"
echo "   - AZURE_SQL_DATABASE"
echo "   - AZURE_SQL_USER"
echo "   - AZURE_SQL_PASSWORD"
echo "   - AZURE_SQL_CONNECTION_STRING"
echo ""
echo "🧪 Test your connection by running:"
echo "   npm run test-sql-storage"
echo ""
echo "📚 For detailed instructions, see: GET-SQL-CREDENTIALS.md"

