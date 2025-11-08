# How to Set Up SQL Authentication in Azure Portal - Step by Step

## Step 1: Access Azure Portal

1. **Open your web browser** and go to: https://portal.azure.com
2. **Sign in** with your account: `aymaaniliyasgmail.onmicrosoft.com`

## Step 2: Navigate to Your SQL Server

You have several ways to get there:

### Option A: Direct Link (Easiest)
Click this link to go directly to SQL Administrators:
**https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins**

### Option B: Search for SQL Server
1. In the Azure Portal top search bar, type: `k2sqldatabaseserver`
2. Click on the result: **k2sqldatabaseserver** (it will show as a SQL Server resource)

### Option C: Navigate Manually
1. Click **"All resources"** in the left menu
2. Search for or find: `k2sqldatabaseserver`
3. Click on it to open the SQL Server overview page

## Step 3: Access SQL Administrators Settings

Once you're on the SQL Server page (`k2sqldatabaseserver`):

1. Look at the **left sidebar menu** (under the server name)
2. Scroll down to find **"Settings"** section
3. Click on **"SQL administrators"** (it's under Settings)

**Visual Guide:**
```
k2sqldatabaseserver
├── Overview
├── Activity log
├── Access control (IAM)
├── Tags
├── Settings
│   ├── SQL administrators  ← Click here!
│   ├── Networking
│   ├── Security
│   └── ...
└── ...
```

## Step 4: Set Up SQL Administrator

On the **"SQL administrators"** page, you'll see:

### If No Admin is Set:
- You'll see a message like: "No SQL authentication admin configured"
- Click the **"Set admin"** button (usually at the top)

### If Admin Already Exists:
- You'll see the current admin listed
- Click **"Add SQL admin"** or **"Add administrator"** button (usually at the top)

## Step 5: Enter Administrator Details

A form will appear (or a side panel will open). Fill in:

1. **SQL Administrator Login**:
   - Enter a username (e.g., `sqladmin`, `carepilot_admin`, or `admin`)
   - This will be your SQL username for connections
   - **Note**: Username cannot contain spaces or special characters

2. **Password**:
   - Click in the password field
   - Enter a strong password (Azure will show requirements)
   - **IMPORTANT**: Save this password! You'll need it for your env file.
   - Password requirements typically include:
     - At least 8 characters
     - Contains uppercase and lowercase letters
     - Contains numbers
     - Contains special characters

3. **Confirm Password**:
   - Re-enter the same password

## Step 6: Save the Administrator

1. **Review** your username and password
2. Click the **"Save"** or **"OK"** button at the bottom of the form
3. Wait for the confirmation message (usually takes a few seconds)

## Step 7: Verify Setup

After saving, you should see:
- Your SQL administrator username displayed on the page
- A success notification at the top of the page
- The status showing as "Active" or "Configured"

## Step 8: Write Down Your Credentials

**IMPORTANT**: Before leaving this page, make sure you have:

- ✅ **SQL Username**: (e.g., `sqladmin`)
- ✅ **SQL Password**: (the password you just created)

Save these securely - you'll need them for the next step!

## What You'll See

### Before Setting Up:
```
SQL administrators
──────────────────
No SQL authentication admin configured

[Set admin] button
```

### After Setting Up:
```
SQL administrators
──────────────────
SQL authentication admin
Username: sqladmin
Status: Active

[Add SQL admin] button
```

## Troubleshooting

### "Set admin" Button Not Visible
- Make sure you're on the **SQL Server** page (not the database page)
- Check that you have the correct permissions (Contributor or Owner role)
- Try refreshing the page

### Password Requirements Not Met
- Make sure your password meets all requirements shown
- Use a password manager to generate a strong password
- Common requirements: 8+ chars, uppercase, lowercase, numbers, special chars

### "Failed to Set Admin" Error
- Check your permissions on the SQL Server
- Verify you're signed in with the correct Azure account
- Try again after a few moments (Azure may need time to process)

### Can't Find SQL Administrators Menu
- Make sure you're on the **SQL Server** resource (not SQL Database)
- Look under the **"Settings"** section in the left menu
- The menu item might be called "SQL administrators" or "Administrators"

## Next Steps

After successfully setting up SQL authentication:

1. **Configure Firewall** (Step 2):
   - Go to: Settings > Networking
   - Click "Add client IP"
   - Click Save

2. **Add Credentials to env File** (Step 3):
   - Run: `npm run setup-sql-credentials`
   - Enter your SQL username and password when prompted

3. **Test Connection** (Step 4):
   - Run: `npm run test-sql-storage`

## Quick Reference Links

- **SQL Administrators**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
- **SQL Server Overview**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/overview
- **Networking/Firewall**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking

## Security Best Practices

1. **Use a Strong Password**: Generate a random, strong password
2. **Don't Share Credentials**: Keep SQL credentials private
3. **Use Environment Variables**: Never hardcode credentials in code
4. **Rotate Passwords**: Change SQL passwords periodically
5. **Limit Access**: Only give SQL admin access to trusted users

## Example Credentials

Here's an example of what you might enter:

- **Username**: `carepilot_sql_admin`
- **Password**: `MyStr0ng!P@ssw0rd123` (example - use your own strong password!)

**Remember**: These are just examples. Use your own secure credentials!

