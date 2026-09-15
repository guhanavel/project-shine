# Frontend-Backend Separation: Quick Reference

## Running the Services

### Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
- Docs: `http://localhost:8000/docs` (Swagger UI)
- Health check: `http://localhost:8000/health`

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173` (or the Vite port shown in terminal)

### Environment Files

#### Backend (`backend/.env`)
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_PUBLISHABLE_KEY=your_public_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Only if needed for server operations
```

#### Frontend (`frontend/.env.local`)
```
VITE_API_URL=http://localhost:8000
```

---

## Architecture Overview

```
┌─────────────────────┐
│   React Frontend    │
│   (Port 5173)       │
│                     │
│  - Child Journey    │
│  - Teacher Console  │
│  - Reports          │
└────────┬────────────┘
         │ HTTP/REST
         │ Bearer Token Auth
         │
┌────────▼────────────┐
│   FastAPI Backend   │
│   (Port 8000)       │
│                     │
│  - API Routes       │
│  - Auth Validation  │
│  - DB Queries       │
└────────┬────────────┘
         │ Supabase JWT
         │
┌────────▼────────────┐
│     Supabase        │
│   (PostgreSQL)      │
│                     │
│  - User Auth        │
│  - Data Storage     │
│  - RLS Policies     │
└─────────────────────┘
```

---

## API Endpoints Reference

### Health & Status
- `GET /health` - Backend health check

### Attempts (Learning Analytics)
- `POST /api/v1/attempts/log` - Log a learning attempt
  ```json
  {
    "child_id": "uuid",
    "activity_slug": "string",
    "correct": true,
    "latency_ms": 1500,
    "hints_used": 0,
    "transcript": "string",
    "meta": {}
  }
  ```

### Children
- `POST /api/v1/children/resolve-by-code` - Find child by join code
  ```json
  { "join_code": "ABC123" }
  ```

### Teacher Dashboard & Classes
- `GET /api/v1/teacher/dashboard` - Get all classes and stats
- `POST /api/v1/teacher/classes` - Create a new class
- `GET /api/v1/teacher/classes/{class_id}` - Get class details
- `PUT /api/v1/teacher/classes/{class_id}` - Update class
- `POST /api/v1/teacher/classes/{class_id}/children` - Add child to class
- `DELETE /api/v1/teacher/classes/{class_id}/children/{child_id}` - Remove child

---

## Frontend API Usage

### Using apiRequest Helper
```typescript
import { apiRequest } from "@/lib/api";

// GET request
const data = await apiRequest("/api/v1/teacher/dashboard");

// POST request
const result = await apiRequest("/api/v1/attempts/log", {
  method: "POST",
  body: JSON.stringify({ child_id: "...", activity_slug: "..." }),
});
```

### Using Teacher API Helpers
```typescript
import { getTeacherDashboard, createClass, getClass } from "@/lib/teacherApi";

const dashboard = await getTeacherDashboard();
const newClass = await createClass("Class Name", "theme-id");
const classData = await getClass("class-id");
```

---

## Authentication Flow

1. **Frontend:** User logs in via Supabase Auth
2. **Frontend:** Gets JWT token from Supabase session
3. **Frontend:** Sends token as Bearer in Authorization header: `Authorization: Bearer {token}`
4. **Backend:** Validates token with Supabase
5. **Backend:** Extracts user ID from token claims
6. **Backend:** Creates authenticated Supabase client with RLS
7. **Backend:** Returns data filtered by RLS policies

---

## Database Operations

All database queries go through:
1. Backend validates HTTP request & auth token
2. Backend creates authenticated Supabase client with JWT
3. Supabase RLS policies enforce row-level security
4. Only authorized data is returned

This ensures:
- ✅ No direct DB access from frontend
- ✅ All operations are auditable
- ✅ RLS policies are always enforced
- ✅ User isolation is guaranteed

---

## Debugging

### Check Backend Logs
```bash
# Terminal running uvicorn will show all requests and errors
# Look for stack traces to identify issues
```

### Check Network Traffic
```
Browser DevTools → Network tab
- Look for failing API calls to /api/v1/*
- Check response status and body for errors
```

### Test Endpoints Directly
```bash
# Test attempt logging
curl -X POST http://localhost:8000/api/v1/attempts/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $YOUR_JWT_TOKEN" \
  -d '{
    "child_id": "...",
    "activity_slug": "letter-a",
    "correct": true
  }'
```

### View API Documentation
Open `http://localhost:8000/docs` for interactive API explorer

---

## Common Issues

### 401 Unauthorized
- Frontend didn't send Authorization header
- Token is expired or invalid
- Check: Browser DevTools → Network → Request Headers

### 500 Internal Server Error
- Backend Supabase credentials are wrong
- Check `backend/.env` has correct values
- Check backend console for error details

### CORS Errors
- Frontend and backend ports don't match `.env.local`
- Frontend expects API at wrong URL
- Check: `VITE_API_URL` in `frontend/.env.local`

### Module Import Errors in Backend
```bash
# Make sure all dependencies are installed
cd backend
pip install -r requirements.txt

# Verify supabase-py is installed
pip list | grep supabase
```

---

## Next Steps

1. ✅ Backend routes are created and ready
2. ✅ Frontend helpers are created
3. ⏳ Complete refactoring of teacher routes
   - Reports route (`routes/_authenticated/teacher/report/$childId.tsx`)
   - Themes route (`routes/_authenticated/teacher/themes.tsx`)
   - Class details route (`routes/_authenticated/teacher/class/$classId.tsx`)
4. ⏳ Create Reports endpoints in backend
5. ⏳ Create Themes endpoints in backend

See `MIGRATION_GUIDE.md` for detailed phase breakdown.
