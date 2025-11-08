# CarePilot Database Data Model Documentation

## Overview

This document describes the improved database schema for CarePilot, including all tables, relationships, and key improvements.

## Database: SQL Server (Azure SQL)

## Schema Improvements

### 1. **Foreign Key Relationships**
- ✅ `user_table.providerId` → `provider_table.provider_id` (FK)
- ✅ `user_table.insurerId` → `insurer_table.unique_id` (FK)
- ✅ `userAppointmentScheduled_table.userEmailAddress` → `user_table.emailAddress` (FK)
- ✅ `userAppointmentScheduled_table.doctorId` → `doctorInformation_table.id` (FK)
- ✅ `LabReport.userId` → `user_table.emailAddress` (FK)
- ✅ `insurance_benefits.user_id` → `user_table.emailAddress` (FK)
- ✅ `eob_records.user_id` → `user_table.emailAddress` (FK)

### 2. **New Tables**

#### LabReport Table
- **Purpose**: Store lab report metadata and structured data
- **Key Features**:
  - Multiple lab reports per user (one-to-many relationship)
  - Stores file URL, raw extract, and parameters as JSON
  - Linked to user via `userId` foreign key

#### insurance_benefits Table
- **Purpose**: Store detailed insurance benefits information
- **Key Features**:
  - Includes `precheckcover_id` as requested
  - Stores complex nested data (deductibles, copays, coinsurance, services) as JSON strings
  - Unique constraint on `(plan_name, policy_number, user_id)`
  - Linked to user via `user_id` foreign key
  - Supports multiple benefit records per user

#### eob_records Table
- **Purpose**: Store Explanation of Benefits (EOB) records
- **Key Features**:
  - Stores claim information, services, and coverage breakdown
  - Unique constraint on `(claim_number, user_id)`
  - Linked to user via `user_id` foreign key
  - Supports multiple EOB records per user

## Table Descriptions

### 1. insurer_table
Stores insurance provider information.

**Columns:**
- `unique_id` (PK): Primary key
- `precheckcover_id`: Unique identifier for benefits coverage
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships:**
- One-to-many with `user_table` (via `insurerId`)

### 2. provider_table
Stores healthcare provider information (clinics, hospitals, etc.).

**Columns:**
- `provider_id` (PK): Primary key
- `name`: Provider name
- `specialty`: Provider specialty
- `address`: Provider address
- `phone`: Phone number
- `email`: Email address
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships:**
- One-to-many with `user_table` (via `providerId`)

### 3. user_table
Stores user (patient) information.

**Columns:**
- `emailAddress` (PK): Primary key
- `FirstName`: First name
- `LastName`: Last name
- `DateOfBirth`: Date of birth
- `StreetAddress`: Street address
- `PatientCity`: City
- `PatientState`: State
- `providerId` (FK): Foreign key to `provider_table`
- `insurerId` (FK): Foreign key to `insurer_table`
- `InsuranceGroupNumber`: Insurance group number
- `InsurancePlanType`: Plan type (HMO, PPO, etc.)
- `InsuranceCompanyStreetAddress`: Insurance company address
- `InsuranceCompanyCity`: Insurance company city
- `InsuranceCompanyState`: Insurance company state
- `InsuranceCompanyPhoneNumber`: Insurance company phone
- `documents`: JSON string for documents
- `userRole`: User role (patient, doctor)
- `password_hash`: Hashed password (bcrypt) - nullable, optional for OAuth users
- `oauth_provider`: OAuth provider name (google, facebook, auth0, microsoft, etc.) - nullable
- `oauth_provider_id`: User ID from OAuth provider - nullable
- `oauth_email`: Email from OAuth provider - nullable
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Relationships:**
- Many-to-one with `provider_table` (via `providerId`)
- Many-to-one with `insurer_table` (via `insurerId`)
- One-to-many with `userAppointmentScheduled_table`
- One-to-many with `LabReport`
- One-to-many with `insurance_benefits`
- One-to-many with `eob_records`

### 4. doctorInformation_table
Stores doctor/physician information.

