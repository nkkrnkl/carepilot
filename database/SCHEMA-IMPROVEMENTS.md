# Database Schema Improvements Summary

## Overview

This document summarizes the improvements made to the CarePilot database schema based on your requirements.

## Key Improvements

### 1. ✅ Foreign Key from user_table to provider_table
- **Status**: Implemented
- **Details**: Added `providerId` foreign key constraint in `user_table` that references `provider_table.provider_id`
- **Constraint**: `FK_user_provider` with `ON DELETE SET NULL` and `ON UPDATE CASCADE`

### 2. ✅ Multiple Lab Reports per User
- **Status**: Implemented
- **Details**: Created `LabReport` table with `userId` foreign key to `user_table`
- **Features**:
  - Each user can have multiple lab reports
  - Stores metadata: title, date, hospital, doctor, fileUrl
  - Stores structured data: rawExtract (JSON), parameters (JSON)
  - Proper indexing on `userId` and `date` for performance

### 3. ✅ Insurance Benefits Table
- **Status**: Implemented
- **Details**: Created `insurance_benefits` table with all required fields
- **Key Features**:
  - Includes `precheckcover_id` as requested (unique identifier)
  - Stores all benefits data from your JSON structure
  - Complex nested data stored as JSON strings (deductibles, copays, coinsurance, services)
  - Foreign key to `user_table` via `user_id`
  - Unique constraint on `(plan_name, policy_number, user_id)` to prevent duplicates
  - Supports upsert operations (insert or update if exists)

### 4. ✅ EOB Records Table
- **Status**: Implemented
- **Details**: Created `eob_records` table with all required fields
- **Key Features**:
  - Stores all EOB data from your JSON structure
  - Foreign key to `user_table` via `user_id`
  - Unique constraint on `(claim_number, user_id)` to prevent duplicates
  - Stores services and coverage breakdown as JSON strings
  - Supports alerts and discrepancies arrays
  - Supports upsert operations (insert or update if exists)

## Data Model Improvements

### Relationships

```
insurer_table (1) ──< (N) user_table
provider_table (1) ──< (N) user_table
user_table (1) ──< (N) userAppointmentScheduled_table
user_table (1) ──< (N) LabReport
user_table (1) ──< (N) insurance_benefits
user_table (1) ──< (N) eob_records
doctorInformation_table (1) ──< (N) userAppointmentScheduled_table
```

### Foreign Key Constraints

All foreign keys are properly defined with:
- **Cascade Delete**: For appointments, lab reports, benefits, and EOBs (when user is deleted)
- **Set Null**: For user's provider and insurer (allows user to exist without provider/insurer)
- **Cascade Update**: All foreign keys update when primary keys change

### Indexing Strategy

**Performance Indexes:**
- All foreign keys are indexed
- Frequently queried fields (dates, names, claim numbers) are indexed
- Composite indexes on unique constraints

**Example Indexes:**
- `idx_user_provider` on `user_table(providerId)`
- `idx_labreport_user` on `LabReport(userId)`
- `idx_benefits_user` on `insurance_benefits(user_id)`
- `idx_eob_user` on `eob_records(user_id)`
- `idx_benefits_precheckcover` on `insurance_benefits(precheckcover_id)`

### JSON Storage

Complex nested data is stored as JSON strings in SQL Server:
- **Benefits**: deductibles, copays, coinsurance, services, exclusions, etc.
- **EOB**: services, coverage_breakdown, alerts, discrepancies
- **Lab Reports**: rawExtract, parameters

**Benefits:**
- Flexibility to store varying structures
- Easy to parse in application layer
- Can query JSON fields using SQL Server JSON functions if needed

## TypeScript Integration

### New Types

1. **LabReportEntity**: Type for lab report records
2. **InsuranceBenefitsEntity**: Type for insurance benefits records
3. **EOBRecordEntity**: Type for EOB records

### New Functions

**Lab Reports:**
- `createLabReport()`: Create a new lab report
- `getLabReportById()`: Get lab report by ID
- `listLabReportsByUser()`: Get all lab reports for a user
- `updateLabReport()`: Update a lab report
- `deleteLabReport()`: Delete a lab report

