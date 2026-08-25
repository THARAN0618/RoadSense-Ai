# 🛣️ RoadSense AI - Intelligent Pothole Reporting & Infrastructure Management System

RoadSense AI is a production-grade, full-stack civic technology platform designed to streamline pothole reporting, automated severity analysis, authority triage, and field worker repair management.

---

## 🌟 Key Features

### 👤 Citizen Portal
- **Interactive Pothole Reporting**: Upload pothole photos, pin precise locations on an interactive Leaflet/OpenStreetMap interface, and include descriptions.
- **AI-Assisted Severity Estimation**: Automated estimation of pothole depth, surface risk, and priority score upon submission.
- **Real-Time Status Tracking**: Live visual timeline tracking reports through `SUBMITTED` ➔ `VERIFIED` ➔ `ASSIGNED` ➔ `IN_REPAIR` ➔ `REPAIRED`.
- **Community Interaction**: Comment on public reports and receive instant notifications on status updates.

### 🏛️ Municipal Authority Dashboard
- **Geographic & Priority Triage**: View all reported potholes on a color-coded interactive map clustered by priority score (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Verification & Priority Override**: Review AI severity scores with human-in-the-loop override capability and structured reasoning logs.
- **Field Worker Dispatch**: Assign verified reports directly to active field workers based on jurisdiction and workload.

### 👷 Field Worker Portal
- **Task Management**: Access assigned repair tasks with route coordinates and priority details.
- **Workflow Progression**: Transition jobs from `ACCEPTED` to `IN_PROGRESS` and complete them with required **before/after repair verification photos**.

### 🛡️ Admin & Analytics Suite
- **User Role Management**: Manage access controls and assign roles (`CITIZEN`, `AUTHORITY`, `FIELD_WORKER`, `ADMIN`).
- **System Analytics**: Track average resolution times, geographic hot-spots, and monthly repair completion metrics.
- **Audit Logging**: Full audit trail tracking every status change, priority override, and user action for compliance.

---

## 🏗️ System Architecture & Tech Stack

```
[ Frontend (Vite + React + Tailwind + Leaflet) ]
                        │
                  HTTP / REST (JWT Cookies)
                        │
  [ Backend (Express + TypeScript + Prisma ORM) ]
                 │                    │
          [ SQLite DB ]        [ AI Severity Engine ]
```

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet / React-Leaflet, Recharts, React Query.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT (HTTP-Only Cookies), Multer (Image Uploads), Zod (Validation), BcryptJS.
- **Database**: SQLite (configured for zero-dependency local runs and quick deployment).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### Option 1: Run Both Frontend & Backend with a Single Command (Recommended)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Database & Seed Demo Data**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. **Start Applications Concurrently**:
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:5173`
   - **Backend REST API**: `http://localhost:5000/api`

---

### Option 2: Run Backend & Frontend Separately

#### Backend Setup
```bash
cd backend
npm install
npm run prisma:db:push
npm run db:seed
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Pre-Seeded Demo Accounts

The database comes pre-seeded with test accounts for all roles (Default Password for all accounts: **`Password123!`**):

| Role | Email | Password | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@roadsense.ai` | `Password123!` | System configuration, audit logs, user role management |
| **Authority** | `authority@roadsense.ai` | `Password123!` | Verify reports, override priorities, dispatch field workers |
| **Field Worker** | `worker1@roadsense.ai` | `Password123!` | View assigned jobs, update repair status, upload proof |
| **Citizen** | `citizen1@roadsense.ai` | `Password123!` | Report potholes, view interactive map, track progress |

---

## 🧪 Testing & Verification

Run the backend integration test suite:
```bash
npm run test:backend
# or
cd backend && npm test
```

Build verification for production:
```bash
npm run build
```

---

## 📚 REST API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | Register new citizen account |
| **POST** | `/api/auth/login` | Public | Authenticate user & set HTTP-only JWT cookie |
| **GET** | `/api/auth/me` | Authenticated | Fetch current user profile & role |
| **POST** | `/api/auth/logout` | Authenticated | Clear authentication session |
| **GET** | `/api/reports` | Public/Auth | List reports with search, filter, and pagination |
| **POST** | `/api/reports` | Citizen/Auth | Submit new pothole report with photo upload |
| **PATCH** | `/api/reports/:id/verify` | Authority/Admin | Verify/reject report and assign priority |
| **PATCH** | `/api/reports/:id/assign` | Authority/Admin | Assign field worker to verified report |
| **PATCH** | `/api/reports/:id/status` | Worker/Authority | Update repair workflow status with proof photos |
| **GET** | `/api/admin/users` | Admin | Manage user roles and system access |
| **GET** | `/api/admin/audit-logs` | Admin | View system audit trail |

---

## 📄 License
This project is licensed under the MIT License.
