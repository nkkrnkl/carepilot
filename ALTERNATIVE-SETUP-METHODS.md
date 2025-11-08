# Alternative Methods to Set Up SQL Authentication

Since "SQL administrators" might not be visible in your Settings menu, here are alternative methods:

## Method 1: Direct URL to SQL Administrators

Try opening this URL directly in your browser:
```
https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
```

This should take you directly to the SQL administrators page, even if it's not visible in the menu.

## Method 2: Use Azure CLI

If you have Azure CLI installed, you can set up SQL authentication from the command line:

### Step 1: Install Azure CLI (if not installed)
```bash
# macOS
brew install azure-cli

# Or download from: https://docs.microsoft.com/cli/azure/install-azure-cli
```

### Step 2: Login to Azure
```bash
az login
```

### Step 3: Set SQL Administrator
```bash
# Create SQL admin (replace with your desired username and password)
az sql server create \
  --name k2sqldatabaseserver \
  --resource-group K2 \
  --location eastus \
  --admin-user sqladmin \
  --admin-password "YourStrongPassword123!"
```

Or update existing server:
```bash
az sql server update \
  --resource-group K2 \
  --name k2sqldatabaseserver \
  --administrator-login sqladmin \
  --administrator-login-password "YourStrongPassword123!"
```

## Method 3: Use Azure PowerShell

If you prefer PowerShell:

```powershell
# Login
Connect-AzAccount

# Set SQL admin
Set-AzSqlServerActiveDirectoryAdministrator `
  -ResourceGroupName "K2" `
  -ServerName "k2sqldatabaseserver" `
  -DisplayName "SQL Admin" `
  -ObjectId "<your-object-id>"
```

## Method 4: Check Database-Level Settings

Sometimes SQL authentication is configured at the database level:

1. **Go to the Database** (K2Database) instead of the Server
2. Look for **"Connection strings"** in Settings
3. Check if there's an **"Authentication"** or **"Security"** section
4. See if SQL authentication can be enabled there

## Method 5: Check if SQL Authentication is Already Enabled

Your SQL Server might already have SQL authentication enabled. Try:

1. **Go to the Database**: K2Database
2. Click **"Connection strings"** in Settings
3. Look at the connection strings - they might show you what authentication is available
4. If you see SQL authentication options, you might just need to create a user

## Method 6: Use Azure Portal Search

1. **Click the search bar** at the top of Azure Portal
2. Type: `SQL administrators k2sqldatabaseserver`
3. Look for the result and click on it
4. This might take you directly to the SQL administrators page

## Method 7: Check Resource Menu

1. **Click on "k2sqldatabaseserver"** in the top breadcrumb
2. Look at the **right side of the page** - there might be quick action buttons
3. Check if there's a **"SQL administrators"** or **"Set admin"** button there

## Method 8: Use Azure REST API

If you have API access, you can use the Azure REST API:

```bash
# Get access token
az account get-access-token --query accessToken -o tsv

# Use the token to call the REST API
# (This is advanced - only if other methods don't work)
```

## Quick Check: What Authentication Method is Currently Enabled?

1. **Go to the Database**: K2Database
2. Click **"Connection strings"**
3. Look at the available connection strings
4. This will tell you what authentication methods are available

## Recommended Approach

1. **First**: Try the direct URL (Method 1)
2. **Second**: Check the Database connection strings (Method 5)
3. **Third**: Use Azure CLI (Method 2) if you have it installed
4. **Fourth**: Contact Azure support if none of the above work

## After Setting Up Authentication

Once you have SQL authentication set up (using any method), you can:

1. **Add credentials to your env file** (manually or using the script)
2. **Test the connection**: `npm run test-sql-storage`
3. **Create tables**: `npm run create-sql-tables`

Let me know which method works for you!