**Columns:**
- `id` (PK): Primary key
- `name`: Doctor name
- `specialty`: Specialty
- `address`: Address
- `distance`: Distance
- `travelTime`: Travel time
- `languages`: JSON string (array of languages)
- `telehealth`: Boolean
- `inNetwork`: Boolean
- `rating`: Rating
- `image`: Image URL
- `slots`: JSON string (appointment slots)
- `reasons`: JSON string (visit reasons)
- `estimatedCost`: Estimated cost
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**
- One-to-many with `userAppointmentScheduled_table`

### 5. userAppointmentScheduled_table
Stores user appointments with doctors.

**Columns:**
- `appointment_id` (PK): Primary key
- `userEmailAddress` (FK): Foreign key to `user_table`
- `doctorId` (FK): Foreign key to `doctorInformation_table`
- `appointmentDate`: Appointment date
- `appointmentTime`: Appointment time
- `appointmentType`: Type (in-person, telehealth)
- `status`: Status (scheduled, confirmed, completed, etc.)
- `confirmationCode`: Confirmation code
- `notes`: Notes
- `estimatedCost`: Estimated cost
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**
- Many-to-one with `user_table`
- Many-to-one with `doctorInformation_table`

### 6. LabReport
Stores lab report metadata and structured data.

**Columns:**
- `id` (PK): Primary key
- `userId` (FK): Foreign key to `user_table.emailAddress`
- `title`: Report title
- `date`: Report date
- `hospital`: Hospital name
- `doctor`: Doctor name
- `fileUrl`: File URL
- `rawExtract`: JSON string (raw extracted data)
- `parameters`: JSON string (lab parameters)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

**Relationships:**
- Many-to-one with `user_table`

### 7. insurance_benefits
Stores detailed insurance benefits information.

**Columns:**
- `id` (PK): Auto-increment primary key
- `precheckcover_id`: Unique identifier for benefits coverage
- `user_id` (FK): Foreign key to `user_table.emailAddress`
- `plan_name`: Plan name
- `plan_type`: Plan type (HMO, PPO, etc.)
- `insurance_provider`: Insurance provider name
- `policy_number`: Policy number
- `group_number`: Group number
- `effective_date`: Effective date
- `expiration_date`: Expiration date
- `deductibles`: JSON string (array of deductibles)
- `copays`: JSON string (array of copays)
- `coinsurance`: JSON string (array of coinsurance)
- `coverage_limits`: JSON string (array of coverage limits)
- `services`: JSON string (array of services)
- `out_of_pocket_max_individual`: Out of pocket max (individual)
- `out_of_pocket_max_family`: Out of pocket max (family)
- `in_network_providers`: In-network providers information
- `out_of_network_coverage`: Boolean
- `network_notes`: Network notes
- `preauth_required_services`: JSON string (array of services)
- `preauth_notes`: Pre-authorization notes
- `exclusions`: JSON string (array of exclusions)
- `exclusion_notes`: Exclusion notes
- `special_programs`: JSON string (array of programs)
- `additional_benefits`: Additional benefits text
- `notes`: General notes
- `extracted_date`: Extraction timestamp
- `source_document_id`: Source document ID
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Unique Constraint:**
- `(plan_name, policy_number, user_id)` - One benefit record per plan/policy/user combination

**Relationships:**
- Many-to-one with `user_table`

### 8. eob_records
Stores Explanation of Benefits (EOB) records.

**Columns:**
- `id` (PK): Auto-increment primary key
- `user_id` (FK): Foreign key to `user_table.emailAddress`
- `claim_number`: Claim number
- `member_name`: Member name
- `member_address`: Member address
- `member_id`: Member ID
- `group_number`: Group number
- `claim_date`: Claim date
- `provider_name`: Provider name
- `provider_npi`: Provider NPI
- `total_billed`: Total billed amount
- `total_benefits_approved`: Total benefits approved
- `amount_you_owe`: Amount you owe
- `services`: JSON string (array of services)
- `coverage_breakdown`: JSON string (coverage breakdown)
- `insurance_provider`: Insurance provider
- `plan_name`: Plan name
- `policy_number`: Policy number
- `alerts`: JSON string (array of alerts)
- `discrepancies`: JSON string (array of discrepancies)
- `source_document_id`: Source document ID
- `extracted_date`: Extraction timestamp
- `created_at`: Timestamp
- `updated_at`: Timestamp

