# Next Steps - Complete Your Deployment

✅ **App Service Created Successfully!**
- App Name: `carepilot-2025`
- Resource Group: `K2`
- URL: https://carepilot-2025.azurewebsites.net

## Step 1: Get Publish Profile

**Option A: Azure CLI (Easiest)**
```bash
az webapp deployment list-publishing-profiles \
  --resource-group K2 \
  --name carepilot-2025 \
  --xml > publish-profile.xml
```

Then open `publish-profile.xml` and copy the entire content.

**Option B: Azure Portal**
1. Go to: https://portal.azure.com
2. Search for "carepilot-2025"
3. Click on your Web App
4. Go to **Deployment Center** → **Manage publish profile**
5. Click **Get publish profile**
6. Copy the entire XML content

## Step 2: Add GitHub Secret

1. Go to: https://github.com/nkkrnkl/carepilot/settings/secrets/actions
2. Click **New repository secret**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Paste the XML from Step 1
5. Click **Add secret**

## Step 3: Set Repository Variable (Optional but Recommended)

1. Go to: https://github.com/nkkrnkl/carepilot/settings/variables/actions
2. Click **New repository variable**
3. Name: `AZURE_WEBAPP_NAME`
4. Value: `carepilot-2025`
5. Click **Add variable**

**OR** Update the workflow file to hardcode the name:
- Edit `.github/workflows/azure-webapp-deploy.yml`
- Replace `${{ vars.AZURE_WEBAPP_NAME || 'SET_IN_REPO_VARS' }}` with `carepilot-2025`

## Step 4: Update App Settings (API Keys)

Your app needs real API keys. Update them in Azure Portal:

1. Go to: https://portal.azure.com
2. Search for "carepilot-2025"
3. Click on your Web App
4. Go to **Configuration** → **Application settings**
5. Update these values (click each one to edit):
   - `OPENAI_API_KEY` → Your OpenAI API key
   - `PINECONE_API_KEY` → Your Pinecone API key
   - `PINECONE_INDEX_NAME` → `care-pilot` (or your index name)
   - `AZURE_OPENAI_ENDPOINT` → Your Azure OpenAI endpoint
   - `AZURE_OPENAI_API_KEY` → Your Azure OpenAI API key
   - `AZURE_OPENAI_DEPLOYMENT_NAME` → `text-embedding-3-large-2`
   - `AZURE_OPENAI_API_VERSION` → `2023-05-15`
6. Click **Save** at the top

**Note:** Keep `DATABASE_URL` as `file:./dev.db` for now (or set to your SQL Server connection string if you want to use the SQL Server in K2).

## Step 5: Deploy!

**Automatic Deployment:**
```bash
git add .
git commit -m "Add Azure deployment configuration"
git push origin main
```

This will trigger GitHub Actions to build and deploy automatically.

**Manual Deployment:**
1. Go to: https://github.com/nkkrnkl/carepilot/actions
2. Select **Deploy Next.js to Azure Web App**
3. Click **Run workflow** → **Run workflow**

## Step 6: Verify Deployment

1. **Check GitHub Actions:**
   - Go to Actions tab
   - Wait for workflow to complete (green checkmark)

2. **Visit your app:**
   ```
   https://carepilot-2025.azurewebsites.net
   ```

3. **Check logs if needed:**
   ```bash
   az webapp log tail --name carepilot-2025 --resource-group K2
   ```

## Database Options

You have SQL Server resources in the K2 resource group:
- `k2sqldatabaseserver` (eastasia)
- `newk2sqldatabaseserver` (southeastasia)

**For Production:** Consider migrating from SQLite to SQL Server:
1. Update Prisma schema to use `sqlserver` provider
2. Get connection string from Azure Portal
3. Update `DATABASE_URL` in App Settings

## Quick Commands

```bash
# View app settings
az webapp config appsettings list --name carepilot-2025 --resource-group K2

# View logs
az webapp log tail --name carepilot-2025 --resource-group K2

# Restart app
az webapp restart --name carepilot-2025 --resource-group K2

# View app URL
echo "https://carepilot-2025.azurewebsites.net"
```

## Troubleshooting

If deployment fails:
1. Check GitHub Actions logs
2. Verify `AZURE_WEBAPP_PUBLISH_PROFILE` secret is set correctly
3. Verify app settings are configured
4. Check logs: `az webapp log tail --name carepilot-2025 --resource-group K2`

---

**You're almost there!** Complete steps 1-4, then push to main to deploy! 🚀

