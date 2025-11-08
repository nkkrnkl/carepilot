# How to Find SQL Administrators in Azure Portal

Based on your Settings menu, here's where to find SQL Administrators:

## Option 1: Under "Microsoft Entra ID" (Most Likely)

1. **Click on "Microsoft Entra ID"** in the Settings menu
2. Look for options related to authentication or administrators
3. SQL administrators might be configured here if using Azure AD authentication

## Option 2: Under "Data management"

1. **Click on "Data management"** (the one with the right-pointing chevron)
2. This section might contain SQL administrators settings
3. Expand it to see all options

## Option 3: Under "Security" Section

1. Look for a **"Security"** section in the Settings menu (might be collapsed)
2. SQL administrators is often under Security settings
3. Expand Security to see if SQL administrators is listed there

## Option 4: Search for SQL Administrators

1. **Use the search bar** at the top of the Azure Portal
2. Type: `SQL administrators` or `sql admin`
3. Look for the SQL Server SQL administrators option
4. Click on it to go directly to that page

## Option 5: Direct Link

Try this direct link to SQL administrators:
**https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins**

## Option 6: Check the Top Menu

1. Look at the **top of the page** (above Settings)
2. There might be a **"SQL administrators"** link in the top menu bar
3. Or check under **"Overview"** section - sometimes there's a quick link there

## Option 7: Use Azure CLI (Alternative)

If you can't find it in the portal, you can set up SQL authentication using Azure CLI:

```bash
# Login to Azure
az login

# Set SQL admin (replace with your credentials)
az sql server ad-admin create \
  --resource-group K2 \
  --server k2sqldatabaseserver \
  --display-name "SQL Admin" \
  --object-id <your-object-id>
```

Or set SQL authentication directly:

```bash
# This requires the server to support SQL authentication
az sql server update \
  --resource-group K2 \
  --name k2sqldatabaseserver \
  --enable-ad-only-auth false
```

## What to Look For

The SQL administrators page typically shows:
- Current SQL authentication admin (if any)
- "Set admin" or "Add SQL admin" button
- Option to enable/disable SQL authentication

## If SQL Administrators is Not Available

This might mean:
1. **SQL authentication is disabled** - You may need to enable it first
2. **You need different permissions** - Check if you have Contributor or Owner role
3. **Different Azure Portal version** - The UI might be different in your region/version
4. **Using Azure AD only** - The server might be configured for Azure AD authentication only

## Alternative: Use Connection String from Database

If you can't find SQL administrators, try:

1. **Go to the Database** (K2Database) instead of the Server
2. Look for **"Connection strings"** in the database Settings
3. Get the connection string which might already have authentication configured
4. Or check if there's an "Authentication" section in the database Settings

## Next Steps

1. **Try the direct link** first (Option 5)
2. **Check under "Data management"** (Option 2)
3. **Use the search bar** (Option 4)
4. **Check "Microsoft Entra ID"** (Option 1)

Let me know what you find, and I can help you proceed!

