# CarePilot Database Schema

**Database:** Azure SQL Database  
**Server:** k2sqldatabaseserver.database.windows.net  
**Database Name:** K2Database

---

## Table Overview

1. **insurer_table** - Insurance company information
2. **provider_table** - Healthcare provider information
3. **user_table** - Patient/user information
4. **doctorInformation_table** - Doctor/provider details for scheduling
5. **userAppointmentScheduled_table** - Appointment bookings

---

## 1. insurer_table

**Primary Key:** `unique_id`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `unique_id` | NVARCHAR(255) | PRIMARY KEY, NOT NULL | Unique identifier for insurer |
| `precheckcover_id` | NVARCHAR(255) | NOT NULL | Pre-check coverage identifier |
| `created_at` | DATETIME2 | DEFAULT GETUTCDATE() | Record creation timestamp |
| `updated_at` | DATETIME2 | DEFAULT GETUTCDATE() | Record update timestamp |

**Relationships:**
- Referenced by: `user_table.insurerId` (Foreign Key)

---

## 2. provider_table

**Primary Key:** `provider_id`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `provider_id` | NVARCHAR(255) | PRIMARY KEY, NOT NULL | Unique identifier for provider |
| `name` | NVARCHAR(255) | NULL | Provider name |
| `specialty` | NVARCHAR(255) | NULL | Medical specialty |
| `address` | NVARCHAR(500) | NULL | Provider address |
| `phone` | NVARCHAR(50) | NULL | Phone number |
| `email` | NVARCHAR(255) | NULL | Email address |
| `created_at` | DATETIME2 | DEFAULT GETUTCDATE() | Record creation timestamp |
| `updated_at` | DATETIME2 | DEFAULT GETUTCDATE() | Record update timestamp |

**Relationships:**
- Referenced by: `user_table.providerId` (Foreign Key)

---

## 3. user_table

**Primary Key:** `emailAddress`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `emailAddress` | NVARCHAR(255) | PRIMARY KEY, NOT NULL | User email address (unique identifier) |
| `FirstName` | NVARCHAR(100) | NOT NULL | First name |
| `LastName` | NVARCHAR(100) | NOT NULL | Last name |
| `DateOfBirth` | DATE | NOT NULL | Date of birth |
| `StreetAddress` | NVARCHAR(500) | NOT NULL | Street address |
| `PatientCity` | NVARCHAR(100) | NOT NULL | City |
| `PatientState` | NVARCHAR(100) | NOT NULL | State |
| `providerId` | NVARCHAR(255) | NULL | Foreign key to provider_table |
| `insurerId` | NVARCHAR(255) | NULL | Foreign key to insurer_table (references unique_id) |
| `InsuranceGroupNumber` | NVARCHAR(255) | NULL | Insurance group number |
| `InsurancePlanType` | NVARCHAR(50) | NOT NULL, CHECK | Plan type (HMO, PPO, EPO, POS, HDHP, Other) |
| `InsuranceCompanyStreetAddress` | NVARCHAR(500) | NULL | Insurance company street address |
| `InsuranceCompanyCity` | NVARCHAR(100) | NULL | Insurance company city |
| `InsuranceCompanyState` | NVARCHAR(100) | NULL | Insurance company state |
| `InsuranceCompanyPhoneNumber` | NVARCHAR(50) | NULL | Insurance company phone number |
| `documents` | NVARCHAR(MAX) | NULL | JSON string of documents array |
| `created_at` | DATETIME2 | DEFAULT GETUTCDATE() | Record creation timestamp |
| `updated_at` | DATETIME2 | DEFAULT GETUTCDATE() | Record update timestamp |

**Foreign Keys:**
- `providerId` → `provider_table.provider_id`
- `insurerId` → `insurer_table.unique_id`

**Indexes:**
- `IX_user_table_providerId` on `providerId`
- `IX_user_table_insurerId` on `insurerId`

**Check Constraints:**
- `InsurancePlanType` must be one of: 'HMO', 'PPO', 'EPO', 'POS', 'HDHP', 'Other'

**Notes:**
- `documents` stores JSON array: `[{doc_type: string, doc_name: string, ...}]`

---

## 4. doctorInformation_table

