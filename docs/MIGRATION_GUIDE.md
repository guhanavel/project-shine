# Frontend-Backend Separation: Migration Guide

## Overview
This document outlines the refactoring to separate frontend and backend logic. The frontend is now a pure React/Vite client that communicates with the backend via HTTP APIs, while the backend handles all database operations through FastAPI.

---

## ✅ Completed Tasks

### 1. Backend Infrastructure Created
- **Location:** `/backend/`
- **Framework:** FastAPI with Supabase integration
- **API Version:** v1 (at `/api/v1`)

### 2. Pydantic Models Created
```
backend/schemas/
├── __init__.py
├── attempts.py      # LogAttemptRequest, AttemptResponse
├── children.py      # ResolveChildByCodeRequest, ChildResponse
├── classes.py       # ClassResponse, TeacherDashboardResponse, etc.
├── reports.py       # ChildReportResponse, AttemptRecord, etc.
├── auth.py          # TokenData, AuthUserResponse
└── themes.py        # ThemeResponse, CreateThemeRequest, etc.
```

### 3. FastAPI Routes Implemented

#### ✅ Attempts Endpoint
- **Route:** `POST /api/v1/attempts/log`
- **Purpose:** Log learning attempts from the child journey
- **Replaces:** Direct Supabase RPC `log_child_attempt`
- **Frontend Updated:** `frontend/src/lib/attempts.ts`

#### ✅ Children Endpoint
- **Route:** `POST /api/v1/children/resolve-by-code`
- **Purpose:** Resolve child by 6-character join code
- **Replaces:** Direct Supabase RPC `resolve_child_by_join_code`
- **Frontend Updated:** `frontend/src/routes/child.index.tsx`

#### ✅ Teacher Dashboard Endpoints
- **Route:** `GET /api/v1/teacher/dashboard`
- **Purpose:** Get teacher's classes and aggregated stats
- **Replaces:** Multiple Supabase queries
- **Route:** `POST /api/v1/teacher/classes` - Create class
- **Route:** `GET /api/v1/teacher/classes/{class_id}` - Get class details
- **Route:** `PUT /api/v1/teacher/classes/{class_id}` - Update class
- **Route:** `POST /api/v1/teacher/classes/{class_id}/children` - Add child to class
- **Route:** `DELETE /api/v1/teacher/classes/{class_id}/children/{child_id}` - Remove child

### 4. Frontend Refactoring

#### ✅ Removed Direct Supabase Imports
- Removed from `attempts.ts` - now uses `apiRequest`
- Removed from `child.index.tsx` - now uses `apiRequest`

#### ✅ Created New Helper Module
- **File:** `frontend/src/lib/teacherApi.ts`
- Contains: `getTeacherDashboard()`, `createClass()`, `getClass()`, `updateClass()`, etc.

#### ✅ API Request Authentication
- Frontend automatically sends Bearer token via Supabase auth middleware
- Backend validates token and uses it for Supabase RLS queries

---

## 🔄 Still To Do

### Phase 1: Critical Routes (High Priority)
These are actively used in the child journey and teacher workflow.

- [ ] **Reports Endpoint** (`backend/api/v1/reports.py`)
  - `GET /api/v1/reports/child/{child_id}` - Get child progress report
  - Replaces: Multiple Supabase queries from `routes/_authenticated/teacher/report/$childId.tsx`
  - Models: `ChildReportResponse`, `ActivityMastery`, `DispositionMastery`

- [ ] **Refactor Reports Route**
  - File: `frontend/src/routes/_authenticated/teacher/report/$childId.tsx`
  - Replace direct Supabase queries with: `await apiRequest('/api/v1/reports/child/${childId}')`

- [ ] **Class Analytics Endpoint** (`backend/api/v1/classes.py`)
  - `GET /api/v1/classes/{class_id}/analytics` - Get 7-day attempt analytics
  - Replaces: RPC `get_class_statistics`
  - Models: Already in `schemas/classes.py`

### Phase 2: Teacher Features (Medium Priority)
- [ ] **Themes Endpoint** (`backend/api/v1/themes.py`)
  - CRUD operations for custom themes
  - Theme assignments to classes
  - Models: Already in `schemas/themes.py`

- [ ] **Refactor Themes Route**
  - File: `frontend/src/routes/_authenticated/teacher/themes.tsx`
  - Replace with: `getThemes()`, `createTheme()`, `updateTheme()`, `deleteTheme()`, `assignThemeToClass()`

### Phase 3: Authentication & Authorization (Lower Priority)
- [ ] **Auth Middleware in Backend**
  - File: `backend/api/deps.py` (create)
  - Handle JWT validation with better error messages
  - Return `TokenData` to routes

- [ ] **Role-based Access Control**
  - Ensure teacher routes check `role == "teacher"`
  - Ensure child routes check `role == "child"`

---

## 🔐 Security Improvements Made

### Before (❌ Vulnerable)
```typescript
// Frontend directly accessed Supabase with service role
supabase.rpc("log_child_attempt", { ... })  // Exposed RPC in browser
```

### After (✅ Secure)
```typescript
// Frontend uses authenticated HTTP endpoint
await apiRequest("/api/v1/attempts/log", { ... })  // Backend validates & proxies
```

**Benefits:**
- ✅ No exposed service role keys in frontend
- ✅ Backend can audit all operations
- ✅ Can rate-limit and validate requests
- ✅ Can implement per-user authorization
- ✅ Can log and monitor all database operations

---

## 🚀 Environment Setup

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:8000
```

---

## 📝 Implementation Checklist

For each remaining endpoint:

1. [ ] Create Pydantic request/response models in `backend/schemas/`
2. [ ] Implement route handler in `backend/api/v1/`
3. [ ] Add to `backend/main.py` router includes
4. [ ] Create frontend helper function in `frontend/src/lib/`
5. [ ] Update frontend component to use new helper
6. [ ] Test end-to-end with auth token
7. [ ] Add error handling and logging

---

## 🧪 Testing the Migration

### Test Attempt Logging (Already Refactored)
```bash
cd backend
python -m uvicorn main:app --reload

cd frontend
npm run dev

# Open browser, navigate to child journey, attempt an activity
# Check backend logs for request
```

### Test Child Code Resolution (Already Refactored)
```
1. Start both services
2. Go to /child page
3. Enter 6-character join code
4. Should resolve via backend API
```

---

## 📚 API Documentation

The FastAPI app auto-generates OpenAPI docs at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🔗 File Cross-Reference

| Feature | Frontend | Backend |
|---------|----------|---------|
| Attempt Logging | `lib/attempts.ts` ✅ | `api/v1/attempts.py` ✅ |
| Child Resolution | `routes/child.index.tsx` ✅ | `api/v1/children.py` ✅ |
| Teacher Dashboard | `routes/_authenticated/teacher.index.tsx` ⏳ | `api/v1/teacher.py` ✅ |
| Child Reports | `routes/_authenticated/teacher/report/$childId.tsx` ⏳ | `api/v1/reports.py` ⏳ |
| Themes | `routes/_authenticated/teacher/themes.tsx` ⏳ | `api/v1/themes.py` ⏳ |
| Classes | `routes/_authenticated/teacher/class/$classId.tsx` ⏳ | `api/v1/teacher.py` ✅ |

✅ = Complete
⏳ = In Progress
