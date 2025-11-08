# Run Fix Migration - Quick Guide

## 🚀 Fix the Database Errors

Based on the test errors, you need to:

1. **Add OAuth columns to user_table**
2. **Create new tables with -v2 suffix**

## Step 1: Run the Fix Migration

Execute this SQL script on your database:

```bash
# Using Azure Data Studio, SQL Server Management Studio, or sqlcmd
# Run: database/fix-migration.sql
```

Or using sqlcmd:

```bash
sqlcmd -S your-server.database.windows.net -U your-username -P your-password -d your-database -i database/fix-migration.sql
```

## What the Migration Does

1. ✅ Adds OAuth columns to `user_table` (if they don't exist)
2. ✅ Creates `LabReport_v2` table
3. ✅ Creates `insurance_benefits_v2` table
4. ✅ Creates `eob_records_v2` table
5. ✅ Creates indexes and triggers

## Step 2: Test Again

After running the migration, test again:

```bash
# Start dev server
npm run dev

# Test the endpoint
curl http://localhost:3000/api/test/database
```

## Expected Result

After the migration, you should see:
- ✅ All steps succeed
- ✅ No "Invalid column name" errors
- ✅ No "Invalid object name" errors
- ✅ Test data created successfully

## Quick SQL Commands

If you want to run the migration manually:

```sql
-- 1. Add OAuth columns
ALTER TABLE [dbo].[user_table]
ADD [oauth_provider] NVARCHAR(50) NULL,
    [oauth_provider_id] NVARCHAR(255) NULL,
    [oauth_email] NVARCHAR(255) NULL;

-- 2. Create LabReport_v2 (see fix-migration.sql for full script)
-- 3. Create insurance_benefits_v2
-- 4. Create eob_records_v2
```

## Files

- **database/fix-migration.sql** - Quick fix migration script
- **database/migration-v2-tables.sql** - Full migration with detection

## After Migration

The code will automatically detect which tables exist and use the appropriate ones:
- If `LabReport_v2` exists, it will use that
- If only `LabReport` exists, it will use that
- Same for `insurance_benefits` and `eob_records`

## Need Help?

See `database/RUN-TEST.md` for detailed testing documentation.

