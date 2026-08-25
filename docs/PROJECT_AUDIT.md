# RoadSense AI — Comprehensive Project Audit Report

**Date:** August 25, 2026  
**Auditor:** Senior Engineering Team  
**Scope:** Frontend, Backend, Database Schema, Authentication, RBAC, AI Services, File Storage, Security, API Contracts, and Deployment Readiness.

---

## 1. Executive Summary

RoadSense AI is a full-stack, state-machine driven pothole reporting and maintenance management platform built with React, Vite, Node.js, Express, TypeScript, and Prisma ORM.

The core architecture, RBAC model, priority calculation engine, and user interfaces are **exceptionally clean, well-structured, and functionally solid**. However, several **critical deployment blockers and architectural gaps** must be addressed before migrating to production on **Vercel + Render + Supabase PostgreSQL + Supabase Storage**.

---

## 2. Detailed Audit Breakdown

### A. Current Architecture
- **Monorepo Runner:** Root `package.json` utilizing `concurrently` to execute frontend (port 3000) and backend (port 5000).
- **Frontend Stack:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet/React-Leaflet, Recharts.
- **Backend Stack:** Node.js, Express, TypeScript, Prisma ORM, Multer, Zod, BcryptJS, JSONWebToken, Cookie-Parser, Helmet.
- **Database Layer:** Prisma configured with `mysql` provider targeting a local MySQL database (`roadsense_db`).
- **File Storage:** Local disk storage (`./uploads`) served statically via Express (`/uploads`).
- **AI & Priority Engine:** Abstracted AI service with deterministic text/metadata fallback rules + explainable mathematical priority scoring formula.

---

### B. Working Features
1. **User Authentication & RBAC:**
   - User registration and login with bcrypt password hashing (10 rounds).
   - HTTP-only cookie-based JWT session token with fallback Authorization header.
   - Strict server-side role enforcement (`CITIZEN`, `FIELD_WORKER`, `AUTHORITY`, `ADMIN`).
   - Active account status verification (`isActive`) on every authenticated request.
2. **Citizen Workflow:**
   - Submit new pothole reports with titles, descriptions, coordinates (lat/lng), address, and image uploads.
   - View citizen dashboard with personal report tracking and detailed modal view.
   - IDOR protection preventing citizens from viewing or modifying other users' reports.
3. **AI & Explainable Priority Engine:**
   - Multi-factor priority formula balancing Severity (55%), AI Confidence (20%), Location Impact (15%), and Unresolved Age (10%).
   - Generates human-readable, auditable priority explanations.
   - AI service abstraction supporting external API vision providers with fallback rule-based analysis.
4. **Authority Workflow:**
   - Review submitted reports, verify reports, or reject with reason.
   - Human-in-the-Loop Priority Override (preserves original `aiPriority` and `aiSeverity` for auditability).
   - Assign field workers to verified jobs with instant notification triggers.
5. **Field Worker Workflow:**
   - View assigned repair jobs sorted by priority score.
   - Accept jobs, initiate repairs (with before-repair image evidence), and mark jobs as `REPAIRED` (requiring after-repair image evidence and notes).
6. **Admin & Analytics Workflow:**
   - User management (deactivate/activate accounts, change user roles).
   - Structured JSON Audit Logging for all state transitions, user logins, overrides, and repair updates.
   - Real-time analytical dashboard with count metrics, severity breakdowns, status distributions, and average repair turnaround hours.

---

### C. Broken / Incomplete Features & Technical Debt
1. **Local Filesystem Uploads:**
   - Images are currently uploaded to local disk storage (`./uploads`) via Multer `diskStorage`.
   - On serverless/containerized platforms (Vercel & Render), local disk storage is ephemeral. Uploaded files will be lost on container restart or instance scale.
2. **MySQL Prisma Provider:**
   - Prisma schema is currently configured for `provider = "mysql"`. Production requires `provider = "postgresql"` for Supabase.
3. **Hardcoded Fallback JWT Secrets & Credentials:**
   - `auth.ts` and `authController.ts` contain fallback strings: `'roadsense_ai_super_secret_jwt_key_2026'`.
   - `backend/.env` contains local MySQL connection string `mysql://root:tharanmaha@localhost:3306/roadsense_db`.
4. **Import Extensions:**
   - `auditService.ts` and `notificationService.ts` use explicit `.js` import extensions (`import { prisma } from '../config/prisma.js'`).
5. **No Centralized Supabase Client:**
   - Missing Supabase SDK initialization for database and object storage integration.

---

### D. Security Evaluation
| Risk Level | Item | Description | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | Production Database Credentials | `.env` currently references local MySQL credentials. | Migrate to Supabase PostgreSQL pooled connection URI. |
| **HIGH** | Static File Storage Security | Local `./uploads` folder exposed publicly without access control. | Migrate to Supabase Storage with signed or public bucket policies. |
| **MEDIUM** | Hardcoded Fallback Secrets | Default JWT secret fallback hardcoded in middleware. | Enforce mandatory environment variable validation on server startup. |
| **LOW** | Rate Limiting | Auth routes (`/login`, `/register`) currently lack rate-limiting middleware. | Implement `express-rate-limit` on sensitive auth routes. |

---

### E. Database Migration Audit (MySQL → Supabase PostgreSQL)
- **Schema Compatibility:**
  - `@db.Text` annotations in `schema.prisma` are valid in PostgreSQL.
  - Model relations, foreign key cascades (`onDelete: Cascade`), default functions (`uuid()`, `now()`), and indexes are 100% compatible with PostgreSQL.
- **Provider Switch:**
  - `datasource db { provider = "postgresql" url = env("DATABASE_URL") }`
- **Migration Plan:**
  - Generate clean PostgreSQL Prisma migration scripts and validate via `npx prisma validate`.

---

### F. Deployment Blockers
1. **Prisma Provider mismatch (MySQL vs Supabase PostgreSQL).**
2. **Local filesystem storage (`./uploads`) incompatible with cloud hosting.**
3. **Missing Supabase environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).**
4. **`VITE_API_BASE_URL` hardcoded to `http://localhost:5000/api` in `frontend/.env`.**
5. **Missing production CORS origin configuration for Vercel deployment URL.**

---

### G. Recommended Order of Fixes (Master Execution Plan)

1. **Phase 1: Architecture Definition** (`docs/ARCHITECTURE.md`)
2. **Phase 2: Database Migration to Supabase PostgreSQL** (`schema.prisma` & `docs/DATABASE.md`)
3. **Phase 3: Supabase Storage Integration** (Backend Multer -> Supabase Storage upload service)
4. **Phase 4: Backend Security Hardening** (Startup env validation, CORS, Rate limiting, JWT enforcement)
5. **Phase 5: Frontend Production Readiness & API Client Tuning** (Relative API pathing, Vercel config)
6. **Phase 6: E2E Integration & Verification Testing** (Automated backend tests & manual workflow simulation)
7. **Phase 7: Deployment Configuration & Final Documentation** (`docs/ENVIRONMENT.md`, `docs/FINAL_STATUS.md`)

---
