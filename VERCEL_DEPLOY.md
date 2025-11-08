# Vercel Deployment Guide

Complete guide to deploy your Next.js application to Vercel.

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Repository** - Your code should be pushed to GitHub
3. **Environment Variables** - Have your API keys ready

## Important Notes

### ⚠️ Database Limitation

**Vercel is serverless** and doesn't support SQLite (file-based database). You **must** migrate to a cloud database:

**Recommended Options:**
1. **Vercel Postgres** (easiest, integrated)
2. **Neon** (serverless Postgres, free tier)
3. **Supabase** (Postgres + auth, free tier)
4. **PlanetScale** (MySQL, free tier)

### ⚠️ Python Backend

Your Python backend (`backend/`) won't run on Vercel. Options:
1. **Deploy Python separately** to Railway, Render, or Fly.io
2. **Convert to Vercel Serverless Functions** (Node.js only)
3. **Use external API** for Python processing

## Quick Deploy (Recommended)

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to:** https://vercel.com/new
2. **Import your GitHub repository:**
   - Click "Import Project"
   - Select `nkkrnkl/carepilot`
   - Click "Import"
3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)
4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add each variable:
     ```
     OPENAI_API_KEY=your-key
     PINECONE_API_KEY=your-key
     PINECONE_INDEX_NAME=care-pilot
     AZURE_OPENAI_ENDPOINT=your-endpoint
     AZURE_OPENAI_API_KEY=your-key
     AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
     AZURE_OPENAI_API_VERSION=2023-05-15
     DATABASE_URL=your-postgres-connection-string
     NODE_ENV=production
     NEXT_TELEMETRY_DISABLED=1
     ```
5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://carepilot.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project? **No** (first time)
   - Project name: `carepilot` (or your choice)
   - Directory: `./`
   - Override settings? **No**

4. **Add Environment Variables:**
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add PINECONE_API_KEY
   vercel env add DATABASE_URL
   # ... add all other variables
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Database Migration (Required)

### Option 1: Vercel Postgres (Recommended)

1. **In Vercel Dashboard:**
   - Go to your project
   - Click **Storage** tab
   - Click **Create Database** → **Postgres**
   - Name it (e.g., `carepilot-db`)
   - Select region
   - Click **Create**

2. **Get Connection String:**
   - Go to **Storage** → Your database
   - Copy the **Connection String**
   - It looks like: `postgresql://user:pass@host:5432/dbname?sslmode=require`

3. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Run Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### Option 2: Neon (Free Tier)

1. **Sign up:** https://neon.tech
2. **Create database**
3. **Get connection string**
4. **Update Prisma schema** (same as above)
5. **Add `DATABASE_URL` to Vercel environment variables**

### Option 3: Supabase

1. **Sign up:** https://supabase.com
2. **Create project**
3. **Get connection string** from Settings → Database
4. **Update Prisma schema**
5. **Add `DATABASE_URL` to Vercel**

## Environment Variables Setup

Add these in Vercel Dashboard → Settings → Environment Variables:

### Required:
```
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=care-pilot
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15
DATABASE_URL=postgresql://...
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Optional:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important:** Set variables for:
- **Production** (required)
- **Preview** (optional, for PR previews)
- **Development** (optional, for local dev)

## Python Backend Solution

Since Vercel doesn't support Python serverless functions, you have options:

### Option 1: Deploy Python Separately (Recommended)

Deploy your Python backend to:
- **Railway:** https://railway.app (easy, supports Python)
- **Render:** https://render.com (free tier)
- **Fly.io:** https://fly.io (good for Python)

Then update your API routes to call the external Python API.

### Option 2: Convert to Node.js

Rewrite Python logic in Node.js/TypeScript to run as Vercel serverless functions.

### Option 3: Use External API

Use a service like:
- **Replicate** for ML models
- **OpenAI API** directly (if applicable)
- **Custom API** hosted elsewhere

## Build Configuration

The `vercel.json` file is already configured with:
- Next.js framework detection
- 30-second timeout for API routes
- Proper build commands
- Region selection (US East)

## Continuous Deployment

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every push to other branches/PRs

To disable auto-deploy:
1. Go to Project Settings → Git
2. Unlink repository or disable auto-deploy

## Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Vercel handles SSL automatically

## Monitoring & Logs

- **Logs:** Vercel Dashboard → Deployments → Click deployment → View logs
- **Analytics:** Enable in Project Settings → Analytics
- **Speed Insights:** Enable in Project Settings → Speed Insights

## Troubleshooting

### Build Fails

1. **Check build logs** in Vercel Dashboard
2. **Common issues:**
   - Missing environment variables
   - Prisma client not generated (add `postinstall` script)
   - TypeScript errors
   - Missing dependencies

### API Routes Timeout

- Increase timeout in `vercel.json`:
  ```json
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
  ```

### Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled: `?sslmode=require`

### Prisma Issues

- Ensure `postinstall` script runs: `"postinstall": "prisma generate"`
- Run migrations: `npx prisma migrate deploy`
- Check Prisma client is generated in build logs

## Quick Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove
```

## Cost

**Vercel Free Tier:**
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function execution time limits
- Perfect for development and small projects

**Vercel Pro ($20/month):**
- More bandwidth
- Longer function execution
- Team collaboration
- Advanced analytics

## Next Steps

1. ✅ Set up database (Vercel Postgres, Neon, or Supabase)
2. ✅ Update Prisma schema to use PostgreSQL
3. ✅ Add all environment variables in Vercel Dashboard
4. ✅ Deploy via Dashboard or CLI
5. ✅ Test your deployed app
6. ✅ Set up custom domain (optional)

---

**Need help?** Check Vercel docs: https://vercel.com/docs