**Unique Constraint:**
- `(claim_number, user_id)` - One EOB record per claim per user

**Relationships:**
- Many-to-one with `user_table`

## Key Features

### 1. **Data Integrity**
- All foreign key constraints are properly defined
- Cascade delete/update rules are set appropriately
- Unique constraints prevent duplicate records

### 2. **JSON Storage**
- Complex nested data (deductibles, copays, services, etc.) stored as JSON strings
- Allows flexibility while maintaining queryability
- Can be parsed in application layer as needed

### 3. **Indexing**
- Indexes on foreign keys for performance
- Indexes on frequently queried fields (dates, names, etc.)
- Composite indexes where appropriate

### 4. **Timestamps**
- Automatic `created_at` and `updated_at` timestamps
- Triggers automatically update `updated_at` on row updates
- UTC timestamps for consistency

### 5. **Scalability**
- Supports multiple lab reports per user
- Supports multiple benefit records per user
- Supports multiple EOB records per user
- Proper indexing for performance

## Usage Examples

### Create a Lab Report
```typescript
import { createLabReport } from '@/lib/azure/sql-storage';

await createLabReport({
  id: 'lab-123',
  userId: 'user@example.com',
  title: 'Blood Test Results',
  date: '2025-01-15',
  hospital: 'General Hospital',
  doctor: 'Dr. Smith',
  fileUrl: 'https://storage.../lab-report.pdf',
  rawExtract: JSON.stringify({ /* extracted data */ }),
  parameters: JSON.stringify({ /* lab parameters */ })
});
```

### Create Insurance Benefits
```typescript
import { upsertInsuranceBenefits } from '@/lib/azure/sql-storage';

await upsertInsuranceBenefits({
  precheckcover_id: 'precheck-123',
  user_id: 'user@example.com',
  plan_name: 'Cornell University Student Health Plan',
  plan_type: 'PPO',
  insurance_provider: 'Aetna',
  policy_number: '500499-912071-9006387',
  effective_date: '2025-07-01',
  expiration_date: '2026-06-30',
  deductibles: JSON.stringify([{ amount: 50, type: 'individual', ... }]),
  copays: JSON.stringify([{ amount: 25, service_type: 'primary_care', ... }]),
  // ... other fields
});
```

### Create EOB Record
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
  services: JSON.stringify([{ service_description: 'MRI Scan', ... }]),
  alerts: JSON.stringify(['High amount']),
  discrepancies: JSON.stringify(['Duplicate service'])
});
```

## Migration Guide

### Running the Schema

1. **Connect to your Azure SQL Database**
2. **Run the schema file:**
   ```sql
   -- Execute database/schema.sql
   ```

### Migration Steps

If you have existing tables:

1. **Backup your database**
2. **Add foreign key constraints** (if not already present)
3. **Create new tables** (LabReport, insurance_benefits, eob_records)
4. **Migrate existing data** to new tables if needed
5. **Test the application** with the new schema

### Adding Foreign Keys to Existing Tables

If your `user_table` doesn't have the foreign key to `provider_table`:

```sql
-- Add foreign key constraint
ALTER TABLE user_table
ADD CONSTRAINT FK_user_provider
FOREIGN KEY (providerId)
REFERENCES provider_table(provider_id)
ON DELETE SET NULL
ON UPDATE CASCADE;
```

## Best Practices

1. **Always use transactions** when creating related records
2. **Parse JSON strings** in the application layer, not in SQL
3. **Use upsert functions** to avoid duplicate records
4. **Index frequently queried fields** for performance
5. **Use prepared statements** to prevent SQL injection
6. **Handle foreign key constraints** gracefully in application code

## Future Improvements

1. **Add audit tables** for tracking changes
2. **Add soft deletes** for important records
3. **Add data validation** at the database level
4. **Add full-text search** for text fields
5. **Add partitioning** for large tables
6. **Add materialized views** for complex queries

