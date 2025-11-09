# How to Verify Lab Agent Execution and Database Storage

This guide explains how to verify that the lab agent was triggered and that results were stored in Azure SQL Server.

## 1. Check Application Logs

### During Upload
When a lab report is uploaded, check the server console logs for:

```
Starting lab report extraction using lab agent...
Lab extraction result: { success: true, hasData: true, ... }
Lab report extracted successfully, storing in SQL database...
Lab report stored successfully in SQL database
```

### Log Locations
- **Development**: Check the terminal where `npm run dev` is running
- **Production**: Check your deployment platform's logs (Azure App Service, Vercel, etc.)

## 2. Check UI Indicators

### Upload Component
After uploading a lab report, you should see:
- ✅ **"✓ Lab extracted"** - Green checkmark if extraction succeeded
- ⚠️ **"⚠ Lab extraction failed"** - Yellow warning if extraction failed

### Lab Analysis Page
Navigate to `/features/lab-analysis` to see:
- Previously uploaded lab reports
- Current data cards showing extracted parameters
- Past visits charts

## 3. Query Database via API

### Get All Lab Reports for a User
```bash
# Replace <userId> with the user's email
curl "http://localhost:3000/api/labs/list?userId=<userId>"
```

Response:
```json
{
  "success": true,
  "reports": [
    {
      "id": "doc-123",
      "userId": "user@example.com",
      "title": "Lab Report",
      "date": "2025-01-15",
      "hospital": "General Hospital",
      "doctor": "Dr. Smith",
      "parameters": {
        "table_compact": { ... },
        "summary_cards": [ ... ],
        "condition_flags": [ ... ]
      },
      "rawExtract": { ... },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

### Get Specific Lab Report
```bash
curl "http://localhost:3000/api/labs/get?id=<reportId>&userId=<userId>"
```

## 4. Use Command-Line Script

### Check Lab Reports for a User
```bash
npm run check-lab-reports <userId>
```

Example:
```bash
npm run check-lab-reports user@example.com
```

Output:
```
🔍 Fetching lab reports for user: user@example.com...

✅ Found 2 lab report(s):

================================================================================

1. Lab Report: doc-123
   Title: Lab Report - Complete Blood Count
   Date: 2025-01-15
   Hospital: General Hospital
   Doctor: Dr. Smith
   Created: 2025-01-15T10:00:00Z
   Status: ✅ Extracted
   Parameters: 15 rows
   Summary Cards: 8
   Workflow: ✅ Completed

2. Lab Report: doc-456
   Title: Lab Report - Lipid Panel
   Date: 2025-01-10
   Hospital: General Hospital
   Doctor: Dr. Jones
   Created: 2025-01-10T14:30:00Z
   Status: ✅ Extracted
   Parameters: 12 rows
   Summary Cards: 6
   Workflow: ✅ Completed

================================================================================
```

### Check Specific Report
```bash
npm run check-lab-reports <userId> <reportId>
```

## 5. Direct SQL Query (Azure SQL Database)

### Connect to Azure SQL Database
1. Use Azure Portal SQL Query Editor
2. Use Azure Data Studio
3. Use `sqlcmd` or any SQL client

### Query Lab Reports
```sql
-- Get all lab reports for a user
SELECT 
    id,
    userId,
    title,
    date,
    hospital,
    doctor,
    createdAt,
    updatedAt,
    CASE 
        WHEN parameters IS NOT NULL THEN 'Has Parameters'
        ELSE 'No Parameters'
    END as status
FROM LabReport
WHERE userId = 'user@example.com'
ORDER BY createdAt DESC;

-- Check if raw extract exists (workflow completed)
SELECT 
    id,
    userId,
    title,
    CASE 
        WHEN rawExtract IS NOT NULL THEN 'Has Raw Extract'
        ELSE 'No Raw Extract'
    END as extractStatus,
    LEN(rawExtract) as extractSize,
    LEN(parameters) as parametersSize
FROM LabReport
WHERE userId = 'user@example.com';

-- Count lab reports by user
SELECT 
    userId,
    COUNT(*) as reportCount,
    MAX(createdAt) as lastReportDate
FROM LabReport
GROUP BY userId
ORDER BY reportCount DESC;

-- Check for recent uploads (last 24 hours)
SELECT 
    id,
    userId,
    title,
    createdAt,
    DATEDIFF(hour, createdAt, GETUTCDATE()) as hoursAgo
FROM LabReport
WHERE createdAt >= DATEADD(hour, -24, GETUTCDATE())
ORDER BY createdAt DESC;
```

### Verify Data Structure
```sql
-- Check if parameters JSON is valid and contains data
SELECT 
    id,
    title,
    JSON_VALUE(parameters, '$.table_compact.columns[0]') as firstColumn,
    (SELECT COUNT(*) 
     FROM OPENJSON(parameters, '$.summary_cards')) as cardCount,
    (SELECT COUNT(*) 
     FROM OPENJSON(parameters, '$.condition_flags')) as flagCount
