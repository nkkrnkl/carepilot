# Testing SQL Database Connection

This guide explains how to test your SQL Server database connection with fake data.

## Method 1: API Route (Recommended)

The easiest way to test the database connection is using the API route.

### Steps:

1. **Start your Next.js development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser and navigate to:**
   ```
   http://localhost:3000/api/test/database
   ```

3. **Or use curl:**
   ```bash
   curl http://localhost:3000/api/test/database
   ```

### Expected Response:

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

## Method 2: TypeScript Script (Alternative)

If you prefer to run a standalone script, you can use the TypeScript script.

### Prerequisites:

1. **Install tsx (TypeScript executor):**
   ```bash
   npm install -D tsx
   ```

2. **Add a script to package.json:**
   ```json
   {
     "scripts": {
       "test:db": "tsx scripts/test-sql-connection-with-data.ts"
     }
   }
   ```

3. **Run the test:**
   ```bash
   npm run test:db
   ```

### Expected Output:

```
🚀 Starting SQL Database Connection Tests with Fake Data
============================================================

🔌 Testing SQL Database Connection...

✅ Database connection successful!

📦 Generated test data for user: testuser-1234567890@example.com

📋 Testing Insurer Creation...
✅ Insurer created: insurer-1234567890-abc123 (precheckcover_id: precheck-1234567890-abc123)

🏥 Testing Provider Creation...
✅ Provider created: provider-1234567890-abc123 (Test Medical Center)

👤 Testing User Creation...
✅ User created: testuser-1234567890@example.com

👨‍⚕️ Testing Doctor Creation...
✅ Doctor created: doctor-1234567890-abc123 (Dr. Jane Smith)

📅 Testing Appointment Creation...
✅ Appointment created: apt-1234567890-xyz789

🔬 Testing Lab Report Creation...
✅ Lab report created: lab-1234567890-abc123 (Complete Blood Count (CBC))

💊 Testing Insurance Benefits Creation...
✅ Insurance benefits created: ID 1 (plan: Test Health Plan Premium)

📄 Testing EOB Creation...
✅ EOB record created: ID 1 (claim: CLM-1234567890-abc123)

🔍 Testing Data Retrieval...

✅ User retrieved: testuser-1234567890@example.com (John Doe)
✅ Lab reports retrieved: 1 report(s)
   - Complete Blood Count (CBC) (2025-01-10)
✅ Insurance benefits retrieved: 1 benefit record(s)
   - Test Health Plan Premium (Test Insurance Co)
✅ EOB records retrieved: 1 record(s)
   - Claim CLM-1234567890-abc123 (Test Medical Center) - $100
✅ Appointments retrieved: 1 appointment(s)
   - 2025-01-20 - scheduled

============================================================
✅ All tests passed successfully!

📊 Test Summary:
   - User: testuser-1234567890@example.com
   - Provider: provider-1234567890-abc123
   - Insurer: insurer-1234567890-abc123
   - Doctor: doctor-1234567890-abc123
   - Lab Report: lab-1234567890-abc123
   - Benefits: Test Health Plan Premium
   - EOB: CLM-1234567890-abc123

🔌 Database connection closed.
✨ Test script completed.
```

## Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```env
# Azure SQL Database Configuration
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USER=your-username
AZURE_SQL_PASSWORD=your-password

# OR use connection string
AZURE_SQL_CONNECTION_STRING=Server=your-server.database.windows.net;Database=your-database-name;User Id=your-username;Password=your-password;Encrypt=true;
```

## What Gets Tested?

The test script performs the following operations:

1. **Connection Test** - Tests database connection
2. **Create Insurer** - Creates a test insurer record
3. **Create Provider** - Creates a test provider record
4. **Create User** - Creates a test user with provider and insurer relationships
5. **Create Doctor** - Creates a test doctor record
6. **Create Appointment** - Creates a test appointment linking user and doctor
7. **Create Lab Report** - Creates a test lab report for the user
8. **Create Insurance Benefits** - Creates test insurance benefits for the user
9. **Create EOB Record** - Creates a test EOB record for the user
10. **Retrieve Data** - Retrieves all created data to verify it was saved correctly

## Troubleshooting

### Connection Errors

If you see connection errors:

1. **Check environment variables:**
   ```bash
   # Verify your .env.local file has the correct values
   cat .env.local
   ```

2. **Test connection manually:**
   ```bash
   # Use Azure SQL tools or sqlcmd to test connection
   sqlcmd -S your-server.database.windows.net -U your-username -P your-password -d your-database-name
   ```

3. **Check firewall rules:**
   - Ensure your IP address is allowed in Azure SQL firewall rules
   - Check if you're using the correct server name

### Table Not Found Errors

If you see "table not found" errors:

1. **Run the schema file:**
   ```bash
   # Execute database/schema.sql on your SQL Server database
   # Use Azure Data Studio, SQL Server Management Studio, or sqlcmd
   ```

2. **Verify tables exist:**
   ```sql
   SELECT TABLE_NAME 
   FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_TYPE = 'BASE TABLE';
   ```

### Foreign Key Errors

If you see foreign key constraint errors:

1. **Check table creation order:**
   - Tables must be created in the correct order (parent tables before child tables)
   - Run the schema.sql file which handles this automatically

2. **Verify foreign key relationships:**
   ```sql
   -- Check foreign keys
   SELECT 
     fk.name AS FK_Name,
     tp.name AS Parent_Table,
     cp.name AS Parent_Column,
     tr.name AS Referenced_Table,
     cr.name AS Referenced_Column
   FROM sys.foreign_keys AS fk
   INNER JOIN sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
   INNER JOIN sys.tables AS tp ON fkc.parent_object_id = tp.object_id
   INNER JOIN sys.columns AS cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
   INNER JOIN sys.tables AS tr ON fkc.referenced_object_id = tr.object_id
   INNER JOIN sys.columns AS cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id;
   ```

## Cleaning Up Test Data

After testing, you may want to clean up the test data:

```sql
-- Delete test data (be careful with this!)
DELETE FROM eob_records WHERE user_id LIKE 'testuser-%@example.com';
DELETE FROM insurance_benefits WHERE user_id LIKE 'testuser-%@example.com';
DELETE FROM LabReport WHERE userId LIKE 'testuser-%@example.com';
DELETE FROM userAppointmentScheduled_table WHERE userEmailAddress LIKE 'testuser-%@example.com';
DELETE FROM user_table WHERE emailAddress LIKE 'testuser-%@example.com';
DELETE FROM doctorInformation_table WHERE id LIKE 'doctor-%';
DELETE FROM provider_table WHERE provider_id LIKE 'provider-%';
DELETE FROM insurer_table WHERE unique_id LIKE 'insurer-%';
```

## Next Steps

After successfully testing the database connection:

1. **Review the test data** - Check that all relationships are working correctly
2. **Test your application** - Use the test user data in your application
3. **Create API endpoints** - Create API endpoints for your application to use
4. **Update frontend** - Update your frontend to display the data

## Support

If you encounter any issues:

1. Check the error messages in the test output
2. Verify your environment variables are correct
3. Ensure the database schema has been created
4. Check Azure SQL firewall rules
5. Review the database logs in Azure Portal

