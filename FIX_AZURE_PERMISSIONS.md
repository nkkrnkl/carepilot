# Fix Azure Permissions Issue

You're logged in but don't have permissions to create resources. Here's how to fix it:

## Option 1: Accept the Azure AD Invitation (If Not Done)

1. **Check your email** for the invitation from `aymaaniliyasgmail.onmicrosoft.com`
2. **Click the acceptance link** in the email
3. **Or visit:** https://portal.azure.com/5150cfe2-8dbd-4323-8154-395f40c9fdbd
4. **Accept the invitation** to join the organization

## Option 2: Request Access from Subscription Owner

You need to be assigned a role on the subscription. Ask the person who gave you Azure credits to:

1. Go to Azure Portal → Subscriptions → "Visual Studio Enterprise Subscription"
2. Click **Access control (IAM)**
3. Click **Add** → **Add role assignment**
4. Role: **Contributor** (or **Owner** for full access)
5. Assign access to: **User, group, or service principal**
6. Select: Your email (`ab3299@cornell.edu`)
7. Click **Save**

## Option 3: Refresh Your Azure Session

Sometimes permissions take time to propagate. Try:

```bash
# Log out
az logout

# Log back in
az login

# Switch to the correct subscription
az account set --subscription "41f56be4-b097-45ca-b7a6-b064a0c7189e"

# Verify
az account show
```

## Option 4: Use Azure Portal to Create Resources

If CLI permissions are still an issue, you can create resources via the portal:

1. Go to: https://portal.azure.com
2. Make sure you're in the "Visual Studio Enterprise Subscription"
3. Create resources manually:
   - Resource Group
   - App Service Plan
   - Web App

Then use GitHub Actions for deployment (it uses publish profile, not CLI permissions).

## Quick Test After Fixing Permissions

Once you have permissions, test with:

```bash
# Test creating a resource group
az group create --name test-rg --location eastus

# If successful, delete it
az group delete --name test-rg --yes

# Then run the provisioning script
bash infra/azure_provision.sh -a carepilot-2025 -r eastus
```

## Current Status

- ✅ Subscription: Visual Studio Enterprise Subscription (41f56be4...)
- ✅ Tenant: aymaaniliyasgmail.onmicrosoft.com (5150cfe2...)
- ❌ Permissions: Missing Contributor/Owner role

## Next Steps

1. **Contact the subscription owner** to grant you "Contributor" role
2. **Or accept the invitation** if you haven't already
3. **Refresh your session** with `az logout && az login`
4. **Retry the provisioning script**

