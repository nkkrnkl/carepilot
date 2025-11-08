# How to Set Up SQL Database Credentials

## Current Situation

Your project uses an `env` file (without the dot) instead of `.env`. The setup script has been updated to handle this.

## Step-by-Step Instructions

### 1. Set Up SQL Authentication in Azure Portal

**IMPORTANT**: You must do this first before adding credentials to your env file.

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to SQL Server**: Search for `k2sqldatabaseserver`
3. **Go to SQL Administrators**:
   - Click on "k2sqldatabaseserver" (the server, not the database)
   - In the left menu, go to **Settings** > **SQL administrators**
   - Click **"Set admin"** or **"Add SQL admin"**
   - Enter a **username** (e.g., `sqladmin` or `carepilot_admin`)
   - Enter a **password** (make it strong and save it!)
   - Click **Save**

### 2. Configure Firewall

1. **Still in the SQL Server page**, go to **Settings** > **Networking**
2. Click **"Add client IP"** to allow your current IP address
3. Optionally, enable **"Allow Azure services and resources to access this server"**
4. Click **Save**

### 3. Add Credentials to Your env File

You have two options:

#### Option A: Interactive Script (Recommended)

Run the script and answer the prompts:

```bash
npm run setup-sql-credentials
```

When prompted:
- Answer "y" when asked if you have credentials ready
- Enter your SQL username
- Enter your SQL password (it will be hidden)
- Confirm your password

The script will automatically add the credentials to your `env` file.

#### Option B: Manual Setup

1. Open your `env` file: `/Users/aymaanshaikh/Desktop/shadcntheme/env`

2. Add these lines at the end:

```bash
# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_actual_username_here
AZURE_SQL_PASSWORD=your_actual_password_here
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_actual_username;Password=your_actual_password;Encrypt=true;TrustServerCertificate=false
```

3. Replace:
   - `your_actual_username_here` with your SQL username
   - `your_actual_password_here` with your SQL password
   - Do the same in the connection string

### 4. Test the Connection

After adding credentials, test the connection:

```bash
npm run test-sql-storage
```

You should see:
- ✅ Creating test insurer...
- ✅ Insurer created
- ✅ Provider created
- ✅ User created
- ✅ Document added to user
- ✅ All tests passed!

## Direct Azure Portal Links

- **Set SQL Admin**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/sqlAdmins
- **Configure Firewall**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/networking
- **Get Connection String**: https://portal.azure.com/#@aymaaniliyasgmail.onmicrosoft.com/resource/subscriptions/41f56be4-b097-45ca-b7a6-b064a0c7189e/resourceGroups/K2/providers/Microsoft.Sql/servers/k2sqldatabaseserver/databases/K2Database/connectionstrings

## Troubleshooting

### "Login failed for user"
- Make sure you set up SQL Authentication in Azure Portal (Step 1)
- Verify the username and password in your `env` file are correct
- Make sure there are no extra spaces in the credentials

### "Cannot open server" or Firewall error
- Add your IP address in Firewall rules (Step 2)
- Check that the firewall rule was saved
- Try enabling "Allow Azure services" temporarily

### Script doesn't prompt for input
- Make sure you're running it in a terminal (not through an IDE)
- Try running it directly: `./scripts/get-sql-credentials.sh`
- Make sure you answer "y" when asked if credentials are ready

### Credentials not being saved
- Check that the `env` file is writable
- Make sure you're in the project directory
- Check if a backup was created (`env.bak`)

## Next Steps

After successfully setting up credentials and testing:

1. **Create the tables**:
   ```bash
   npm run create-sql-tables
   ```

2. **Start using SQL Database** in your application!

3. **Update API routes** to use SQL storage instead of Table Storage (if needed)

