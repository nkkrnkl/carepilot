#!/bin/bash

# Simple script to test SQL connection using credentials from env file
# Usage: ./scripts/test-sql-connection-simple.sh

echo "🔌 Testing SQL Database Connection"
echo "=================================="
echo ""

# Load environment variables from env file
if [ -f "env" ]; then
    export $(grep -v '^#' env | grep AZURE_SQL | xargs)
elif [ -f ".env" ]; then
    export $(grep -v '^#' .env | grep AZURE_SQL | xargs)
else
    echo "❌ Error: env file not found!"
    echo "   Please create an env file with SQL credentials"
    exit 1
fi

# Check if credentials are set
if [ -z "$AZURE_SQL_USER" ] || [ -z "$AZURE_SQL_PASSWORD" ]; then
    if [ -z "$AZURE_SQL_CONNECTION_STRING" ]; then
        echo "❌ Error: SQL credentials not found in env file!"
        echo ""
        echo "Please add the following to your env file:"
        echo "   AZURE_SQL_USER=your_username"
        echo "   AZURE_SQL_PASSWORD=your_password"
        echo ""
        echo "Or:"
        echo "   AZURE_SQL_CONNECTION_STRING=Server=...;Database=...;User Id=...;Password=..."
        exit 1
    fi
fi

echo "📋 Connection Details:"
echo "   Server: ${AZURE_SQL_SERVER:-k2sqldatabaseserver.database.windows.net}"
echo "   Database: ${AZURE_SQL_DATABASE:-K2Database}"
if [ -n "$AZURE_SQL_USER" ]; then
    echo "   User: $AZURE_SQL_USER"
fi
echo ""

# Use Node.js script if available
if command -v node &> /dev/null; then
    echo "🔄 Running connection test..."
    npm run test-sql-connection
else
    echo "❌ Node.js not found. Please install Node.js to run the connection test."
    echo ""
    echo "Alternatively, you can test using:"
    echo "   npm run test-sql-connection"
    exit 1
fi

