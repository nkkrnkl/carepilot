# How to Get Azure SQL Database Environment Variables

This guide will walk you through getting all the necessary credentials for Azure SQL Database.

## Step 1: Access Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your account: `aymaaniliyasgmail.onmicrosoft.com`

## Step 2: Navigate to Your SQL Server

1. In the Azure Portal search bar, search for `k2sqldatabaseserver`
2. Click on the SQL Server: **k2sqldatabaseserver**
3. Or navigate directly: [SQL Server Overview](https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/overview)

## Step 3: Get SQL Server Details

From the SQL Server overview page, you'll see:
- **Server name**: `k2sqldatabaseserver.database.windows.net`
- **Subscription**: `41f56be4-b097-45ca-b7a6-b064a0c7189e`
- **Resource group**: `K2`

## Step 4: Set Up SQL Administrator (If Not Already Set)

1. In the SQL Server menu, go to **Settings** > **SQL administrators**
2. You have two options:

### Option A: Use Azure AD Authentication (Recommended for Azure Portal users)
- Click **"Add Azure AD admin"**
- Select your account or another Azure AD user
- Click **Save**

### Option B: Use SQL Authentication (Recommended for application connections)
1. Click **"Set admin"** or **"Add SQL admin"**
2. Enter a username (e.g., `sqladmin` or `carepilot_admin`)
3. Enter a strong password (save this securely!)
4. Click **Save**

**Important**: Write down the username and password - you'll need them for the connection string!

## Step 5: Configure Firewall Rules

1. In the SQL Server menu, go to **Settings** > **Networking**
2. Under **Firewall rules**, you need to:

### Allow Your Current IP Address
1. Click **"Add client IP"** to add your current IP address
2. Click **Save**

### Allow Azure Services (For production)
1. Toggle **"Allow Azure services and resources to access this server"** to **Yes**
2. Click **Save**

**Note**: For development, you can temporarily allow all IPs (0.0.0.0 - 255.255.255.255), but this is not recommended for production.

## Step 6: Get Database Name

1. In the SQL Server menu, go to **Settings** > **SQL databases**
2. You should see your databases:
   - `K2Database` (or `insurer_table`, `provider_table`, `user_table` if they're separate databases)
3. Note the database name(s)

## Step 7: Get Connection String (Alternative Method)

1. Go to your SQL Database (e.g., `K2Database`)
2. In the database menu, go to **Settings** > **Connection strings**
3. Select **ADO.NET** or **Node.js**
4. Copy the connection string
5. Replace `{your_username}` and `{your_password}` with your actual credentials

Example connection string format:
```
Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

## Step 8: Set Environment Variables

Create or update your `.env` file in the project root:

```bash
# Azure SQL Database Configuration
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here

# OR use connection string (recommended)
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

## Step 9: Verify Your Credentials

Run the test script to verify your credentials work:

```bash
npm run test-sql-storage
```

Or create the tables:

```bash
npm run create-sql-tables
```

## Quick Reference

### Environment Variables Needed

```bash
# Required (choose one method):

# Method 1: Individual credentials
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password

# Method 2: Connection string (recommended)
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

### Azure SQL Server Details

- **Server**: `k2sqldatabaseserver.database.windows.net`
- **Database**: `K2Database`
- **Subscription ID**: `41f56be4-b097-45ca-b7a6-b064a0c7189e`
- **Resource Group**: `K2`

## Troubleshooting

### "Login failed for user" Error

- Verify your username and password are correct
- Make sure you set up SQL Authentication (not just Azure AD)
- Check that the user has permissions on the database

### "Cannot open server" or "Firewall" Error

- Add your IP address in Firewall rules
- Enable "Allow Azure services" if deploying to Azure
- Check that the server name is correct

### "Database does not exist" Error

- Verify the database name is correct
- Make sure the database exists in your SQL Server
- Check that you have permissions to access the database

### Connection Timeout

- Check your internet connection
- Verify firewall rules allow your IP
- Ensure the SQL Server is running (check status in Azure Portal)

## Security Best Practices

1. **Never commit credentials to Git**: Always use `.env` file and add it to `.gitignore`
2. **Use strong passwords**: Generate a strong, unique password for SQL authentication
3. **Limit firewall rules**: Only allow specific IP addresses, not all IPs
4. **Use connection strings in production**: Store them securely in Azure Key Vault or environment variables
5. **Rotate passwords regularly**: Change SQL passwords periodically

## Using Azure CLI (Alternative Method)

If you have Azure CLI installed, you can also get some information:

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e

# List SQL servers
az sql server list --resource-group K2

# Get SQL server details
az sql server show --name k2sqldatabaseserver --resource-group K2

# List databases
az sql db list --server k2sqldatabaseserver --resource-group K2

# Get firewall rules
az sql server firewall-rule list --server k2sqldatabaseserver --resource-group K2
```

## Next Steps

Once you have your credentials set up:

1. Add them to your `.env` file
2. Run `npm run create-sql-tables` to create the tables
3. Run `npm run test-sql-storage` to test the connection
4. Start using the SQL Database in your application!

