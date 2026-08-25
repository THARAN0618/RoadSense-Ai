# RoadSense AI — Database Architecture & Supabase PostgreSQL Migration Guide

## 1. Overview & Provider Architecture

| Setting | Initial Development | Target Production |
| :--- | :--- | :--- |
| **Database Engine** | MySQL (Local) | Supabase PostgreSQL |
| **ORM** | Prisma ORM | Prisma ORM |
| **Prisma Provider** | `provider = "mysql"` | `provider = "postgresql"` |
| **Connection Pooling** | N/A | Supported via Supabase Transaction Pooler (Port 6543) |

---

## 2. Prisma Schema (`prisma/schema.prisma`) Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```a

---

## 3. Required Environment Variables

### Production (`backend/.env` / Render / Supabase)
```env
# Direct or Pooled Connection URI from Supabase Dashboard
# Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL="postgresql://postgres:YOUR_SUPABASE_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?schema=public"
```

---

## 4. Migration & Deployment Workflow

### Initial Migration Setup for New Supabase Database
1. Set `DATABASE_URL` in backend `.env` pointing to your Supabase PostgreSQL instance.
2. Run non-destructive migration deploy command:
   ```bash
   npx prisma migrate deploy
   ```
   *(This applies all SQL scripts in `prisma/migrations` to the target database without data loss).*

3. Generate updated Prisma Client:
   ```bash
   npx prisma generate
   ```

---

## 5. Database Seeding Procedure

To seed the initial demo accounts (`ADMIN`, `AUTHORITY`, `FIELD_WORKER`, `CITIZEN`) and sample pothole reports:

```bash
npm run db:seed
```

> **WARNING:** `seed.ts` deletes existing test records before populating demo data. **Never run `npm run db:seed` against a live production database with real citizen reports.**

---

## 6. Safety & Rollback Warnings
- 🚫 **NEVER** run `prisma db push --force-reset` on production database instances.
- 🚫 **NEVER** expose database passwords or pooled connection URIs in frontend code or Git repositories.
- 🔒 Always enable connection pooling (`pgbouncer=true` or Supabase Transaction Pooler) when deploying on Render to avoid exhausting serverless/container connection limits.