**Primary Key:** `id`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `id` | NVARCHAR(255) | PRIMARY KEY, NOT NULL | Unique identifier for doctor |
| `name` | NVARCHAR(255) | NOT NULL | Doctor name |
| `specialty` | NVARCHAR(255) | NOT NULL | Medical specialty |
| `address` | NVARCHAR(500) | NOT NULL | Office address |
| `distance` | NVARCHAR(50) | NULL | Distance from user (e.g., "2.3 miles") |
| `travelTime` | NVARCHAR(50) | NULL | Travel time (e.g., "12 min drive") |
| `languages` | NVARCHAR(MAX) | NOT NULL, DEFAULT '[]' | JSON array of languages spoken |
| `telehealth` | BIT | NOT NULL, DEFAULT 0 | Telehealth availability (0/1) |
| `inNetwork` | BIT | NOT NULL, DEFAULT 0 | In-network status (0/1) |
| `rating` | FLOAT | NULL | Doctor rating (e.g., 4.8) |
| `image` | NVARCHAR(500) | NULL | Profile image URL |
| `slots` | NVARCHAR(MAX) | NOT NULL, DEFAULT '[]' | JSON array of available appointment slots |
| `reasons` | NVARCHAR(MAX) | NOT NULL, DEFAULT '[]' | JSON array of recommendation reasons |
| `estimatedCost` | FLOAT | NULL | Estimated appointment cost |
| `createdAt` | DATETIME2 | DEFAULT GETUTCDATE() | Record creation timestamp |
| `updatedAt` | DATETIME2 | DEFAULT GETUTCDATE() | Record update timestamp |

**Relationships:**
- Referenced by: `userAppointmentScheduled_table.doctorId` (Foreign Key)

**Notes:**
- `languages` stores JSON array: `["English", "Spanish", ...]`
- `slots` stores JSON array: `[{id: string, date: string, time: string, available: boolean, mode: string}, ...]`
- `reasons` stores JSON array: `["In-network", "Closest location", ...]`

---

## 5. userAppointmentScheduled_table

**Primary Key:** `appointment_id`

| Column Name | Data Type | Constraints | Description |
|-------------|-----------|-------------|-------------|
| `appointment_id` | NVARCHAR(255) | PRIMARY KEY, NOT NULL | Unique appointment identifier |
| `userEmailAddress` | NVARCHAR(255) | NOT NULL | Foreign key to user_table |
| `doctorId` | NVARCHAR(255) | NOT NULL | Foreign key to doctorInformation_table |
| `appointmentDate` | DATETIME2 | NOT NULL | Appointment date and time |
| `appointmentTime` | NVARCHAR(50) | NULL | Appointment time string (e.g., "9:30 AM") |
| `appointmentType` | NVARCHAR(50) | NOT NULL, CHECK | Type: 'in-person' or 'telehealth' |
| `status` | NVARCHAR(50) | NOT NULL, DEFAULT 'scheduled', CHECK | Status: 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show' |
| `confirmationCode` | NVARCHAR(100) | NULL | Appointment confirmation code |
| `notes` | NVARCHAR(MAX) | NULL | Additional notes |
| `estimatedCost` | FLOAT | NULL | Estimated cost |
| `createdAt` | DATETIME2 | DEFAULT GETUTCDATE() | Record creation timestamp |
| `updatedAt` | DATETIME2 | DEFAULT GETUTCDATE() | Record update timestamp |

**Foreign Keys:**
- `userEmailAddress` → `user_table.emailAddress`
- `doctorId` → `doctorInformation_table.id`

**Indexes:**
- `IX_appointment_userEmailAddress` on `userEmailAddress`
- `IX_appointment_doctorId` on `doctorId`
- `IX_appointment_date` on `appointmentDate`
- `IX_appointment_status` on `status`

**Check Constraints:**
- `appointmentType` must be one of: 'in-person', 'telehealth'
- `status` must be one of: 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│  insurer_table  │
│─────────────────│
│ unique_id (PK)  │
│ precheckcover_id│
└────────┬────────┘
         │
         │ (1:N)
         │
┌────────▼─────────────────┐
│      user_table          │
│──────────────────────────│
│ emailAddress (PK)        │
│ FirstName                │
│ LastName                 │
│ DateOfBirth              │
│ StreetAddress            │
│ PatientCity              │
│ PatientState             │
│ providerId (FK)          │──┐
│ insurerId (FK) ──────────┼──┤
│ InsuranceGroupNumber     │  │
│ InsurancePlanType        │  │
│ InsuranceCompanyStreet...│  │
│ InsuranceCompanyCity     │  │
│ InsuranceCompanyState    │  │
│ InsuranceCompanyPhone... │  │
│ documents (JSON)         │  │
└──────────────────────────┘  │
         │                    │
         │ (1:N)              │
         │                    │
┌────────▼─────────────────┐  │
│ userAppointmentScheduled │  │
│       _table             │  │
│──────────────────────────│  │
│ appointment_id (PK)      │  │
│ userEmailAddress (FK) ───┼──┘
│ doctorId (FK)            │──┐
│ appointmentDate          │  │
│ appointmentTime          │  │
│ appointmentType          │  │
│ status                   │  │
│ confirmationCode         │  │
│ notes                    │  │
│ estimatedCost            │  │
└──────────────────────────┘  │
                              │
                              │ (N:1)
                              │
         ┌────────────────────┘
         │
