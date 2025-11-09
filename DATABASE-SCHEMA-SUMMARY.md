# Database Schema Summary
## K2Database - Azure SQL Database

**Last Updated:** November 9, 2025  
**Total Tables:** 6

---

## Table Overview

| Table Name | Row Count | Primary Key | Description |
|------------|-----------|-------------|-------------|
| `doctorInformation_table` | 27 | `id` | Doctor/provider information for scheduling |
| `insurer_table` | 8 | `unique_id` | Insurance company information |
| `provider_table` | 8 | `provider_id` | Healthcare provider information |
| `user_table` | 6 | `emailAddress` | User/patient information and profiles |
| `user_table_backup` | 1 | `email` | Backup table (legacy schema) |
| `userAppointmentScheduled_table` | 5 | `appointment_id` | Scheduled appointments |

---

## 1. doctorInformation_table

**Purpose:** Stores doctor/provider information for the scheduling feature

**Row Count:** 27

**Columns:**
- `id` (nvarchar(255), PK) - Doctor ID
- `name` (nvarchar(255)) - Doctor name
- `specialty` (nvarchar(255)) - Medical specialty
- `address` (nvarchar(500)) - Office address
- `distance` (nvarchar(50), NULL) - Distance from user
- `travelTime` (nvarchar(50), NULL) - Travel time
- `languages` (nvarchar(MAX)) - Languages spoken (JSON array)
- `telehealth` (bit) - Telehealth availability
- `inNetwork` (bit) - In-network status
- `rating` (float, NULL) - Doctor rating
- `image` (nvarchar(500), NULL) - Profile image URL
- `slots` (nvarchar(MAX)) - Available time slots (JSON array)
- `reasons` (nvarchar(MAX)) - Reasons to choose this doctor (JSON array)
- `estimatedCost` (float, NULL) - Estimated appointment cost
- `createdAt` (datetime2) - Creation timestamp
- `updatedAt` (datetime2) - Last update timestamp

**Indexes:**
- Primary Key: `id` (UNIQUE CLUSTERED)

**Sample Data:**
- 27 doctors with various specialties
- Includes Internal Medicine, Pediatrics, Dermatology, Cardiology, etc.
- Each doctor has availability slots stored as JSON

---

## 2. insurer_table

**Purpose:** Stores insurance company information

**Row Count:** 8

**Columns:**
- `unique_id` (nvarchar(255), PK) - Unique insurer ID
- `precheckcover_id` (nvarchar(255)) - Precheck cover ID
- `created_at` (datetime2) - Creation timestamp
- `updated_at` (datetime2) - Last update timestamp

**Indexes:**
- Primary Key: `unique_id` (UNIQUE CLUSTERED)

**Relationships:**
- Referenced by: `user_table.insurerId` (Foreign Key)

---

## 3. provider_table

**Purpose:** Stores healthcare provider/facility information

**Row Count:** 8

**Columns:**
- `provider_id` (nvarchar(255), PK) - Provider ID
- `name` (nvarchar(255), NULL) - Provider name
- `specialty` (nvarchar(255), NULL) - Medical specialty
- `address` (nvarchar(500), NULL) - Provider address
- `phone` (nvarchar(50), NULL) - Phone number
- `email` (nvarchar(255), NULL) - Email address
- `created_at` (datetime2) - Creation timestamp
- `updated_at` (datetime2) - Last update timestamp

**Indexes:**
- Primary Key: `provider_id` (UNIQUE CLUSTERED)

**Relationships:**
- Referenced by: `user_table.providerId` (Foreign Key)

---

## 4. user_table

**Purpose:** Stores user/patient information and profiles

**Row Count:** 6

**Columns:**
- `emailAddress` (nvarchar(255), PK) - User email (primary key)
- `FirstName` (nvarchar(100)) - First name
- `LastName` (nvarchar(100)) - Last name
- `DateOfBirth` (date) - Date of birth
- `StreetAddress` (nvarchar(500)) - Street address
- `PatientCity` (nvarchar(100)) - City
- `PatientState` (nvarchar(100)) - State
- `providerId` (nvarchar(255), NULL) - Foreign key to provider_table
- `insurerId` (nvarchar(255), NULL) - Foreign key to insurer_table
- `InsuranceGroupNumber` (nvarchar(255), NULL) - Insurance group number
- `InsurancePlanType` (nvarchar(50)) - Insurance plan type (HMO, PPO, etc.)
- `InsuranceCompanyStreetAddress` (nvarchar(500), NULL) - Insurance company address
- `InsuranceCompanyCity` (nvarchar(100), NULL) - Insurance company city
- `InsuranceCompanyState` (nvarchar(100), NULL) - Insurance company state
- `InsuranceCompanyPhoneNumber` (nvarchar(50), NULL) - Insurance company phone
- `documents` (nvarchar(MAX), NULL) - Documents stored as JSON
- `created_at` (datetime2) - Creation timestamp
- `updated_at` (datetime2) - Last update timestamp
- `userRole` (nvarchar(20), NULL) - User role (patient/doctor)
- `PhoneNumber` (nvarchar(50), NULL) - User phone number
- `InsuranceCompanyName` (nvarchar(255), NULL) - Insurance company name
- `InsuranceAccountNumber` (nvarchar(255), NULL) - Insurance account number

