# Quick Test Guide - SQL Database

## 🚀 Run the Test Now!

### Option 1: API Route (Easiest - Recommended) ⭐

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000/api/test/database
   ```

   **Or use curl:**
   ```bash
   curl http://localhost:3000/api/test/database
   ```

### Option 2: Command Line Script

1. **Run the test script:**
   ```bash
   npm run test:db
   ```

   **Or directly with tsx:**
   ```bash
   npx tsx scripts/test-sql-connection-with-data.ts
   ```

## 📋 Prerequisites Check

Before running the test, make sure:

1. ✅ **Database schema is created:**
   - Run `database/schema.sql` on your SQL Server database
   - Use Azure Data Studio, SQL Server Management Studio, or sqlcmd

2. ✅ **Environment variables are set:**
   - Check `.env.local` has:
     ```env
     AZURE_SQL_SERVER=your-server.database.windows.net
     AZURE_SQL_DATABASE=your-database-name
     AZURE_SQL_USER=your-username
     AZURE_SQL_PASSWORD=your-password
     ```

3. ✅ **Dependencies are installed:**
   ```bash
   npm install
   ```

## 🎯 What Gets Tested

The test will:
- ✅ Connect to SQL Server
- ✅ Create test insurer
- ✅ Create test provider
- ✅ Create test user (with OAuth support)
- ✅ Create test doctor
- ✅ Create test appointment
- ✅ Create test lab report
- ✅ Create test insurance benefits
- ✅ Create test EOB record
- ✅ Retrieve all data to verify

## ✅ Success Looks Like

You should see a JSON response with:
```json
{
  "success": true,
  "steps": [
    { "step": "Connection Test", "status": "success" },
    { "step": "Create Insurer", "status": "success" },
    // ... more successful steps
  ],
  "data": {
    "testUserEmail": "testuser-...@example.com",
    // ... test data IDs
  }
}
```

## ❌ Common Issues

### "Database connection failed"
- Check `.env.local` credentials
- Verify Azure SQL firewall allows your IP
- Test connection with Azure Data Studio

### "Table not found"
- Run `database/schema.sql` on your database
- Verify tables were created

### "Cannot find module 'mssql'"
```bash
npm install mssql
```

## 📚 More Help

See `database/RUN-TEST.md` for detailed documentation.

