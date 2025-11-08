# Update Your env File with SQL Database Credentials

Your `.env` file is named `env` (without the dot). Here's how to add SQL Database credentials:

## Current env File Location

Your env file is at: `/Users/aymaanshaikh/Desktop/shadcntheme/env`

## Add SQL Database Credentials

Add these lines to your `env` file (after line 10):

```bash
# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here

# Or use connection string (recommended)
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

## Steps to Get Credentials

1. **Get Connection String from Azure Portal**:
   - Go to: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/K2Database/connectionstrings
   - Click on "Connection strings" in the left menu
   - Copy the connection string for "ADO.NET" or "Node.js"
   - Replace `{your_username}` and `{your_password}` with your actual credentials

2. **Or Set Up SQL Authentication**:
   - Go to SQL Server: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
   - Click "Set admin" or "Add SQL admin"
   - Enter username and password
   - Save

3. **Configure Firewall**:
   - Go to: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking
   - Click "Add client IP"
   - Save

## Quick Add Using Script

Run this script to interactively add credentials:

```bash
./scripts/get-sql-connection-string.sh
```

This will:
- Ask for your SQL username and password
- Automatically add them to your `env` file
- Create the connection string

## Your Updated env File Should Look Like:

```bash
K2_API_KEY =IFM-GcZbhYqNGoKWcIuJ
PINECONE_API_KEY =pcsk_39ikrP_9ruagfrjw3i9C7sitXwzVJ2f3JPy7N9Ft9DasqaX5ReLMPiz7TKP4hDDBvtR6oB

# AZURE_REGION=southeastasia

# Azure AI Foundry Service
AZURE_OPENAI_ENDPOINT=https://foundrymodelsk2hackathon.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=EWHEqNFG4lLBRe9D99C5JNq6Lw8UtvHycJzpLyU4C93481z0f5kpJQQJ99BKACYeBjFXJ3w3AAAAACOGVzY1
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

## Test After Adding

Once you've added the credentials, test the connection:

```bash
npm run test-sql-storage
```

Or create the tables:

```bash
npm run create-sql-tables
```

