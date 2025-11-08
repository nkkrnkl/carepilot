# Quick Deployment Guide - Azure App Service

Follow these steps to deploy your app right now.

## Step 1: Install Azure CLI

**On macOS:**
```bash
brew install azure-cli
```

**On Linux:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**On Windows:**
Download from: https://aka.ms/InstallAzureCLI

**Verify installation:**
```bash
az --version
```

## Step 2: Login to Azure

```bash
az login
```

This will open a browser for authentication. After login, verify:
```bash
az account show
```

**Optional:** If you have multiple subscriptions, set the active one:
```bash
az account list --output table
az account set --subscription "<SUBSCRIPTION_ID>"
```

## Step 3: Choose Your App Name

Your app name must be:
- Globally unique across all Azure
- Lowercase letters, numbers, and hyphens only
- 2-60 characters

**Example:** `carepilot-prod`, `carepilot-dev`, `carepilot-2024`

## Step 4: Provision Azure Resources

Run the provisioning script:

```bash
bash infra/azure_provision.sh -a <your-app-name> -r eastus
```

**Example:**
```bash
bash infra/azure_provision.sh -a carepilot-prod -r eastus
```

This will:
- Create a resource group
- Create an App Service Plan (Basic B1)
- Create the Web App
- Configure Node.js 20
- Set up startup command

**Note:** The script sets placeholder values for API keys. You'll update these later.

## Step 5: Get Publish Profile

After provisioning, get your publish profile:

**Option A: Azure Portal (Easiest)**
1. Go to https://portal.azure.com
2. Find your Web App (search for your app name)
3. Go to **Deployment Center** → **Manage publish profile**
4. Click **Get publish profile**
5. Copy the entire XML content

**Option B: Azure CLI**
```bash
az webapp deployment list-publishing-profiles \
  --resource-group <app-name>-rg \
  --name <app-name> \
  --xml
```

Copy the XML output.

## Step 6: Add GitHub Secret

1. Go to: https://github.com/nkkrnkl/carepilot/settings/secrets/actions
2. Click **New repository secret**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Paste the XML from Step 5
5. Click **Add secret**

## Step 7: (Optional) Set Repository Variable

1. Go to: https://github.com/nkkrnkl/carepilot/settings/variables/actions
2. Click **New repository variable**
3. Name: `AZURE_WEBAPP_NAME`
4. Value: Your app name (e.g., `carepilot-prod`)
5. Click **Add variable**

**Note:** If you skip this, update the workflow file to hardcode your app name.

## Step 8: Configure App Settings (API Keys)

You need to set your real API keys in Azure.

**Option A: Azure Portal**
1. Go to your Web App in Azure Portal
2. Navigate to **Configuration** → **Application settings**
3. Update these values:
   - `OPENAI_API_KEY` → Your OpenAI key
   - `PINECONE_API_KEY` → Your Pinecone key
   - `AZURE_OPENAI_ENDPOINT` → Your endpoint
   - `AZURE_OPENAI_API_KEY` → Your Azure OpenAI key
   - `DATABASE_URL` → Keep as `file:./dev.db` for now (or set PostgreSQL URL)
4. Click **Save**

**Option B: Use the script**
```bash
# Copy and edit the example
cp scripts/set-app-settings.example.sh scripts/set-app-settings.sh
nano scripts/set-app-settings.sh  # Edit with your values
bash scripts/set-app-settings.sh
```

## Step 9: Deploy!

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

## Step 10: Verify Deployment

1. **Check GitHub Actions:**
   - Go to Actions tab
   - Wait for workflow to complete (green checkmark)

2. **Visit your app:**
   ```
   https://<your-app-name>.azurewebsites.net
   ```

3. **Check logs if needed:**
   ```bash
   az webapp log tail --name <app-name> --resource-group <app-name>-rg
   ```

## Troubleshooting

### "App name already taken"
Choose a different name. Try adding numbers or your initials:
- `carepilot-prod-2024`
- `carepilot-nkkrnkl`

### "Resource group already exists"
The script is idempotent - it's safe to run again. Or delete the resource group:
```bash
az group delete --name <app-name>-rg --yes
```

### "Workflow fails in GitHub Actions"
1. Check the Actions logs for specific errors
2. Verify `AZURE_WEBAPP_PUBLISH_PROFILE` secret is set correctly
3. Verify `AZURE_WEBAPP_NAME` variable matches your app name
4. Check that app settings are configured

### "App returns 404"
- Check startup command is set: `bash ./azure/startup.sh`
- Verify PORT is being used correctly
- Check logs: `az webapp log tail`

### "Database errors"
Remember: SQLite on App Service is ephemeral. For production, migrate to PostgreSQL (see DEPLOYMENT.md).

## Quick Commands Reference

```bash
# List all your web apps
az webapp list --output table

# View app settings
az webapp config appsettings list --name <app-name> --resource-group <app-name>-rg

# View logs
az webapp log tail --name <app-name> --resource-group <app-name>-rg

# Restart app
az webapp restart --name <app-name> --resource-group <app-name>-rg

# Delete everything (careful!)
az group delete --name <app-name>-rg --yes
```

## Next Steps After Deployment

1. **Set up custom domain** (optional)
2. **Enable HTTPS only**
3. **Set up monitoring** (Application Insights)
4. **Migrate database** to PostgreSQL for production
5. **Set up staging environment** (separate app service)

---

**Need help?** Check DEPLOYMENT.md for detailed troubleshooting.

