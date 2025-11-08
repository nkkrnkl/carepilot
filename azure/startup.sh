#!/usr/bin/env bash
# Azure App Service Startup Script
# Ensures Next.js binds to the PORT environment variable set by Azure

set -euo pipefail

# Azure App Service sets PORT automatically
# Default to 8080 if not set (shouldn't happen in App Service)
export PORT=${PORT:-8080}

# Ensure Prisma client is generated (safety check)
if [ ! -d "node_modules/.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate || echo "Warning: Prisma generate failed, continuing..."
fi

# Start Next.js on the PORT provided by Azure
# Pass PORT directly to next start command
echo "Starting Next.js on port $PORT..."
exec node_modules/.bin/next start -p "$PORT"

