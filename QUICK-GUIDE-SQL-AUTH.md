# Quick Guide: Set Up SQL Authentication

## 🚀 Fastest Way

### Step 1: Go Directly to SQL Administrators

**Click this link**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins

### Step 2: Click "Set admin" or "Add SQL admin"

- If you see "No SQL authentication admin configured" → Click **"Set admin"**
- If you see an existing admin → Click **"Add SQL admin"**

### Step 3: Enter Credentials

Fill in the form:
- **SQL Administrator Login**: Enter a username (e.g., `sqladmin`)
- **Password**: Enter a strong password (save it!)
- **Confirm Password**: Re-enter the password

### Step 4: Click "Save"

Wait for the success confirmation.

### Step 5: Save Your Credentials

Write down:
- ✅ Username: `_____________`
- ✅ Password: `_____________`

## 📋 Visual Guide

```
Azure Portal
└── k2sqldatabaseserver (SQL Server)
    └── Settings
        └── SQL administrators  ← Go here!
            └── [Set admin] button
                └── Enter username & password
                    └── [Save]
```

## 🔗 Important Links

- **SQL Administrators**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
- **Networking (Firewall)**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking

## ✅ Checklist

- [ ] Opened Azure Portal
- [ ] Navigated to SQL Administrators page
- [ ] Clicked "Set admin" or "Add SQL admin"
- [ ] Entered username
- [ ] Entered password (and saved it!)
- [ ] Confirmed password
- [ ] Clicked "Save"
- [ ] Saw success confirmation
- [ ] Wrote down credentials

## 🎯 Next Steps

1. **Configure Firewall**: Add your IP address
2. **Add to env file**: Run `npm run setup-sql-credentials`
3. **Test connection**: Run `npm run test-sql-storage`

## ❓ Common Questions

**Q: What username should I use?**
A: Any username you want (e.g., `sqladmin`, `carepilot_admin`). No spaces or special characters.

**Q: What password should I use?**
A: A strong password with uppercase, lowercase, numbers, and special characters. At least 8 characters.

**Q: Where do I find this page?**
A: Go to SQL Server → Settings → SQL administrators

**Q: I don't see "Set admin" button**
A: Make sure you're on the SQL Server page (not the database page), and check your permissions.

## 📚 Detailed Instructions

For more detailed instructions with troubleshooting, see: **HOW-TO-SETUP-SQL-AUTH.md**

