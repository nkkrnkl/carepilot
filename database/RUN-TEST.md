# How to Run SQL Database Test

## Quick Start

### Method 1: API Route (Easiest) ⭐

1. **Make sure your `.env.local` file has SQL credentials:**
   ```env
   AZURE_SQL_SERVER=your-server.database.windows.net
   AZURE_SQL_DATABASE=your-database-name
   AZURE_SQL_USER=your-username
   AZURE_SQL_PASSWORD=your-password
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   ```
   http://localhost:3000/api/test/database
   ```

   **Or use curl:**
   ```bash
   curl http://localhost:3000/api/test/database
   ```

### Method 2: Using the Script

1. **Run the test script:**
   ```bash
   bash scripts/run-db-test.sh
   ```

   This will:
   - Check if `.env.local` exists
   - Install dependencies if needed
   - Start the dev server
   - Show you the test URL

### Method 3: TypeScript Script (Alternative)

1. **Install tsx (if not already installed):**
   ```bash
   npm install -D tsx
   ```

2. **Run the test script:**
   ```bash
   npm run test:db
   ```

   Or directly:
   ```bash
   npx tsx scripts/test-sql-connection-with-data.ts
   ```

## What the Test Does

The test will:
1. ✅ Connect to your SQL Server database
2. ✅ Create a test insurer
3. ✅ Create a test provider
4. ✅ Create a test user (with OAuth fields support)
5. ✅ Create a test doctor
6. ✅ Create a test appointment
7. ✅ Create a test lab report
8. ✅ Create test insurance benefits
9. ✅ Create a test EOB record
10. ✅ Retrieve all data to verify it was saved correctly

## Expected Output

### API Route Response

```json
{
  "success": true,
  "steps": [
    {
      "step": "Connection Test",
      "status": "success",
      "message": "Database connection successful"
    },
    {
      "step": "Create Insurer",
      "status": "success",
      "message": "Insurer created: insurer-1234567890-abc123"
    },
    // ... more steps
  ],
  "data": {
    "testUserEmail": "testuser-1234567890@example.com",
    "insurerId": "insurer-1234567890-abc123",
    "providerId": "provider-1234567890-abc123",
    "userEmail": "testuser-1234567890@example.com",
    "doctorId": "doctor-1234567890-abc123",
    "appointmentId": "apt-1234567890-xyz789",
    "labReportId": "lab-1234567890-abc123",
    "benefitsId": 1,
    "eobId": 1,
    "retrieved": {
      "user": {
        "email": "testuser-1234567890@example.com",
        "name": "John Doe"
      },
      "labReports": 1,
      "benefits": 1,
      "eobs": 1,
      "appointments": 1
    }
  },
  "errors": []
}
```

## Troubleshooting

### Connection Error

**Error:** `Database connection failed`

**Solution:**
1. Check your `.env.local` file has correct credentials
2. Verify Azure SQL firewall allows your IP address
3. Test connection with Azure Data Studio or SQL Server Management Studio

### Table Not Found Error

**Error:** `Invalid object name 'user_table'`

**Solution:**
1. Run the database schema: Execute `database/schema.sql` on your SQL Server
2. Verify tables were created:
   ```sql
   SELECT TABLE_NAME 
   FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_TYPE = 'BASE TABLE';
   ```

### Foreign Key Error

**Error:** `The INSERT statement conflicted with the FOREIGN KEY constraint`

**Solution:**
1. Make sure you ran the schema.sql file (tables must be created in order)
2. Check that parent tables exist before child tables

### Missing Dependencies

**Error:** `Cannot find module 'mssql'`

**Solution:**
```bash
npm install mssql
```

### Environment Variables Not Found

**Error:** `AZURE_SQL_USER and AZURE_SQL_PASSWORD must be set`

**Solution:**
1. Create `.env.local` file in the project root
2. Add your SQL Server credentials:
   ```env
   AZURE_SQL_SERVER=your-server.database.windows.net
   AZURE_SQL_DATABASE=your-database-name
   AZURE_SQL_USER=your-username
   AZURE_SQL_PASSWORD=your-password
   ```

## Prerequisites

1. ✅ SQL Server database created (Azure SQL or local SQL Server)
2. ✅ Database schema executed (`database/schema.sql`)
3. ✅ Environment variables set in `.env.local`
4. ✅ Dependencies installed (`npm install`)
5. ✅ Azure SQL firewall allows your IP (if using Azure SQL)

## Next Steps

After successful testing:

1. ✅ Your database is working!
2. ✅ All tables are created correctly
3. ✅ Foreign keys are working
4. ✅ OAuth fields are supported
5. ✅ You can now use the database in your application

## Clean Up Test Data (Optional)

If you want to remove test data after testing:

```sql
-- Delete test data
DELETE FROM eob_records WHERE user_id LIKE 'testuser-%@example.com';
DELETE FROM insurance_benefits WHERE user_id LIKE 'testuser-%@example.com';
DELETE FROM LabReport WHERE userId LIKE 'testuser-%@example.com';
DELETE FROM userAppointmentScheduled_table WHERE userEmailAddress LIKE 'testuser-%@example.com';
DELETE FROM user_table WHERE emailAddress LIKE 'testuser-%@example.com';
DELETE FROM doctorInformation_table WHERE id LIKE 'doctor-%';
DELETE FROM provider_table WHERE provider_id LIKE 'provider-%';
DELETE FROM insurer_table WHERE unique_id LIKE 'insurer-%';
```

## Support

For more details, see:
- `database/TESTING.md` - Detailed testing documentation
- `database/QUICK-START-TEST.md` - Quick start guide
- `database/schema.sql` - Database schema

