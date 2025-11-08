# Quick Vercel Deployment - Step by Step

Follow these steps to deploy your app to Vercel right now!

## ⚠️ Important: Database Migration Required

**Vercel is serverless** - SQLite won't work. You **must** use a cloud database:

**Quick Options:**
1. **Vercel Postgres** (easiest, integrated) - Free tier available
2. **Neon** (serverless Postgres) - Free tier: https://neon.tech
3. **Supabase** (Postgres + features) - Free tier: https://supabase.com

## Step 1: Set Up Database (5 minutes)

### Option A: Vercel Postgres (Recommended)

1. Go to: https://vercel.com/dashboard
2. Create a new project (or skip for now)
3. Go to **Storage** tab
4. Click **Create Database** → **Postgres**
5. Name it: `carepilot-db`
6. Select region (closest to you)
7. Click **Create**
8. Copy the **Connection String** (looks like: `postgresql://...`)

### Option B: Neon (Free Alternative)

1. Go to: https://neon.tech
2. Sign up (free)
3. Create a project
4. Copy the connection string
5. Use it as `DATABASE_URL`

## Step 2: Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate dev --name init
# Or if you have existing data:
npx prisma db push
```

## Step 3: Deploy to Vercel

### Method 1: Via Vercel Dashboard (Easiest)

1. **Go to:** https://vercel.com/new
2. **Import GitHub repository:**
   - Click "Import Project"
   - Select `nkkrnkl/carepilot`
   - Click "Import"
3. **Configure Project:**
   - Framework: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - **Don't change anything** - defaults are perfect!
4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add each one:
     ```
     DATABASE_URL=postgresql://... (from Step 1)
     OPENAI_API_KEY=your-key
     PINECONE_API_KEY=your-key
     PINECONE_INDEX_NAME=care-pilot
     AZURE_OPENAI_ENDPOINT=https://...
     AZURE_OPENAI_API_KEY=your-key
     AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
     AZURE_OPENAI_API_VERSION=2023-05-15
     NODE_ENV=production
     NEXT_TELEMETRY_DISABLED=1
     ```
   - Make sure to select **Production**, **Preview**, and **Development**
5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - ✅ Your app is live!

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (first time - follow prompts)
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add OPENAI_API_KEY
# ... add all others

# Deploy to production
vercel --prod
```

## Step 4: Verify Deployment

1. **Check deployment status** in Vercel Dashboard
2. **Visit your app:** `https://carepilot.vercel.app` (or your custom URL)
3. **Check logs** if anything fails:
   - Dashboard → Deployments → Click deployment → View logs

## Step 5: Handle Python Backend

Your Python backend (`backend/`) won't run on Vercel. Options:

### Option A: Deploy Python Separately (Recommended)

**Railway (Easiest):**
1. Go to: https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Add `backend/` as root directory
5. Set Python version: 3.11
6. Add environment variables
7. Deploy!

Then update your Next.js API routes to call the Railway URL instead of local Python.

### Option B: Convert to Node.js

Rewrite Python logic in TypeScript/Node.js to run as Vercel serverless functions.

## Troubleshooting

### Build Fails

**Common fixes:**
1. **Prisma client not generated:**
   - Check `package.json` has: `"postinstall": "prisma generate"`
   - It should be there already ✅

2. **Missing environment variables:**
   - Go to Project Settings → Environment Variables
   - Make sure all are set for **Production**

3. **Database connection fails:**
   - Verify `DATABASE_URL` is correct
   - Check database allows external connections
   - Ensure SSL: `?sslmode=require` in connection string

### API Routes Timeout

- Increase timeout in `vercel.json` (already set to 30s)
- For longer operations, consider background jobs

### Python Scripts Not Working

- Python scripts in `backend/` won't run on Vercel
- Deploy Python separately (Railway, Render, Fly.io)
- Or convert to Node.js serverless functions

## What's Already Configured

✅ `vercel.json` - Vercel configuration  
✅ `.vercelignore` - Excludes Python backend  
✅ `next.config.ts` - Optimized for Vercel  
✅ `.gitignore` - Includes Vercel files  

## Next Steps After Deployment

1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Enable analytics (optional)
4. ✅ Deploy Python backend separately
5. ✅ Update API routes to call external Python API

## Quick Commands Reference

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

---

**Ready to deploy?** Go to https://vercel.com/new and import your repo! 🚀

