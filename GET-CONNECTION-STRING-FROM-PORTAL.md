# How to Get SQL Database Connection String from Azure Portal

Since you're on the K2Database overview page, here's how to get the connection string:

## Step 1: Get Connection String from Azure Portal

1. **On the K2Database page**, look for **"Connection strings"** in the left menu (under **Settings**)

2. **Click on "Connection strings"**

3. **Select "ADO.NET" or "Node.js"** tab

4. **Copy the connection string**. It will look like:
   ```
   Server=tcp:k2sqldatabaseserver.database.windows.net,1433;Initial Catalog=K2Database;Persist Security Info=False;User ID={your_username};Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

## Step 2: Set Up SQL Authentication (If Not Done)

Before you can use the connection string, you need SQL authentication credentials:

1. **Go to SQL Server**: Navigate to `k2sqldatabaseserver` (not the database)
2. **Go to**: Settings > SQL administrators
3. **Click**: "Set admin" or "Add SQL admin"
4. **Enter**:
   - Username (e.g., `sqladmin`)
   - Password (save this securely!)
5. **Click**: Save

## Step 3: Configure Firewall

1. **Go to SQL Server**: `k2sqldatabaseserver`
2. **Go to**: Settings > Networking
3. **Click**: "Add client IP" to allow your current IP
4. **Click**: Save

## Step 4: Format Connection String for Our Project

Our project uses a simpler format. Convert the Azure connection string to:

```
Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

Or use individual credentials in `.env`:

```bash
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
```

## Step 5: Add to .env File

Since your `.env` file is named `env` (without the dot), add these lines:

```bash
# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here

# Or use connection string
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

## Quick Script

Run this script to interactively add credentials:

```bash
./scripts/get-sql-connection-string.sh
```

Or use npm:

```bash
npm run setup-sql-credentials
```

## Direct Links

- **K2Database Overview**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/K2Database/overview
- **Connection Strings**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/K2Database/connectionstrings
- **SQL Administrators**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
- **Networking/Firewall**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking

## Test Connection

After adding credentials, test the connection:

```bash
npm run test-sql-storage
```

Or create the tables:

```bash
npm run create-sql-tables
```

