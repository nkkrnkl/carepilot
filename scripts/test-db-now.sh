#!/bin/bash

# Quick script to test SQL database connection
# This will start the dev server and test the database

echo "🧪 CarePilot SQL Database Test"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with your SQL Server credentials"
    exit 1
fi

echo "✅ .env.local found"
echo ""

# Check if port 3000 is in use
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is already in use"
    echo "   The dev server might already be running"
    echo "   You can test at: http://localhost:3000/api/test/database"
    echo ""
    read -p "Do you want to test the endpoint now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📡 Testing database connection..."
        curl -s http://localhost:3000/api/test/database | jq '.' || curl -s http://localhost:3000/api/test/database
        echo ""
        echo "✅ Test complete!"
    fi
    exit 0
fi

echo "🚀 Starting Next.js dev server..."
echo ""
echo "   Once the server starts, the test will run automatically"
echo "   Or open: http://localhost:3000/api/test/database"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

# Start dev server in background and test after a delay
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 8

# Test the endpoint
echo ""
echo "📡 Testing database connection..."
curl -s http://localhost:3000/api/test/database | jq '.' || curl -s http://localhost:3000/api/test/database

echo ""
echo ""
echo "✅ Test complete! Server is still running on http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

# Wait for user to stop
wait $SERVER_PID

