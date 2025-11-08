# Manual Setup: Add SQL Credentials to env File

## Step 1: Open Your env File

Your `env` file is located at:
```
/Users/aymaanshaikh/Desktop/shadcntheme/env
```

Open it in any text editor (VS Code, TextEdit, nano, etc.)

## Step 2: Add SQL Credentials

Add these lines at the end of your `env` file:

```bash
# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username_here;Password=your_password_here;Encrypt=true;TrustServerCertificate=false
```

## Step 3: Replace Placeholders

Replace the following:
- `your_username_here` → Your actual SQL username (from Azure Portal)
- `your_password_here` → Your actual SQL password (from Azure Portal)

**Important**: Replace it in BOTH places:
1. In `AZURE_SQL_USER=your_username_here`
2. In `AZURE_SQL_PASSWORD=your_password_here`
3. In the connection string: `User Id=your_username_here` and `Password=your_password_here`

## Step 4: Save the File

Save the `env` file after making changes.

## Example

Here's what your `env` file should look like (with example credentials):

```bash
K2_API_KEY =IFM-GcZbhYqNGoKWcIuJ
PINECONE_API_KEY =pcsk_39ikrP_9ruagfrjw3i9C7sitXwzVJ2f3JPy7N9Ft9DasqaX5ReLMPiz7TKP4hDDBvtR6oB

# AZURE_REGION=southeastasia

# Azure AI Foundry Service
AZURE_OPENAI_ENDPOINT=https://foundrymodelsk2hackathon.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=EWHEqNFG4lLBRe9D99C5JNq6Lw8UtvHycJzpLyU4C93481z0f5kpJQQJ99BKACYeBjFXJ3w3AAAAACOGVzY1
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=sqladmin
AZURE_SQL_PASSWORD=MyStr0ng!P@ssw0rd123
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=sqladmin;Password=MyStr0ng!P@ssw0rd123;Encrypt=true;TrustServerCertificate=false
```

**Note**: The example credentials above are just examples. Use your own credentials from Azure Portal!

## Step 5: Test the Connection

After adding credentials, test the connection:

```bash
npm run test-sql-storage
```

## Quick Command to Add (Using Terminal)

If you prefer to use the terminal, you can run:

```bash
cat >> env << 'EOF'

# Azure SQL Database
AZURE_SQL_SERVER=k2sqldatabaseserver.database.windows.net
AZURE_SQL_DATABASE=K2Database
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here
AZURE_SQL_CONNECTION_STRING=Server=k2sqldatabaseserver.database.windows.net;Database=K2Database;User Id=your_username_here;Password=your_password_here;Encrypt=true;TrustServerCertificate=false
EOF
```

Then edit the file to replace `your_username_here` and `your_password_here` with your actual credentials.

## Verification

After adding credentials, verify they're in the file:

```bash
grep AZURE_SQL env
```

You should see all 5 SQL-related variables.

## Troubleshooting

### Credentials Not Working
- Make sure you replaced `your_username_here` and `your_password_here` with actual values
- Check for typos in username or password
- Verify credentials in Azure Portal

### File Not Found
- Make sure you're in the project directory: `/Users/aymaanshaikh/Desktop/shadcntheme`
- Check that the file is named `env` (not `.env`)

### Permission Denied
- Make sure you have write permissions on the `env` file
- Try: `chmod 644 env`

