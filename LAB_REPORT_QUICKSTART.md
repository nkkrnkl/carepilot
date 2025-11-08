# Lab Report Feature - Quick Start Guide

## Prerequisites

1. **Node.js** and **npm** installed
2. **Python 3.8+** installed
3. **Environment variables** configured

## Step 1: Set Up Environment Variables

Create or update `.env.local` in the project root with:

```env
# OpenAI (for PDF extraction)
OPENAI_API_KEY=your_openai_api_key

# Azure OpenAI (for embeddings - same as CLAIMS)
AZURE_OPENAI_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_DEPLOYMENT_NAME=text-embedding-3-large-2
AZURE_OPENAI_API_VERSION=2023-05-15

# Pinecone (same as CLAIMS)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=care-pilot

# Database
DATABASE_URL="file:./dev.db"
```

## Step 2: Install Dependencies

### Node.js Dependencies
```bash
npm install
```

### Python Dependencies
```bash
cd backend
pip install -r requirements.txt
# Or from root:
pip install -r backend/requirements.txt
```

## Step 3: Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Create database and tables
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

## Step 4: Make Python Script Executable

```bash
chmod +x backend/scripts/upload_lab_report.py
```

## Step 5: Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 6: Navigate to Lab Reports Page

Open your browser and go to:
```
http://localhost:3000/features/lab-analysis
```

## Testing the Feature

1. **Upload a PDF**: Click "Upload PDF" or drag-and-drop a lab report PDF
2. **View Current Data**: After upload, the "Current Data" tab shows extracted fields
3. **View Previous Reports**: Right panel lists all uploaded reports
4. **View Past Visits**: Upload 2+ reports with same parameters to see time-series charts

## Troubleshooting

### "Couldn't parse this file" Error
- Ensure the PDF is clear and readable
- Check that `OPENAI_API_KEY` is set correctly
- Try a different PDF or convert to PNG/JPG

### Pinecone Upload Fails
- Verify `PINECONE_API_KEY` is correct
- Check that `PINECONE_INDEX_NAME` matches your index
- Ensure Azure OpenAI credentials are set for embeddings
- The database record will still be saved even if Pinecone fails

### Python Script Errors
- Ensure Python 3.8+ is installed: `python3 --version`
- Check Python dependencies: `pip install -r backend/requirements.txt`
- Verify the script is executable: `chmod +x backend/scripts/upload_lab_report.py`
- Check Python path in `lib/python-bridge.ts` matches your setup

### Database Errors
- Run `npx prisma generate` to regenerate the client
- Run `npm run db:push` to sync the schema
- Check that `DATABASE_URL` is set in `.env.local`

## File Structure

```
app/
  features/
    lab-analysis/
      page.tsx           # Main page
  api/
    labs/
      upload/route.ts    # Upload endpoint
      list/route.ts       # List reports
      get/route.ts        # Get single report

backend/
  scripts/
    upload_lab_report.py  # Python script (calls Pinecone)

components/
  labs/
    UploadDropzone.tsx    # Upload component
    PreviousReports.tsx   # Reports list
    CurrentDataCards.tsx  # Data display
    PastVisitsCharts.tsx  # Charts
```

## Next Steps

- Upload multiple lab reports to see time-series trends
- Click the eye icon on previous reports to view them
- Check the "Past Visits" tab after uploading 2+ reports with matching parameters

