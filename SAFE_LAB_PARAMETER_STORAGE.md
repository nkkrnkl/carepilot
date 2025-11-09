# Safe Lab Parameter Storage for Dashboard Cards

## Overview

This document explains how lab parameter data (blood test values, units, reference ranges) is safely extracted, validated, and stored for display in dashboard cards.

## Safety Features

### 1. **Data Validation with Zod Schemas**
- All parameters are validated against strict schemas before storage
- Type safety: ensures `value` is number or string, `unit` is string, etc.
- Length limits: prevents buffer overflow attacks
  - Parameter names: max 200 chars
  - Values: max 50 chars for strings
  - Units: max 20 chars
  - Reference ranges: max 50 chars
  - Max 500 parameters per report

### 2. **Input Sanitization**
- Parameter names: Removes special characters, normalizes whitespace
- Values: Removes dangerous characters (`<`, `>`, `"`, `'`, `&`)
- Numeric validation: Checks reasonable medical value ranges (-1000 to 1,000,000)
- Date validation: ISO format (YYYY-MM-DD) only

### 3. **SQL Injection Prevention**
- Uses parameterized queries (SQL Server prepared statements)
- All user input is passed as parameters, never concatenated
- JSON data is stored as strings, parsed in application layer

### 4. **User Authorization**
- Reports are linked to `userId` via foreign key
- API routes verify user ownership before returning data
- Prevents unauthorized access to other users' lab data

### 5. **Error Handling**
- Parameter extraction failures don't break the upload
- Upload succeeds even if parameter extraction fails
- Errors are logged but don't expose sensitive information

## Data Flow

```
1. User uploads lab report PDF/image
   ↓
2. Extract text (Azure Computer Vision READ API)
   ↓
3. Extract parameters (LLM with validation)
   - Uses OpenAI/Azure OpenAI
   - Validates with Zod schema
   - Sanitizes all inputs
   ↓
4. Store in SQL Database
   - LabReport table
   - Parameters stored as JSON string
   - Linked to user via userId
   ↓
5. Retrieve for dashboard cards
   - API: GET /api/labs/reports?userId=...
   - Returns formatted data for UI
```

## Storage Structure

### SQL Database: `LabReport` Table

```sql
CREATE TABLE LabReport (
  id NVARCHAR(255) PRIMARY KEY,
  userId NVARCHAR(255) NOT NULL,  -- FK to user_table
  title NVARCHAR(200),
  date NVARCHAR(50),  -- ISO format: YYYY-MM-DD
  hospital NVARCHAR(200),
  doctor NVARCHAR(200),
  fileUrl NVARCHAR(MAX),
  rawExtract NVARCHAR(MAX),  -- JSON: raw extracted text
  parameters NVARCHAR(MAX),  -- JSON: validated parameters array
  createdAt DATETIME2 DEFAULT GETUTCDATE(),
  updatedAt DATETIME2 DEFAULT GETUTCDATE()
);
```

### Parameters JSON Structure

```json
[
  {
    "name": "Glucose",
    "value": 95,
    "unit": "mg/dL",
    "referenceRange": "70-100",
    "flag": null
  },
  {
    "name": "Creatinine",
    "value": 1.2,
    "unit": "mg/dL",
    "referenceRange": "0.6-1.2",
    "flag": "H"
  }
]
```

## API Endpoints

### Upload Lab Report
**POST** `/api/documents/upload`
- Form data: `file`, `userId`, `docType="lab_report"`, `docId`
- Automatically extracts parameters and stores in SQL
- Returns: `{ success, docId, labExtract: { parameters, metadata } }`

### List Lab Reports
**GET** `/api/labs/reports?userId=...`
- Returns all lab reports for a user
- Parameters formatted for dashboard cards
- Returns: `{ success, reports: [...], count }`

### Get Single Report
**GET** `/api/labs/reports?id=...&userId=...`
- Returns single lab report with parameters
- Verifies user ownership (security)
- Returns: `{ success, report: {...} }`

## Dashboard Card Format

The API returns parameters in a format ready for dashboard cards:

```typescript
{
  id: "lab-123",
  title: "Complete Blood Count",
  date: "2025-01-15",
  hospital: "General Hospital",
  doctor: "Dr. Smith",
  parameters: {
    "Glucose": {
      value: 95,
      unit: "mg/dL",
      referenceRange: "70-100",
      flag: null
    },
    "Creatinine": {
      value: 1.2,
      unit: "mg/dL",
      referenceRange: "0.6-1.2",
      flag: "H"
    }
  }
}
```

## Security Best Practices

1. **Input Validation**: All data validated before storage
2. **SQL Injection Prevention**: Parameterized queries only
3. **XSS Prevention**: Data sanitized, special chars removed
4. **Authorization**: User ownership verified
5. **Error Handling**: No sensitive data in error messages
6. **Data Limits**: Prevents DoS via large inputs
7. **Type Safety**: TypeScript + Zod schemas

## Usage Example

```typescript
// Upload lab report
const formData = new FormData();
formData.append("file", file);
formData.append("userId", "user@example.com");
formData.append("docType", "lab_report");
formData.append("docId", "lab-123");

const response = await fetch("/api/documents/upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
// result.labExtract.parameters contains validated parameters

// Retrieve for dashboard
const reportsResponse = await fetch(
  `/api/labs/reports?userId=user@example.com`
);
const { reports } = await reportsResponse.json();

// Display in dashboard cards
reports.forEach(report => {
  Object.entries(report.parameters).forEach(([name, param]) => {
    // Display: name, value, unit, referenceRange, flag
  });
});
```

## Error Handling

- **Parameter extraction fails**: Upload still succeeds, warning returned
- **Validation fails**: Error returned with specific field that failed
- **SQL error**: Error logged, user-friendly message returned
- **Authorization fails**: 403 Forbidden returned

## Next Steps

1. ✅ Parameter extraction with validation
2. ✅ Safe SQL storage
3. ✅ API endpoints for retrieval
4. 🔄 Dashboard cards display (use existing `CurrentDataCards` component)
5. 🔄 Timeseries aggregation (for trends over time)