FROM LabReport
WHERE userId = 'user@example.com'
  AND parameters IS NOT NULL;

-- Check workflow completion status from rawExtract
SELECT 
    id,
    title,
    JSON_VALUE(rawExtract, '$.workflow_completed') as workflowCompleted,
    JSON_VALUE(rawExtract, '$.dashboard.summary_cards[0].title') as firstCardTitle
FROM LabReport
WHERE userId = 'user@example.com'
  AND rawExtract IS NOT NULL;
```

## 6. Check Database Schema

Verify that the `LabReport` table exists:

```sql
-- Check table exists
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'LabReport';

-- Check table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'LabReport'
ORDER BY ORDINAL_POSITION;

-- Check indexes
SELECT 
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('LabReport')
ORDER BY i.name, ic.key_ordinal;
```

## 7. Troubleshooting

### No Lab Reports Found
1. **Check upload logs**: Verify the file was uploaded successfully
2. **Check extraction logs**: Look for errors in lab agent execution
3. **Verify document type**: Ensure `docType === "lab_report"`
4. **Check user ID**: Verify the userId matches the authenticated user

### Extraction Failed
1. **Check Python environment**: Ensure all dependencies are installed
2. **Check lab agent file**: Verify `backend/lab_agent_2.py` exists
3. **Check file format**: Ensure the uploaded file is a valid PDF
4. **Check error messages**: Look for specific error in logs

### Data Not Stored
1. **Check SQL connection**: Verify database connection is working
2. **Check permissions**: Ensure the database user has INSERT/UPDATE permissions
3. **Check constraints**: Verify foreign key constraints (userId must exist in user_table)
4. **Check transaction logs**: Look for SQL errors in logs

## 8. Expected Data Structure

### LabReport Table
- `id`: Document ID (string, primary key)
- `userId`: User email (string, foreign key to user_table)
- `title`: Report title (string, nullable)
- `date`: Report date (date, nullable)
- `hospital`: Hospital name (string, nullable)
- `doctor`: Doctor name (string, nullable)
- `fileUrl`: File URL (string, nullable) - usually null (stored in Pinecone)
- `rawExtract`: Full workflow result (JSON string, nullable)
- `parameters`: Structured parameters (JSON string, nullable)
- `createdAt`: Creation timestamp (datetime2)
- `updatedAt`: Update timestamp (datetime2)

### Parameters JSON Structure
```json
{
  "table_compact": {
    "columns": ["Parameter", "Value", "Unit", "Reference Range"],
    "rows": [
      ["Hemoglobin", "14.2", "g/dL", "12.0-16.0"],
      ...
    ]
  },
  "summary_cards": [
    {
      "title": "Hemoglobin",
      "value": "14.2",
      "unit": "g/dL",
      "flag": "normal",
      "detail": "12.0-16.0"
    },
    ...
  ],
  "condition_flags": [
    {
      "name": "Hemoglobin check",
      "present": true,
      "rationale": "Hemoglobin reported as 14.2 (see table)"
    },
    ...
  ]
}
```

### Raw Extract JSON Structure
```json
{
  "workflow_completed": true,
  "steps": {
    "step1": { ... },
    "step2": { ... },
    "step3": { ... },
    "step4": { ... }
  },
  "dashboard": {
    "table_compact": { ... },
    "summary_cards": [ ... ],
    "condition_flags": [ ... ]
  }
}
```

## 9. Quick Verification Checklist

- [ ] File uploaded successfully (check upload response)
- [ ] Lab agent triggered (check server logs)
- [ ] Extraction completed (check `workflow_completed: true`)
- [ ] Data stored in database (query `LabReport` table)
- [ ] Parameters extracted (check `parameters` JSON)
- [ ] UI shows extraction status (check upload component)
- [ ] Lab report appears in list (check `/features/lab-analysis`)

## 10. API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/labs/list?userId=<userId>` | GET | Get all lab reports for a user |
| `/api/labs/get?id=<reportId>&userId=<userId>` | GET | Get specific lab report |
| `/api/documents/upload` | POST | Upload document (triggers lab agent if `docType=lab_report`) |

## Need Help?

If you're still having issues:
1. Check the application logs for detailed error messages
2. Verify the database connection string in environment variables
3. Test the lab agent script directly: `python3 backend/scripts/extract_lab_agent.py`
4. Check Azure SQL Database firewall rules
5. Verify the user exists in the `user_table` before uploading

