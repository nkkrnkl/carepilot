# Manual Setup: Add SQL Credentials to env File

## Step 1: Create Your .env File

**Recommended**: Use `.env.example` as a template:

```bash
cp .env.example .env
```

Then open `.env` in any text editor (VS Code, TextEdit, nano, etc.)

**Note**: The project uses `.env` (not `env`) for environment variables. The `.env` file is gitignored for security.

## Step 2: Add SQL Credentials

Add these lines at the end of your `env` file:

```bash
# Azure SQL Database
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USER=your_username_here
AZURE_SQL_PASSWORD=your_password_here
AZURE_SQL_CONNECTION_STRING=Server=your-server.database.windows.net;Database=your-database-name;User Id=your_username_here;Password=your_password_here;Encrypt=true;TrustServerCertificate=false
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

**Important**: Use `.env.example` as a template! Copy it to `.env` and fill in your own credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials. Never use example credentials from documentation files - they are placeholders only!

Your `.env` file should contain your own values for:
- `K2_API_KEY` - Your K2 API key
- `PINECONE_API_KEY` - Your Pinecone API key  
- `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint
- `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key
- `AZURE_SQL_SERVER` - Your Azure SQL server name
- `AZURE_SQL_DATABASE` - Your Azure SQL database name
- `AZURE_SQL_USER` - Your Azure SQL username
- `AZURE_SQL_PASSWORD` - Your Azure SQL password

See `.env.example` for the complete list of required environment variables.

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
- Make sure you're in the project root directory
- Check that the file is named `.env` (not `env`)
- If the file doesn't exist, copy from `.env.example`: `cp .env.example .env`

### Permission Denied
- Make sure you have write permissions on the `env` file
- Try: `chmod 644 env`

