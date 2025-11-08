#!/bin/bash

# Script to get Azure SQL Database connection string
# This helps you get the connection string from Azure Portal

SQL_SERVER="k2sqldatabaseserver.database.windows.net"
SQL_DATABASE="K2Database"
SUBSCRIPTION_ID="41f56be4-b097-45ca-b7a6-b064a0c7189e"

echo "🔐 Azure SQL Database Connection String Helper"
echo "=============================================="
echo ""

echo "📋 Database Information:"
echo "   Server: $SQL_SERVER"
echo "   Database: $SQL_DATABASE"
echo "   Subscription: $SUBSCRIPTION_ID"
echo ""

echo "To get your connection string from Azure Portal:"
echo ""
echo "1. Go to: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/$SQL_DATABASE/overview"
echo ""
echo "2. Click on 'Connection strings' in the left menu (under Settings)"
echo ""
echo "3. Copy the connection string for 'ADO.NET' or 'Node.js'"
echo ""
echo "4. The connection string will look like:"
echo "   Server=tcp:$SQL_SERVER,1433;Initial Catalog=$SQL_DATABASE;Persist Security Info=False;User ID={your_username};Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
echo ""
echo "5. Replace {your_username} and {your_password} with your SQL credentials"
echo ""

echo "📝 Alternative: Set up SQL Authentication first:"
echo ""
echo "1. Go to SQL Server: k2sqldatabaseserver"
echo "2. Go to: Settings > SQL administrators"
echo "3. Click 'Set admin' or 'Add SQL admin'"
echo "4. Enter username and password"
echo "5. Then get the connection string"
echo ""

read -p "Do you want to add SQL credentials to .env file manually? (y/n): " add_manual

if [ "$add_manual" = "y" ] || [ "$add_manual" = "Y" ]; then
    echo ""
    echo "Enter your SQL Database credentials:"
    read -p "SQL Username: " SQL_USER
    read -sp "SQL Password: " SQL_PASSWORD
    echo ""
    
    # Check if .env file exists (could be "env" or ".env")
    ENV_FILE=".env"
    if [ ! -f "$ENV_FILE" ] && [ -f "env" ]; then
        ENV_FILE="env"
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "Creating $ENV_FILE file..."
        touch "$ENV_FILE"
    fi
    
    # Remove existing SQL credentials
    if [ -f "$ENV_FILE" ]; then
        # Create backup
        cp "$ENV_FILE" "${ENV_FILE}.bak"
        
        # Remove existing SQL lines
        grep -v "^AZURE_SQL" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
        mv "${ENV_FILE}.tmp" "$ENV_FILE"
    fi
    
    # Add SQL credentials
    echo "" >> "$ENV_FILE"
    echo "# Azure SQL Database" >> "$ENV_FILE"
    echo "AZURE_SQL_SERVER=$SQL_SERVER" >> "$ENV_FILE"
    echo "AZURE_SQL_DATABASE=$SQL_DATABASE" >> "$ENV_FILE"
    echo "AZURE_SQL_USER=$SQL_USER" >> "$ENV_FILE"
    echo "AZURE_SQL_PASSWORD=$SQL_PASSWORD" >> "$ENV_FILE"
    
    # Create connection string
    CONNECTION_STRING="Server=$SQL_SERVER;Database=$SQL_DATABASE;User Id=$SQL_USER;Password=$SQL_PASSWORD;Encrypt=true;TrustServerCertificate=false"
    echo "AZURE_SQL_CONNECTION_STRING=$CONNECTION_STRING" >> "$ENV_FILE"
    
    echo ""
    echo "✅ SQL Database credentials added to $ENV_FILE!"
    echo ""
    echo "📝 Added variables:"
    echo "   - AZURE_SQL_SERVER"
    echo "   - AZURE_SQL_DATABASE"
    echo "   - AZURE_SQL_USER"
    echo "   - AZURE_SQL_PASSWORD"
    echo "   - AZURE_SQL_CONNECTION_STRING"
    echo ""
    echo "🧪 Test your connection:"
    echo "   npm run test-sql-storage"
    echo ""
fi

echo ""
echo "📚 For detailed instructions, see: GET-SQL-CREDENTIALS.md"

