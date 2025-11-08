# Quick Test SQL Connection

## ✅ Script Updated

The test script now accepts credentials from command line arguments!

## Usage

### Method 1: Command Line Arguments (Recommended for Testing)

```bash
npm run test-sql-connection -- user=<username> password='<password>'
```

**Example:**
```bash
npm run test-sql-connection -- user=sqladmin password='abc123!!'
```

### Method 2: Environment Variables

Add to your `env` file:
```bash
AZURE_SQL_USER=your_username
AZURE_SQL_PASSWORD=your_password
```

Then run:
```bash
npm run test-sql-connection
```

### Method 3: Bash Script

```bash
./scripts/test-sql-with-credentials.sh <username> <password>
```

**Example:**
```bash
./scripts/test-sql-with-credentials.sh sqladmin 'abc123!!'
```

## Current Test Result

The test shows:
- ✅ Script is working correctly
- ✅ Credentials are being read from command line
- ❌ Login failed for user 'sqladmin'

## Possible Issues

### 1. Username Doesn't Exist
- The username 'sqladmin' might not be set up in Azure SQL Database
- You need to create a SQL administrator in Azure Portal first

### 2. Password is Incorrect
- The password 'abc123!!' might not match what's set in Azure
- Check the password in Azure Portal

### 3. SQL Authentication Not Enabled
- SQL authentication might not be enabled on your SQL Server
- You need to enable it in Azure Portal

### 4. Wrong Username
- The actual username might be different
- Check what username you set up in Azure Portal

## Next Steps

### Step 1: Verify SQL Authentication is Set Up

1. Go to Azure Portal: https://portal.azure.com
2. Navigate to SQL Server: `k2sqldatabaseserver`
3. Go to: **Settings** > **SQL administrators**
4. Check if a SQL administrator is configured
5. Note the username that's set up

### Step 2: Use the Correct Username

If the username is different, use that instead:

```bash
npm run test-sql-connection -- user=<actual_username> password='<actual_password>'
```

### Step 3: Set Up SQL Authentication (If Not Done)

If SQL authentication is not set up:

1. Go to: **Settings** > **SQL administrators**
2. Click **"Set admin"** or **"Add SQL admin"**
3. Enter username and password
4. Save

### Step 4: Configure Firewall

1. Go to: **Settings** > **Networking**
2. Click **"Add client IP"**
3. Save

### Step 5: Test Again

After setting up, test again:

```bash
npm run test-sql-connection -- user=<your_username> password='<your_password>'
```

## Troubleshooting Commands

### Check Current Credentials
```bash
# See what's in your env file
grep AZURE_SQL env
```

### Test with Different Username
```bash
npm run test-sql-connection -- user=carepilot password='abc123!!'
```

### Test with Connection String
If you have a connection string, add it to your `env` file:
```bash
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=username;Password=password;Encrypt=true;TrustServerCertificate=false
```

Then run:
```bash
npm run test-sql-connection
```

## Common Usernames to Try

If you're not sure of the username, try these common ones:
- `sqladmin`
- `admin`
- `carepilot`
- `sa` (system administrator - if enabled)
- Your Azure AD username

## Need Help?

1. Check what username is configured in Azure Portal
2. Verify SQL authentication is enabled
3. Make sure firewall rules allow your IP
4. Try the connection string method instead

## Quick Reference

```bash
# Test with command line
npm run test-sql-connection -- user=username password='password'

# Test with env file
# (Add credentials to env file first)
npm run test-sql-connection

# Test with bash script
./scripts/test-sql-with-credentials.sh username 'password'
```

