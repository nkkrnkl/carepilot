# Quick Start: Get Azure SQL Database Credentials

## 🚀 Fastest Way

### Option 1: Use the Interactive Script

```bash
./scripts/get-sql-credentials.sh
```

This script will:
- Guide you through the process
- Ask for your SQL username and password
- Automatically add them to your `.env` file

### Option 2: Manual Setup

1. **Open Azure Portal**: https://portal.azure.com
2. **Search for**: `k2sqldatabaseserver`
3. **Go to**: Settings > SQL administrators
4. **Set up SQL Authentication**:
   - Click "Set admin" or "Add SQL admin"
   - Enter username (e.g., `sqladmin`)
   - Enter password (save it!)
   - Click Save
5. **Configure Firewall**:
   - Go to: Settings > Networking
   - Click "Add client IP"
   - Click Save
6. **Add to .env file**:

```bash
# Add these lines to your .env file
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here
```

## 🧪 Test Your Connection

```bash
npm run test-sql-storage
```

## 📋 Required Information

- **Server**: `k2sqldatabaseserver.database.windows.net`
- **Database**: `K2Database`
- **Username**: (Set in Azure Portal)
- **Password**: (Set in Azure Portal)

## 🔗 Direct Links

- **SQL Server**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/overview
- **SQL Administrators**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
- **Networking/Firewall**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking

## 📚 Detailed Instructions

For step-by-step instructions with screenshots, see: **GET-SQL-CREDENTIALS.md**

## ⚠️ Common Issues

### "Login failed for user"
- Make sure you set up SQL Authentication (not just Azure AD)
- Verify username and password are correct

### "Cannot open server" or Firewall error
- Add your IP address in Firewall rules
- Enable "Allow Azure services" if needed

### Connection timeout
- Check your internet connection
- Verify firewall rules
- Ensure SQL Server is running

## ✅ Next Steps

After setting up credentials:

1. **Create tables**: `npm run create-sql-tables`
2. **Test connection**: `npm run test-sql-storage`
3. **Start using SQL Database** in your application!

