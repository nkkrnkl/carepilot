# Setup SQL Database Credentials - Quick Steps

## ⚠️ Current Issue

The test failed because SQL credentials are not set in your `env` file.

## 🚀 Quick Setup (Choose One Method)

### Method 1: Interactive Script (Easiest)

1. **First, set up SQL Authentication in Azure Portal**:
   - Go to: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
   - Click "Set admin" or "Add SQL admin"
   - Enter username (e.g., `sqladmin`)
   - Enter password (save it!)
   - Click Save

2. **Configure Firewall**:
   - Go to: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking
   - Click "Add client IP"
   - Click Save

3. **Run the setup script**:
   ```bash
   ./scripts/get-sql-connection-string.sh
   ```
   - When prompted, enter your SQL username and password
   - The script will add them to your `env` file

4. **Test the connection**:
   ```bash
   npm run test-sql-storage
   ```

### Method 2: Manual Setup

1. **Get connection string from Azure Portal**:
   - Go to: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/K2Database/connectionstrings
   - Click "Connection strings" in left menu
   - Copy the connection string for "ADO.NET" or "Node.js"
   - Replace `{your_username}` and `{your_password}` with your actual credentials

2. **Add to your `env` file** (at `/Users/aymaanshaikh/Desktop/shadcntheme/env`):
   
   Add these lines at the end:
   ```bash
   # Azure SQL Database
   AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
   AZURE_SQL_DATABASE=K2Database
   AZURE_SQL_USER=your_actual_username_here
   AZURE_SQL_PASSWORD=your_actual_password_here
   AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_actual_username;Password=your_actual_password;Encrypt=true;TrustServerCertificate=false
   ```

3. **Replace placeholders**:
   - Replace `your_actual_username_here` with your SQL username
   - Replace `your_actual_password_here` with your SQL password

4. **Test the connection**:
   ```bash
   npm run test-sql-storage
   ```

## 📋 What You Need

- **SQL Server**: `k2sqldatabaseserver.database.windows.net`
- **Database**: `K2Database`
- **Username**: (Set in Azure Portal > SQL administrators)
- **Password**: (Set in Azure Portal > SQL administrators)

## 🔗 Direct Azure Portal Links

- **Set SQL Admin**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
- **Configure Firewall**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking
- **Get Connection String**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/K2Database/connectionstrings

## ✅ After Setup

Once credentials are added, run:
```bash
npm run test-sql-storage
```

This should successfully:
1. Create test insurer
2. Create test provider
3. Create test user
4. Add test document
5. List all users
6. Display "All tests passed!"

## ❌ Common Errors

### "Login failed for user"
- Make sure you set up SQL Authentication (not just Azure AD)
- Verify username and password are correct
- Check that credentials are in the `env` file

### "Cannot open server" or Firewall error
- Add your IP address in Firewall rules
- Enable "Allow Azure services" if needed

### Connection timeout
- Check your internet connection
- Verify firewall rules
- Ensure SQL Server is running

