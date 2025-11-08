# Test SQL Database Connection

## Quick Test

To test your SQL Database connection, simply run:

```bash
npm run test-sql-connection
```

This script will:
1. ✅ Read credentials from your `env` file
2. ✅ Connect to Azure SQL Database
3. ✅ Run a test query
4. ✅ Show connection status and database info

## Before Running

Make sure you have added SQL credentials to your `env` file:

```bash
# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
```

Or use a connection string:

```bash
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username;Password=your_password;Encrypt=true;TrustServerCertificate=false
```

## Expected Output

### ✅ Success
```
🔌 Testing SQL Database Connection...

📋 Connection Details:
   Server: k2sqldatabaseserver.database.windows.net
   Database: K2Database
   User: your_username

🔄 Connecting to Azure SQL Database...
   Attempting connection...
✅ Connected successfully!

🧪 Running test query...
✅ Test query successful!

📊 Database Information:
   Database: K2Database
   Current User: your_username
   SQL Server Version: Microsoft SQL Server ...

🎉 Connection test passed!

✅ Your SQL Database credentials are working correctly!
```

### ❌ Failure
```
❌ Connection failed!

Error details:
   Message: Login failed for user 'your_username'
   Error Code: ELOGIN

🔍 Troubleshooting:
   ❌ Login failed - Check your username and password
   💡 Make sure SQL authentication is enabled in Azure Portal
   💡 Verify credentials in your env file
```

## Troubleshooting

### "Login failed for user"
- Check your username and password in the `env` file
- Make sure SQL authentication is enabled in Azure Portal
- Verify credentials are correct (no extra spaces)

### "Cannot open server" or Firewall error
- Add your IP address in Azure Portal > Networking
- Enable "Allow Azure services" if needed
- Check firewall rules

### "Connection timeout"
- Check your internet connection
- Verify server name is correct
- Check firewall rules

### "Credentials not found"
- Make sure your `env` file has SQL credentials
- Check that variables are named correctly
- Verify the `env` file is in the project root

## What This Script Tests

1. **Connection**: Tests if you can connect to the SQL Database
2. **Authentication**: Verifies your username and password work
3. **Database Access**: Confirms you can access the K2Database
4. **Query Execution**: Runs a simple query to verify everything works

## Next Steps

After a successful connection test:

1. **Create tables**:
   ```bash
   npm run create-sql-tables
   ```

2. **Run full test**:
   ```bash
   npm run test-sql-storage
   ```

## Manual Test

If you want to test manually, you can also use the script directly:

```bash
npx tsx scripts/test-sql-connection.ts
```

Or use the bash script:

```bash
./scripts/test-sql-connection-simple.sh
```

## Quick Command Reference

```bash
# Test connection
npm run test-sql-connection

# Create tables
npm run create-sql-tables

# Full storage test
npm run test-sql-storage

# Setup credentials
npm run setup-sql-credentials
```

