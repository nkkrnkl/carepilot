# Quick Start: Test SQL Database Connection

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install mssql package (if not already installed):**
   ```bash
   npm install mssql
   ```

3. **Install tsx (for running TypeScript scripts):**
   ```bash
   npm install -D tsx
   ```

4. **Set up environment variables in `.env.local`:**
   ```env
   AZURE_SQL_SERVER=your-server.database.windows.net
   AZURE_SQL_DATABASE=your-database-name
   AZURE_SQL_USER=your-username
   AZURE_SQL_PASSWORD=your-password
   ```

5. **Run the database schema:**
   - Execute `database/schema.sql` on your SQL Server database
   - Use Azure Data Studio, SQL Server Management Studio, or sqlcmd

## Method 1: API Route (Easiest) ⭐

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000/api/test/database
   ```

3. **Or use curl:**
   ```bash
   curl http://localhost:3000/api/test/database
   ```

You should see a JSON response with test results!

## Method 2: Command Line Script

1. **Run the test script:**
   ```bash
   npm run test:db
   ```

2. **Or directly with tsx:**
   ```bash
   npx tsx scripts/test-sql-connection-with-data.ts
   ```

## What Happens?

The test will:
1. ✅ Connect to your SQL Server database
2. ✅ Create a test insurer
3. ✅ Create a test provider
4. ✅ Create a test user (linked to insurer and provider)
5. ✅ Create a test doctor
6. ✅ Create a test appointment
7. ✅ Create a test lab report
8. ✅ Create test insurance benefits
9. ✅ Create a test EOB record
10. ✅ Retrieve all data to verify it was saved

## Expected Output

### API Route Response:
```json
{
  "success": true,
  "steps": [
    {
      "step": "Connection Test",
      "status": "success",
      "message": "Database connection successful"
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

### Command Line Output:
```
🚀 Starting SQL Database Connection Tests with Fake Data
============================================================

🔌 Testing SQL Database Connection...
✅ Database connection successful!

📦 Generated test data for user: testuser-1234567890@example.com

📋 Testing Insurer Creation...
✅ Insurer created: insurer-1234567890-abc123

🏥 Testing Provider Creation...
✅ Provider created: provider-1234567890-abc123

👤 Testing User Creation...
✅ User created: testuser-1234567890@example.com

👨‍⚕️ Testing Doctor Creation...
✅ Doctor created: doctor-1234567890-abc123

📅 Testing Appointment Creation...
✅ Appointment created: apt-1234567890-xyz789

🔬 Testing Lab Report Creation...
✅ Lab report created: lab-1234567890-abc123

💊 Testing Insurance Benefits Creation...
✅ Insurance benefits created: ID 1

📄 Testing EOB Creation...
✅ EOB record created: ID 1

🔍 Testing Data Retrieval...
✅ All data retrieved successfully!

============================================================
✅ All tests passed successfully!
```

## Troubleshooting

### Connection Error?
- Check your `.env.local` file has correct credentials
- Verify Azure SQL firewall allows your IP
- Test connection with Azure Data Studio

### Table Not Found?
- Run `database/schema.sql` on your database
- Verify tables were created: `SELECT * FROM INFORMATION_SCHEMA.TABLES`

### Foreign Key Error?
- Ensure schema was run in correct order
- Check that parent tables exist before child tables

## Next Steps

After successful testing:
1. ✅ Your database is working!
2. ✅ All tables are created correctly
3. ✅ Foreign keys are working
4. ✅ You can now use the database in your application

## Clean Up Test Data (Optional)

If you want to remove test data:

```sql
DELETE FROM eob_records WHERE user_id LIKE 'testuser-%@example.com';
DELETE FROM insurance_benefits WHERE user_id LIKE 'testuser-%@example.com';
DELETE FROM LabReport WHERE userId LIKE 'testuser-%@example.com';
DELETE FROM userAppointmentScheduled_table WHERE userEmailAddress LIKE 'testuser-%@example.com';
DELETE FROM user_table WHERE emailAddress LIKE 'testuser-%@example.com';
DELETE FROM doctorInformation_table WHERE id LIKE 'doctor-%';
DELETE FROM provider_table WHERE provider_id LIKE 'provider-%';
DELETE FROM insurer_table WHERE unique_id LIKE 'insurer-%';
```

## Need Help?

See `database/TESTING.md` for detailed documentation.

