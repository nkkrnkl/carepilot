# Azure Storage Commands Reference

Quick reference for Azure Storage commands used in CarePilot project.

## Storage Account Info

- **Account Name**: `hackstoragexz`
- **Subscription ID**: `41f56be4-b097-45ca-b7a6-b064a0c7189e`

## Container Operations

### List Containers

**Azure CLI:**
```bash
az storage container list \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

**Node.js Script:**
```bash
npm run list-containers
```

### Create Container

**Azure CLI:**
```bash
az storage container create \
  --name carepilot-data \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e \
  --public-access blob
```

**Node.js (automatic):**
The upload script automatically creates the container if it doesn't exist.

### Delete Container

```bash
az storage container delete \
  --name carepilot-data \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

## Blob Operations

### List Blobs in Container

```bash
az storage blob list \
  --container-name carepilot-data \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e \
  --output table
```

### Upload Blob

```bash
az storage blob upload \
  --file data/doctors.json \
  --container-name carepilot-data \
  --name doctors.json \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e \
  --content-type application/json
```

### Download Blob

```bash
az storage blob download \
  --container-name carepilot-data \
  --name doctors.json \
  --file data/doctors-backup.json \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

### Delete Blob

```bash
az storage blob delete \
  --container-name carepilot-data \
  --name doctors.json \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

### Get Blob URL

```bash
az storage blob url \
  --container-name carepilot-data \
  --name doctors.json \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

## Account Operations

### Get Storage Account Keys

```bash
az storage account keys list \
  --account-name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

### Get Connection String

```bash
az storage account show-connection-string \
  --name hackstoragexz \
  --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

## NPM Scripts

### Generate Mock Doctors Data
```bash
npm run generate-doctors
```

### Upload Doctors to Azure
```bash
npm run upload-doctors
```

### List Containers
```bash
npm run list-containers
```

## Helper Scripts

### Azure CLI Helper
```bash
./scripts/azure-cli-helper.sh
```

## Notes

- All Azure CLI commands require the Azure CLI to be installed and logged in
- Node.js scripts require the connection string to be set in `.env` file
- Container names are case-sensitive
- Blob names are case-sensitive

## Troubleshooting

### Azure CLI Not Installed
Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli

### Not Logged In
```bash
az login
```

### Wrong Subscription
```bash
az account set --subscription 41f56be4-b097-45ca-b7a6-b064a0c7189e
```

### Permission Denied
Make sure you have the necessary permissions on the storage account:
- Storage Blob Data Contributor
- Storage Account Contributor

