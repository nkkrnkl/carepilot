#!/bin/bash

# Script to run SQL Database Test
# This script helps you test the SQL database connection with mock data

echo "🚀 CarePilot SQL Database Test"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your SQL Server credentials:"
    echo ""
    echo "  AZURE_SQL_SERVER=your-server.database.windows.net"
    echo "  AZURE_SQL_DATABASE=your-database-name"
    echo "  AZURE_SQL_USER=your-username"
    echo "  AZURE_SQL_PASSWORD=your-password"
    echo ""
    exit 1
fi

echo "✅ .env.local found"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if mssql is installed
if ! npm list mssql > /dev/null 2>&1; then
    echo "📦 Installing mssql..."
    npm install mssql
    echo ""
fi

# Method 1: API Route (Recommended)
echo "🌐 Starting Next.js dev server..."
echo "   Then open: http://localhost:3000/api/test/database"
echo ""
echo "   Or use curl:"
echo "   curl http://localhost:3000/api/test/database"
echo ""
echo "Press Ctrl+C to stop the server when done testing"
echo ""

# Start the dev server
npm run dev

