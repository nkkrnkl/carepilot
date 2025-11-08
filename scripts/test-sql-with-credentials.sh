#!/bin/bash

# Script to test SQL connection with credentials as arguments
# Usage: ./scripts/test-sql-with-credentials.sh username password
# Or: npm run test-sql-connection -- user=username password=password

USERNAME=$1
PASSWORD=$2

if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    echo "❌ Error: Username and password required!"
    echo ""
    echo "Usage:"
    echo "   ./scripts/test-sql-with-credentials.sh <username> <password>"
    echo ""
    echo "Or:"
    echo "   npm run test-sql-connection -- user=<username> password=<password>"
    echo ""
    echo "Example:"
    echo "   ./scripts/test-sql-with-credentials.sh sqladmin 'abc123!!'"
    echo "   npm run test-sql-connection -- user=sqladmin password='abc123!!'"
    exit 1
fi

echo "🔌 Testing SQL Connection with provided credentials..."
echo "   Username: $USERNAME"
echo "   Password: ***"
echo ""

# Export credentials as environment variables
export AZURE_SQL_USER="$USERNAME"
export AZURE_SQL_PASSWORD="$PASSWORD"
export AZURE_SQL_SERVER="k2sqldatabaseserver.database.windows.net"
export AZURE_SQL_DATABASE="K2Database"

# Run the test script
npx tsx scripts/test-sql-connection.ts

