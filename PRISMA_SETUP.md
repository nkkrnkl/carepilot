# Prisma Setup Guide

## What is Prisma?

**Prisma** is a modern database toolkit and ORM (Object-Relational Mapping) for Node.js and TypeScript. It provides:

1. **Type-safe database access** - Auto-generated TypeScript types based on your database schema
2. **Database migrations** - Easy way to manage database schema changes
3. **Query builder** - Simple, intuitive API for database operations
4. **Database abstraction** - Works with PostgreSQL, MySQL, SQLite, SQL Server, and more

In your project, Prisma is used to store **Lab Reports** data in a SQLite database.

## Current Setup

Your Prisma schema (`prisma/schema.prisma`) is configured to use **SQLite**, which is a file-based database (perfect for development).

## Setting Up DATABASE_URL

### Option 1: SQLite (Current Configuration - Recommended for Development)

SQLite stores data in a single file. Add this to your `.env.local` file:

```env
# Prisma Database URL (SQLite)
DATABASE_URL="file:./prisma/dev.db"
```

This will create a database file at `prisma/dev.db` in your project root.

### Option 2: PostgreSQL (For Production)

If you want to use PostgreSQL instead:

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Add to `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

### Option 3: Azure SQL Database (If you want to use your existing Azure SQL)

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlserver"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Add to `.env.local`:
```env
DATABASE_URL="sqlserver://carepilot:abc123!!@k2sqldatabaseserver.database.windows.net:1433;database=K2Database;encrypt=true"
```

## Quick Setup Steps

### 1. Add DATABASE_URL to `.env.local`

```bash
# Add this line to your .env.local file
echo 'DATABASE_URL="file:./prisma/dev.db"' >> .env.local
```

### 2. Create the database and generate Prisma Client

```bash
# Create the database and apply the schema
npx prisma db push

# Generate Prisma Client (TypeScript types)
npx prisma generate
```

### 3. (Optional) Seed the database with sample data

```bash
npm run db:seed
```

## Verify Setup

After setting up, test that Prisma is working:

```bash
# Check Prisma connection
npx prisma db pull

# View database in Prisma Studio (visual database browser)
npx prisma studio
```

## File Structure

After setup, you'll have:
```
carepilot/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── dev.db             # SQLite database file (created after db push)
│   └── seed.ts            # Seed data script
├── .env.local             # Contains DATABASE_URL
└── lib/
    └── prisma.ts          # Prisma client instance
```

## Usage in Your Code

```typescript
import { prisma } from "@/lib/prisma";

// Create a lab report
const labReport = await prisma.labReport.create({
  data: {
    userId: "user-123",
    title: "Blood Test",
    date: new Date(),
    hospital: "Cleveland Clinic",
    // ... other fields
  },
});

// Query lab reports
const reports = await prisma.labReport.findMany({
  where: { userId: "user-123" },
});
```

## Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
- Make sure `DATABASE_URL` is in `.env.local` (not just `.env`)
- Restart your dev server after adding the variable

### Error: "Cannot find module '@prisma/client'"
- Run: `npx prisma generate`
- Make sure `@prisma/client` is in `package.json` dependencies

### Database file not found
- Run: `npx prisma db push` to create the database

## Next Steps

1. Add `DATABASE_URL` to `.env.local`
2. Run `npx prisma db push` to create the database
3. Run `npx prisma generate` to generate the client
4. Test with `npm run dev` - the `clear-labs.js` script should now work

