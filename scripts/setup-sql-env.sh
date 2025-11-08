#!/bin/bash

# Script to set up Azure SQL Database environment variables
# Usage: ./scripts/setup-sql-env.sh

echo "🔧 Setting up Azure SQL Database environment variables..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first."
    exit 1
fi

# Get SQL Server details
SQL_SERVER="k2sqldatabaseserver.database.windows.net"
SQL_DATABASE="K2Database"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"

echo "📋 SQL Server: $SQL_SERVER"
echo "📋 Database: $SQL_DATABASE"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Prompt for SQL username
read -p "Enter Azure SQL Database username: " SQL_USER

# Prompt for SQL password (hidden)
read -sp "Enter Azure SQL Database password: " SQL_PASSWORD
echo ""

# Create connection string
CONNECTION_STRING="Server=$SQL_SERVER;Database=$SQL_DATABASE;User Id=$SQL_USER;Password=$SQL_PASSWORD;Encrypt=true;TrustServerCertificate=false"

# Add to .env file
echo "" >> .env
echo "# Azure SQL Database" >> .env
echo "AZURE_SQL_SERVER=$SQL_SERVER" >> .env
echo "AZURE_SQL_DATABASE=$SQL_DATABASE" >> .env
echo "AZURE_SQL_USER=$SQL_USER" >> .env
echo "AZURE_SQL_PASSWORD=$SQL_PASSWORD" >> .env
echo "AZURE_SQL_CONNECTION_STRING=$CONNECTION_STRING" >> .env

echo "✅ Environment variables added to .env file"
echo ""
echo "📝 Added variables:"
echo "   - AZURE_SQL_SERVER"
echo "   - AZURE_SQL_DATABASE"
echo "   - AZURE_SQL_USER"
echo "   - AZURE_SQL_PASSWORD"
echo "   - AZURE_SQL_CONNECTION_STRING"
echo ""
echo "⚠️  Note: Make sure to add .env to .gitignore to protect your credentials!"