**Indexes:**
- Primary Key: `emailAddress` (UNIQUE CLUSTERED)
- Index: `IX_user_table_insurerId` (NONCLUSTERED)
- Index: `IX_user_table_providerId` (NONCLUSTERED)

**Foreign Keys:**
- `FK__user_tabl__insur__03F0984C`: `insurerId` -> `insurer_table.unique_id`
- `FK__user_tabl__provi__02FC7413`: `providerId` -> `provider_table.provider_id`

**Relationships:**
- Referenced by: `userAppointmentScheduled_table.userEmailAddress` (Foreign Key)

**Sample Users:**
- 6 users registered
- Mix of patients and doctors (based on `userRole`)
- Some users have complete profile information, others have minimal data

---

## 5. user_table_backup

**Purpose:** Legacy backup table (old schema)

**Row Count:** 1

**Columns:** (25 columns - different schema from current `user_table`)
- Legacy schema with different column names
- Contains 1 test user record

**Note:** This appears to be a backup/legacy table and may not be actively used.

---

## 6. userAppointmentScheduled_table

**Purpose:** Stores scheduled appointments between users and doctors

**Row Count:** 5

**Columns:**
- `appointment_id` (nvarchar(255), PK) - Unique appointment ID
- `userEmailAddress` (nvarchar(255)) - Foreign key to user_table
- `doctorId` (nvarchar(255)) - Foreign key to doctorInformation_table
- `appointmentDate` (datetime2) - Appointment date and time
- `appointmentTime` (nvarchar(50), NULL) - Appointment time (formatted)
- `appointmentType` (nvarchar(50)) - Type: "in-person" or "telehealth"
- `status` (nvarchar(50)) - Status: "scheduled", "confirmed", "cancelled", etc.
- `confirmationCode` (nvarchar(100), NULL) - Confirmation code
- `notes` (nvarchar(MAX), NULL) - Appointment notes
- `estimatedCost` (float, NULL) - Estimated cost
- `createdAt` (datetime2) - Creation timestamp
- `updatedAt` (datetime2) - Last update timestamp

**Indexes:**
- Primary Key: `appointment_id` (UNIQUE CLUSTERED)
- Index: `IX_appointment_date` (NONCLUSTERED) - On `appointmentDate`
- Index: `IX_appointment_doctorId` (NONCLUSTERED) - On `doctorId`
- Index: `IX_appointment_status` (NONCLUSTERED) - On `status`
- Index: `IX_appointment_userEmailAddress` (NONCLUSTERED) - On `userEmailAddress`

**Foreign Keys:**
- `FK__userAppoi__docto__151B244E`: `doctorId` -> `doctorInformation_table.id`
- `FK__userAppoi__userE__14270015`: `userEmailAddress` -> `user_table.emailAddress`

**Appointment Statistics:**
- Total: 5 appointments
- All status: "scheduled"
- Doctors: 2 doctors (ID "1" has 4, ID "12" has 1)
- Users: 2 users (`as4424@cornell.edu` has 4, `aishaikh@umass.edu` has 1)
- Dates: November 15-16, 2025
- Types: Mix of in-person and telehealth

---

## Database Relationships

```
user_table
  ├── providerId → provider_table.provider_id
  ├── insurerId → insurer_table.unique_id
  └── emailAddress ← userAppointmentScheduled_table.userEmailAddress

userAppointmentScheduled_table
  ├── userEmailAddress → user_table.emailAddress
  └── doctorId → doctorInformation_table.id

doctorInformation_table
  └── id ← userAppointmentScheduled_table.doctorId
```

---

## Key Features

### 1. User Management
- User profiles stored in `user_table`
- Support for patient and doctor roles
- Insurance information linked to users
- Document storage as JSON

### 2. Scheduling System
- 27 doctors available for scheduling
- 5 appointments currently scheduled
- Support for in-person and telehealth appointments
- Appointment tracking with confirmation codes

### 3. Insurance Management
- Insurance companies stored in `insurer_table`
- User insurance information in `user_table`
- Provider information in `provider_table`

### 4. Data Integrity
- Foreign key constraints ensure data consistency
- Indexes on frequently queried columns
- Timestamps for audit trail (created_at, updated_at)

---

## Notes

1. **doctorInformation_table** has 27 doctors (more than the expected 20), which is good for the scheduler feature.

2. **userAppointmentScheduled_table** has 5 appointments, all with status "scheduled". The scheduler should display these and mark corresponding time slots as unavailable.

3. **user_table** has 6 users, with some having complete profiles and others having minimal placeholder data.

4. **Foreign Key Relationships** are properly set up, ensuring referential integrity between appointments, users, and doctors.

5. **Indexes** are created on commonly queried fields (dates, status, foreign keys) for better query performance.

---

## Recommendations

1. Consider adding indexes on `doctorInformation_table.specialty` if filtering by specialty is common.

2. The `user_table_backup` table appears to be legacy and could potentially be removed if no longer needed.

3. Consider adding a `LabReport` table if lab reports are stored separately from user documents.

4. Monitor appointment table growth and consider archiving old appointments.

5. Consider adding appointment cancellation tracking and history.

---

*Generated automatically from database schema analysis*

