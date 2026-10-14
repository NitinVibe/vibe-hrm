# Vibe HRM — Enterprise Human Resource Management System

Vibe HRM is a modern, full-stack multi-tenant human resources and payroll management platform designed for growing organizations. Built with a React/TypeScript Single Page Application (SPA) frontend and a Python/FastAPI/SQLAlchemy/PostgreSQL backend.

---

## Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │          React 19 + TypeScript          │
                      │   (Tailwind CSS, Vite, Lucide Icons)    │
                      └────────────────────┬────────────────────┘
                                           │ HTTP / JSON (JWT)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          FastAPI REST API v1            │
                      │  (Pydantic v2, Python-Jose, Bcrypt)     │
                      └────────────────────┬────────────────────┘
                                           │ SQLAlchemy 2.0
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │           PostgreSQL Database           │
                      │   (Alembic Migrations, Composite FKs)   │
                      └─────────────────────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7.
- **Backend**: FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Alembic, PostgreSQL.
- **Authentication**: JWT Bearer token authentication with role-based access control (`SUPER_ADMIN`, `ORG_ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`).
- **Multi-Tenancy**: Complete tenant boundary enforcement at both application service and database constraint levels via composite foreign keys `(organization_id, ...)`.

---

## Core Modules & Capabilities

1. **Identity & Access Management**: Secure login, session persistence, role verification, and access guardrails.
2. **Organization Structure**: Hierarchical department and designation trees with cross-tenant isolation and assignment compatibility constraints.
3. **Employee Directory**: Full employee lifecycle management, employment status tracking, and department/designation/shift linkages.
4. **Shift & Attendance Management**: Configurable shift schedules, grace periods, self-service check-in/out, automated lateness calculations, and working duration computation.
5. **Payroll Administration**:
   - Customizable employee salary structures (Basic, Allowances, Deductions, Payment Methods).
   - Monthly payroll runs with duplicate period prevention.
   - Batch calculation and individual payslip generation with itemized breakdowns.
   - Strict 4-stage lifecycle transition machine: `DRAFT` $\to$ `PROCESSED` $\to$ `APPROVED` $\to$ `PAID`.
   - Employee self-service salary structure view and payslip history.

---

## Prerequisites

- **Node.js**: >= 20.x
- **Python**: >= 3.11 (tested on 3.12)
- **PostgreSQL**: >= 15.x (tested on 18.x)
- **Google Chrome**: (Optional, required only for headless browser smoke tests)

---

## Environment Configuration

### 1. Backend (`backend/.env`)
Create a `.env` file inside the `backend` directory:

```env
APP_NAME="Vibe HRM"
APP_ENV=development
DEBUG=True

DATABASE_URL=postgresql+psycopg://hrm_user:your_password@localhost:5432/hrm_db

JWT_SECRET_KEY=your-secure-random-secret-key-at-least-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 2. Frontend (`.env`)
Create a `.env` file in the project root:

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Database Setup & Migrations

### Current Database Head
The database migration chain is fully managed by Alembic. The current verified head is:
- **Revision ID**: `c3a9d28e71b4` (`add_payroll_tables`)

### Applying Migrations
From the `backend` directory:
```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run migrations to head
alembic upgrade head

# Verify current revision
alembic current
```

### Database Backup & Restoration Procedure

#### 1. Creating a Non-Destructive Backup
Always generate a verified backup before performing schema alterations or deployments:
```powershell
$env:PGPASSWORD = "your_db_password"
pg_dump -h localhost -p 5432 -U hrm_user -d hrm_db -f "D:\vibe_hrm_backups\hrm_db_backup.sql"
Remove-Item Env:PGPASSWORD
```

#### 2. Safe Restoration Procedure
To restore a backup into a fresh or recovery database without corrupting live data:
```powershell
# 1. Create a dedicated restore/staging database
psql -U postgres -h localhost -c "CREATE DATABASE hrm_db_staging;"

# 2. Grant permissions to runtime role
psql -U postgres -h localhost -c "GRANT ALL PRIVILEGES ON DATABASE hrm_db_staging TO hrm_user;"