┌────────▼───────────────────┐
│  doctorInformation_table   │
│────────────────────────────│
│ id (PK)                    │
│ name                       │
│ specialty                  │
│ address                    │
│ distance                   │
│ travelTime                 │
│ languages (JSON)           │
│ telehealth                 │
│ inNetwork                  │
│ rating                     │
│ image                      │
│ slots (JSON)               │
│ reasons (JSON)             │
│ estimatedCost              │
└────────────────────────────┘

┌─────────────────┐
│ provider_table  │
│─────────────────│
│ provider_id (PK)│
│ name            │
│ specialty       │
│ address         │
│ phone           │
│ email           │
└────────┬────────┘
         │
         │ (1:N)
         │
         └─────────► Referenced by user_table.providerId
```

---

## Indexes Summary

### user_table
- `IX_user_table_providerId` - Index on `providerId`
- `IX_user_table_insurerId` - Index on `insurerId`

### userAppointmentScheduled_table
- `IX_appointment_userEmailAddress` - Index on `userEmailAddress`
- `IX_appointment_doctorId` - Index on `doctorId`
- `IX_appointment_date` - Index on `appointmentDate`
- `IX_appointment_status` - Index on `status`

---

## JSON Field Structures

### user_table.documents
```json
[
  {
    "doc_type": "lab_report",
    "doc_name": "blood_test_2024.pdf",
    "doc_url": "https://...",
    "doc_size": 1024,
    "uploaded_at": "2024-11-08T18:00:00Z"
  }
]
```

### doctorInformation_table.languages
```json
["English", "Spanish", "Chinese"]
```

### doctorInformation_table.slots
```json
[
  {
    "id": "1-1",
    "date": "Tue, Nov 12",
    "time": "9:30 AM",
    "available": true,
    "mode": "telehealth"
  }
]
```

### doctorInformation_table.reasons
```json
[
  "In-network with your plan",
  "Closest to your location",
  "Spanish-speaking provider"
]
```

---

## Data Types Reference

| SQL Type | Description | Example |
|----------|-------------|---------|
| `NVARCHAR(n)` | Variable-length Unicode string (max n characters) | `NVARCHAR(255)` |
| `NVARCHAR(MAX)` | Variable-length Unicode string (unlimited) | `NVARCHAR(MAX)` |
| `DATE` | Date only (no time) | `2024-11-08` |
| `DATETIME2` | Date and time | `2024-11-08 18:00:00` |
| `BIT` | Boolean (0 or 1) | `0`, `1` |
| `FLOAT` | Floating-point number | `4.8`, `45.0` |

---

## Constraints Summary

### Check Constraints
- `user_table.InsurancePlanType`: Must be 'HMO', 'PPO', 'EPO', 'POS', 'HDHP', or 'Other'
- `userAppointmentScheduled_table.appointmentType`: Must be 'in-person' or 'telehealth'
- `userAppointmentScheduled_table.status`: Must be 'scheduled', 'completed', 'cancelled', 'rescheduled', or 'no_show'

### Foreign Key Constraints
- `user_table.providerId` → `provider_table.provider_id`
- `user_table.insurerId` → `insurer_table.unique_id`
- `userAppointmentScheduled_table.userEmailAddress` → `user_table.emailAddress`
- `userAppointmentScheduled_table.doctorId` → `doctorInformation_table.id`

---

## Default Values

- All timestamp fields (`created_at`, `updated_at`, `createdAt`, `updatedAt`) default to `GETUTCDATE()`
- `doctorInformation_table.languages` defaults to `'[]'`
- `doctorInformation_table.slots` defaults to `'[]'`
- `doctorInformation_table.reasons` defaults to `'[]'`
- `doctorInformation_table.telehealth` defaults to `0` (false)
- `doctorInformation_table.inNetwork` defaults to `0` (false)
- `userAppointmentScheduled_table.status` defaults to `'scheduled'`

---

## Notes

1. **Email as Primary Key**: `user_table` uses `emailAddress` as the primary key for user identification.

2. **JSON Storage**: Several fields store JSON data as `NVARCHAR(MAX)`:
   - `user_table.documents` - Document metadata
   - `doctorInformation_table.languages` - Array of languages
   - `doctorInformation_table.slots` - Available appointment slots
   - `doctorInformation_table.reasons` - Recommendation reasons

3. **Foreign Key Relationships**: 
   - `insurer_table.unique_id` is referenced as `user_table.insurerId`
   - `provider_table.provider_id` is referenced as `user_table.providerId`
   - Both `user_table` and `doctorInformation_table` can be referenced independently

4. **Appointment Booking**: Appointments link users to doctors through:
   - `userEmailAddress` (from `user_table`)
   - `doctorId` (from `doctorInformation_table`)

---

**Last Updated:** November 8, 2024

