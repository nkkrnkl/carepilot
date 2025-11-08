# Test SQL Database - Quick Start

## 🚀 Run the Test Now!

### Step 1: Start the Dev Server

```bash
npm run dev
```

### Step 2: Test the Database

**Option A: Open in Browser**
```
http://localhost:3000/api/test/database
```

**Option B: Use curl**
```bash
curl http://localhost:3000/api/test/database
```

**Option C: Use curl with pretty JSON**
```bash
curl http://localhost:3000/api/test/database | jq
```

## ✅ What to Expect

You should see a JSON response like:

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
      "message": "Insurer created: insurer-..."
    },
    // ... more steps
  ],
  "data": {
    "testUserEmail": "testuser-...@example.com",
    "insurerId": "insurer-...",
    "providerId": "provider-...",
    "userEmail": "testuser-...@example.com",
    "doctorId": "doctor-...",
    "appointmentId": "apt-...",
    "labReportId": "lab-...",
    "benefitsId": 1,
    "eobId": 1,
    "retrieved": {
      "user": {
        "email": "testuser-...@example.com",
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

## ❌ Troubleshooting

### "Database connection failed"
- Check your `.env.local` file has correct SQL credentials
- Verify Azure SQL firewall allows your IP address
- Test connection with Azure Data Studio

### "Table not found"
- Run `database/schema.sql` on your SQL Server database
- Verify tables were created

### "Cannot find module 'mssql'"
```bash
npm install mssql
```

## 📋 Prerequisites

1. ✅ Database schema created (run `database/schema.sql`)
2. ✅ Environment variables set in `.env.local`
3. ✅ Dependencies installed (`npm install`)

## 📚 More Help

- `database/RUN-TEST.md` - Detailed testing guide
- `database/QUICK-START-TEST.md` - Quick start guide
- `database/TESTING.md` - Complete testing documentation