# 3. Restore the SQL dump into the staging database
$env:PGPASSWORD = "your_db_password"
psql -U hrm_user -h localhost -d hrm_db_staging -f "D:\vibe_hrm_backups\hrm_db_backup.sql"
Remove-Item Env:PGPASSWORD

# 4. Verify Alembic revision in the restored database
$env:DATABASE_URL = "postgresql+psycopg://hrm_user:your_password@localhost:5432/hrm_db_staging"
alembic current
```

---

## Starting the Application

### 1. Start the Backend API Server
From `backend`:
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API endpoints will be live at `http://127.0.0.1:8000`.
- OpenAPI Documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`
- Database connectivity: `http://127.0.0.1:8000/health/db`

### 2. Start the Frontend Development Server
From project root:
```powershell
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## Running Automated & Verification Tests

### 1. Backend Automated Unit & Integration Suite (102 Tests)
From `backend`:
```powershell
.\.venv\Scripts\Activate.ps1
python -m unittest discover -s tests -v
```

### 2. Frontend Linter
From project root:
```powershell
npx oxlint
```

### 3. Frontend Production Build Check
From project root:
```powershell
npm run build
```

### 4. Cross-Module API Smoke Test
Verifies end-to-end multi-module flows with database rollback/teardown against live PostgreSQL:
```powershell
python "C:\Users\PC\.gemini\antigravity\brain\1a833f72-9a31-425c-b977-bb94a68e1cdf\scratch\smoke_test_full_app.py"
```

### 5. Genuine Headless Chrome Browser Smoke Test
Runs actual Google Chrome headlessly via Chrome DevTools Protocol (CDP) to test unauthenticated route guards, login error alerts, valid login, department/designation creation, shifts, employee provisioning, attendance check-in/out, payroll run processing/approval/payment, and employee payslips:
```powershell
backend\.venv\Scripts\python.exe "C:\Users\PC\.gemini\antigravity\brain\1a833f72-9a31-425c-b977-bb94a68e1cdf\scratch\browser_smoke_test.py"
```

---

## Staging & Production Deployment Guidelines

1. **Reverse Proxy & HTTPS**: Deploy behind Nginx or AWS ALB terminating TLS/HTTPS.
2. **Environment Variables**:
   - Set `DEBUG=False` and `APP_ENV=production`.
   - Generate a cryptographically strong `JWT_SECRET_KEY` (e.g., `openssl rand -hex 32`).
   - Configure `CORS_ORIGINS` to match the exact production domain(s).
3. **Database Security**:
   - Restrict PostgreSQL network listener to internal VPC/private subnet.
   - Run runtime application using `hrm_user` (principle of least privilege).
4. **Static Frontend Hosting**:
   - The output of `npm run build` (`dist/` directory) can be served directly via Nginx, Cloudflare Pages, S3/CloudFront, or Firebase Hosting.

---

## Known Limitations & Future Roadmap

The current version of Vibe HRM delivers verified core HR, Attendance, and Payroll workflows. The following enterprise features are acknowledged limitations and slated for subsequent versions:

1. **Statutory Tax & Compliance Engine**:
   - Payroll calculations use standard gross and net formulas:
     $$\text{Gross} = \text{Basic} + \sum \text{Allowances}$$
     $$\text{Net} = \max(0, \text{Gross} - \sum \text{Deductions})$$
   - Country-specific statutory formulas (e.g., Indian EPF, ESI, TDS progressive slabs, Professional Tax, US 401(k), FICA, W-4) are not automated and should currently be configured as user-defined deductions.
2. **Attendance & Leave Balance Synchronization**:
   - While Attendance records and Leave modules have independent interfaces, approved leave requests do not yet automatically seed half-day/absent attendance statuses.
3. **Direct Banking Integration**:
   - Payroll runs mark payslips as `PAID`, but automated generation of NACH/NEFT/SEPA direct bank transfer clearing files is not yet implemented.
4. **Automated Payslip PDF Delivery**:
   - Payslips are accessible interactively in employee self-service; automatic bulk email dispatch of password-protected PDF attachments is scheduled for a future release.
