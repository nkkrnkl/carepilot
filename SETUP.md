# CarePilot - Complete Setup Guide

This guide will help you get CarePilot running on your local machine.

## 🚀 Quick Start

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**: Copy `.env.example` to `.env` and fill in your credentials
4. **Initialize database**: `npm run db:push && npm run db:seed`
5. **Start the server**: `npm run dev`

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js** 18.17+ installed ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Python** 3.8+ (for backend features)
- Accounts and API keys for:
  - [Auth0](https://auth0.com) - For authentication
  - [Azure](https://azure.microsoft.com) - For storage and AI services
  - [Pinecone](https://www.pinecone.io) - For vector database
  - [OpenAI](https://openai.com) - For lab report extraction

## 🔧 Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd shadcntheme

# Install Node.js dependencies
npm install

# Install Python dependencies (for backend features)
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Environment Variables Setup

**This is the most important step!**

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and fill in your credentials:**
   - Open `.env` in your text editor
   - Replace all placeholder values with your actual credentials
   - **Never commit `.env` to git** - it contains sensitive information

3. **Required environment variables:**
   - See `.env.example` for the complete list
   - Minimum required for basic functionality:
     - `DATABASE_URL` - Database connection (use `file:./dev.db` for SQLite)
     - `AUTH0_*` - Auth0 authentication credentials
     - `AZURE_STORAGE_CONNECTION_STRING` - Azure Storage connection
     - `PINECONE_API_KEY` - Pinecone API key
     - `AZURE_OPENAI_*` - Azure OpenAI credentials
     - `OPENAI_API_KEY` - OpenAI API key

### 3. Database Setup

```bash
# Initialize the database schema
npm run db:push

# Seed the database with sample data (optional)
npm run db:seed
```

### 4. Auth0 Setup

1. Create a free account at [Auth0](https://auth0.com)
2. Create a new application in the Auth0 dashboard
3. Get your credentials:
   - Domain (e.g., `your-tenant.us.auth0.com`)
   - Client ID
   - Client Secret
4. Generate `AUTH0_SECRET`:
   ```bash
   openssl rand -hex 32
   ```
5. Add credentials to `.env`
6. Configure Auth0 dashboard:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

See [AUTH0-SETUP.md](./AUTH0-SETUP.md) for detailed Auth0 setup instructions.

### 5. Azure Setup

#### Azure Storage

1. Create an Azure Storage Account
2. Get your connection string from Azure Portal
3. Add to `.env`:
   ```env
   AZURE_STORAGE_CONNECTION_STRING="your-connection-string"
   AZURE_BLOB_CONTAINER_NAME="doctor-data"
   ```

#### Azure OpenAI

1. Create an Azure OpenAI resource
2. Get your endpoint and API key
3. Add to `.env`:
   ```env
   AZURE_OPENAI_ENDPOINT="https://your-resource.cognitiveservices.azure.com/"
   AZURE_OPENAI_API_KEY="your-api-key"
   AZURE_OPENAI_DEPLOYMENT_NAME="text-embedding-3-large-2"
   AZURE_OPENAI_API_VERSION="2023-05-15"
   ```

See [README-AZURE-SETUP.md](./README-AZURE-SETUP.md) for detailed Azure setup.

### 6. Pinecone Setup

1. Create an account at [Pinecone](https://www.pinecone.io)
2. Get your API key from the dashboard
3. Add to `.env`:
   ```env
   PINECONE_API_KEY="your-pinecone-api-key"
   ```

### 7. OpenAI Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add to `.env`:
   ```env
   OPENAI_API_KEY="your-openai-api-key"
   ```

### 8. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✅ Verification

### Check if everything is working:

1. **Database**: Should be created at `./dev.db` (SQLite)
2. **Auth0**: Try logging in at `/signin`
3. **Azure Storage**: Check if doctors load at `/features/scheduling`
4. **API Routes**: Test endpoints like `/api/doctors`

### Test Commands:

```bash
# Test database connection
npm run test-sql-connection

# Check if doctors are loaded
curl http://localhost:3000/api/doctors

# Test Azure storage
npm run check-doctors
```

## 🐛 Troubleshooting

### Common Issues

1. **"Environment variable not set" errors**
   - Make sure `.env` exists and all required variables are set
   - Restart the dev server after changing `.env`

2. **Database errors**
   - Run `npm run db:push` to initialize the database
   - Check `DATABASE_URL` is set correctly

3. **Auth0 errors**
   - Verify credentials in `.env`
   - Check callback URLs in Auth0 dashboard
   - Ensure `AUTH0_SECRET` is generated correctly

4. **Azure storage errors**
   - Verify connection string is correct
   - Check storage account permissions
   - Ensure container exists

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more help.

## 📚 Additional Resources

- [Main README](./README.md) - Project overview and features
- [Auth0 Setup](./AUTH0-SETUP.md) - Detailed Auth0 configuration
- [Azure Setup](./README-AZURE-SETUP.md) - Azure services setup
- [SQL Database Setup](./SQL-DATABASE-SETUP.md) - Database configuration
- [Backend Setup](./backend/README_SETUP.md) - Python backend setup
- [Claims Agent Setup](./backend/CLAIMS_SETUP.md) - Claims processing setup

## 🔐 Security Notes

- **Never commit `.env` or `env` files** - they contain sensitive credentials
- All environment files are gitignored
- Use `.env.example` as a template
- Rotate API keys regularly
- Use different credentials for production

## 🚢 Next Steps

Once setup is complete:

1. Explore the application at `http://localhost:3000`
2. Check out the features:
   - Patient portal
   - Lab analysis
   - Claims processing
   - Appointment scheduling
3. Read the [documentation](./README.md) for more details
4. Check out the [API routes](./app/api/) for backend functionality

## 💡 Tips

- Use SQLite (`file:./dev.db`) for local development
- Use PostgreSQL or Azure SQL for production
- Keep your `.env` file secure and never share it
- Use environment-specific credentials for different environments
- Regularly update dependencies: `npm update`

## 🆘 Getting Help

If you encounter issues:

1. Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide
2. Review the setup guides for specific services
3. Check that all environment variables are set correctly
4. Verify all prerequisites are installed
5. Open an issue on GitHub with details about your problem

---

**Happy coding! 🎉**