**Insurance Benefits:**
- `createInsuranceBenefits()`: Create new benefits record
- `getInsuranceBenefitsById()`: Get benefits by ID
- `getInsuranceBenefitsByUser()`: Get all benefits for a user
- `getInsuranceBenefitsByPrecheckcoverId()`: Get benefits by precheckcover_id
- `updateInsuranceBenefits()`: Update benefits record
- `upsertInsuranceBenefits()`: Insert or update benefits (prevents duplicates)

**EOB Records:**
- `createEOBRecord()`: Create new EOB record
- `getEOBRecordById()`: Get EOB by ID
- `getEOBRecordByClaimNumber()`: Get EOB by claim number and user
- `listEOBRecordsByUser()`: Get all EOB records for a user
- `updateEOBRecord()`: Update EOB record
- `upsertEOBRecord()`: Insert or update EOB (prevents duplicates)
- `deleteEOBRecord()`: Delete EOB record

## Migration Guide

### Step 1: Run the Schema
Execute `database/schema.sql` on your SQL Server database to create all tables and constraints.

### Step 2: Migrate Existing Data
Use the migration helper functions in `database/migration-helper.ts` to migrate existing JSON data to SQL Server.

### Step 3: Update Application Code
Update your application code to use the new TypeScript functions instead of direct database queries.

## Example Usage

### Creating a Lab Report
```typescript
import { createLabReport } from '@/lib/azure/sql-storage';

await createLabReport({
  id: 'lab-123',
  userId: 'user@example.com',
  title: 'Blood Test Results',
  date: '2025-01-15',
  hospital: 'General Hospital',
  fileUrl: 'https://storage.../lab-report.pdf',
  rawExtract: JSON.stringify({ /* extracted data */ }),
  parameters: JSON.stringify({ /* lab parameters */ })
});
```

### Creating Insurance Benefits
```typescript
import { upsertInsuranceBenefits } from '@/lib/azure/sql-storage';

await upsertInsuranceBenefits({
  precheckcover_id: 'precheck-123',
  user_id: 'user@example.com',
  plan_name: 'Cornell University Student Health Plan',
  plan_type: 'PPO',
  insurance_provider: 'Aetna',
  policy_number: '500499-912071-9006387',
  deductibles: JSON.stringify([{ amount: 50, type: 'individual' }]),
  copays: JSON.stringify([{ amount: 25, service_type: 'primary_care' }]),
  // ... other fields
});
```

### Creating EOB Record
```typescript
import { upsertEOBRecord } from '@/lib/azure/sql-storage';

await upsertEOBRecord({
  user_id: 'user@example.com',
  claim_number: 'CLM3750131',
  member_name: 'John Doe',
  provider_name: 'General Hospital',
  total_billed: 8128.00,
  total_benefits_approved: 5462.78,
  amount_you_owe: 2665.22,
  services: JSON.stringify([{ service_description: 'MRI Scan' }]),
  alerts: JSON.stringify(['High amount'])
});
```

## Best Practices

1. **Use Upsert Functions**: Always use `upsertInsuranceBenefits()` and `upsertEOBRecord()` to prevent duplicate records
2. **Parse JSON in Application**: Parse JSON strings in the application layer, not in SQL
3. **Handle Foreign Keys**: Always ensure referenced records exist before creating dependent records
4. **Use Transactions**: Wrap related operations in transactions for data consistency
5. **Index Queries**: Use indexed fields (userId, dates, claim numbers) in WHERE clauses for performance

## Next Steps

1. ✅ Run the schema.sql file on your database
2. ✅ Test the new tables and functions
3. ✅ Migrate existing data using migration helper
4. ✅ Update application code to use new functions
5. ✅ Add API endpoints for benefits and EOB operations
6. ✅ Update frontend to display benefits and EOB data

## Files Created/Modified

1. **database/schema.sql**: Complete SQL Server schema with all tables and constraints
2. **lib/azure/sql-storage.ts**: Added new types and functions for lab reports, benefits, and EOB
3. **database/DATA-MODEL.md**: Comprehensive data model documentation
4. **database/migration-helper.ts**: Helper functions for migrating JSON data to SQL Server
5. **database/SCHEMA-IMPROVEMENTS.md**: This file - summary of improvements

## Questions or Issues?

If you encounter any issues or have questions about the schema, please refer to:
- `database/DATA-MODEL.md` for detailed table descriptions
- `database/schema.sql` for the complete schema definition
- `lib/azure/sql-storage.ts` for TypeScript function implementations

