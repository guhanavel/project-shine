# Architecture Diagrams: Before & After Separation

## ❌ BEFORE: Monolithic Frontend (Insecure)

```
┌─────────────────────────────────────────────────────┐
│           React/Vite Frontend (Port 5173)           │
│                                                     │
│  Components:                                        │
│  ├─ child.index.tsx                                 │
│  ├─ teacher.index.tsx                               │
│  ├─ report/$childId.tsx                             │
│  └─ themes.tsx                                      │
│                                                     │
│  Libraries:                                         │
│  ├─ supabase/client.ts (PUBLIC KEY)                │
│  ├─ attempts.ts (DIRECT RPC)                        │
│  └─ other Supabase calls                            │
│                                                     │
│  Issues:                                            │
│  ❌ Direct RPC calls in browser                     │
│  ❌ Public key exposed in code                      │
│  ❌ No API versioning                               │
│  ❌ No audit trail                                  │
│  ❌ RLS policies might not be enforced              │
│  ❌ Difficult to rate limit                         │
└─────────────────┬───────────────────────────────────┘
                  │ Direct Supabase Connections
                  │ (supabase.rpc, supabase.from().select())
                  │
┌─────────────────▼───────────────────────────────────┐
│        Supabase (PostgreSQL + Auth)                 │
│                                                     │
│  ├─ RLS Policies (sometimes bypassed)               │
│  ├─ Direct RPC calls from browser                   │
│  └─ Attempt logging, queries, mutations             │
└─────────────────────────────────────────────────────┘
```

---

## ✅ AFTER: Separated Frontend & Backend (Secure)

```
┌──────────────────────────────────────┐
│   React/Vite Frontend (Port 5173)    │
│                                      │
│  Routes:                             │
│  ├─ child.index.tsx                  │
│  ├─ teacher.index.tsx                │
│  ├─ report/$childId.tsx (⏳)          │
│  └─ themes.tsx (⏳)                   │
│                                      │
│  Libraries:                          │
│  ├─ lib/api.ts (HTTP Client)         │
│  ├─ lib/attempts.ts (✅ HTTP)         │
│  ├─ lib/teacherApi.ts (✅ HTTP)       │
│  └─ integrations/supabase/auth       │
│     (Only for JWT token)              │
│                                      │
│  ✅ No direct DB access              │
│  ✅ Public key only for auth          │
│  ✅ API versioned (/api/v1)           │
│  ✅ Audit trail available             │
│  ✅ Can add monitoring                │
└──────────────┬───────────────────────┘
               │ HTTP Requests
               │ + Bearer Token
               │ (apiRequest helper)
               │
┌──────────────▼───────────────────────┐
│    FastAPI Backend (Port 8000)       │
│                                      │
│  Routes (v1):                        │
│  ├─ /attempts/log               ✅   │
│  ├─ /children/resolve-by-code   ✅   │
│  ├─ /teacher/dashboard          ✅   │
│  ├─ /teacher/classes/*          ✅   │
│  ├─ /reports/child/*            ⏳   │
│  └─ /themes/*                   ⏳   │
│                                      │
│  Features:                           │
│  ├─ JWT validation                   │
│  ├─ Authorization checks             │
│  ├─ Request logging                  │
│  ├─ Error handling                   │
│  └─ Pydantic validation              │
│                                      │
│  ✅ Audit trail of all requests      │
│  ✅ Can implement rate limiting      │
│  ✅ Can add monitoring/logging       │
│  ✅ Version management               │
│  ✅ Can enforce authorization        │
└──────────────┬───────────────────────┘
               │ Supabase JWT
               │ + RLS Policies
               │
┌──────────────▼───────────────────────┐
│  Supabase (PostgreSQL + Auth)        │
│                                      │
│  ├─ RLS Policies (Always enforced)   │
│  ├─ Authenticated client             │
│  ├─ No direct browser access         │
│  └─ Audit logs available             │
└──────────────────────────────────────┘
```

---

## 🔐 Security Comparison

### Before ❌
```
┌─────────────────────────────────────┐
│ Browser (Front-End)                 │
│  Contains:                          │
│  - Supabase Public Key (exposed)   │
│  - JWT Token                        │
│  - Direct RPC code                  │
└────────────────────┬────────────────┘
                     │ plaintext
                     │ no validation
                     │
┌────────────────────▼────────────────┐
│ Supabase                            │
│  Accepts any request with JWT       │
│  Limited audit trail                │
└─────────────────────────────────────┘
```

### After ✅
```
┌─────────────────────────────────────┐
│ Browser (React)                     │
│  Contains:                          │
│  - Supabase Public Key (for auth)  │
│  - JWT Token (auth only)            │
│  - NO database code                 │
└────────────────────┬────────────────┘
                     │ HTTP + Bearer
                     │ validated
                     │
┌────────────────────▼────────────────┐
│ Backend (Python)                    │
│  Validates all requests             │
│  Checks authorization               │
│  Logs all operations                │
│  Implements business logic          │
│  Enforces rate limits               │
└────────────────────┬────────────────┘
                     │ Supabase JWT
                     │ RLS policies
                     │
┌────────────────────▼────────────────┐
│ Supabase                            │
│  Enforces RLS policies              │
│  Full audit trail                   │
│  No direct browser access           │
└─────────────────────────────────────┘
```

---

## 📊 Data Flow: Attempt Logging Example

### Before ❌
```
User does activity
        ↓
React Component
        ↓
supabase.rpc("log_child_attempt", {...})
        ↓
Supabase (Browser Direct)
        ↓
PostgreSQL
        ↓
✓ Attempt logged
  ✗ But no audit trail
  ✗ No validation
  ✗ Public key exposed
```

### After ✅
```
User does activity
        ↓
React Component (lib/attempts.ts)
        ↓
apiRequest("/api/v1/attempts/log", {
  method: "POST",
  body: JSON.stringify({child_id, activity_slug, ...}),
  headers: {Authorization: "Bearer {token}"}
})
        ↓
Backend Route Handler (api/v1/attempts.py)
  ✓ Validates Authorization header
  ✓ Extracts user ID from token
  ✓ Checks user has access to child
  ✓ Validates request data (Pydantic)
  ✓ Logs the request
        ↓
Supabase (Backend RPC)
  ✓ Enforces RLS policy
  ✓ Only child's teacher can log
        ↓
PostgreSQL
  ✓ Inserts into activity_attempts table
  ✓ Triggers audit log
        ↓
✓ Attempt logged
✓ Audited
✓ Validated
✓ Authorized
✓ Monitored
```

---

## 🔄 Authentication Flow

```
1. INITIAL SETUP
   ┌────────────────────────────────────┐
   │ Frontend                           │
   │ - User signs in with email/password│
   │ - Supabase creates JWT session     │
   │ - JWT stored in localStorage       │
   └────────────────────────────────────┘

2. EACH API REQUEST
   ┌────────────────────────────────────┐
   │ Frontend                           │
   │ - Call apiRequest("/api/v1/...")   │
   │ - apiRequest extracts JWT from     │
   │   Supabase session                 │
   │ - Adds Authorization header        │
   │   "Authorization: Bearer {jwt}"    │
   └────────────────────┬───────────────┘
                        │
   ┌────────────────────▼───────────────┐
   │ Backend                            │
   │ - Receives HTTP request            │
   │ - Extracts Authorization header    │
   │ - Validates JWT with Supabase      │
   │ - Supabase returns user claims     │
   │ - Backend gets user_id from claims │
   │ - Creates RLS-authenticated client │
   └────────────────────┬───────────────┘
                        │
   ┌────────────────────▼───────────────┐
   │ Supabase                           │
   │ - RLS policy checks user_id        │
   │ - Only returns user's data         │
   │ - Logs operation                   │
   └────────────────────────────────────┘

3. RESPONSE
   Backend → Frontend → User sees data
```

---

## 📈 Scalability & Monitoring

### Before ❌
```
No insight into usage:
- When do children log attempts?
- Which activities are slowest?
- What's the error rate?
- Who's accessing what?
- System performance?

All unknowns.
```

### After ✅
```
Backend can track everything:
- Request rate per user
- Success/failure rate per endpoint
- Response times
- Error types and counts
- Data access patterns
- Performance metrics

Example dashboard:
┌──────────────────────────────┐
│ Attempts Logged Today: 15,234│
│ Avg Response Time: 145ms     │
│ Error Rate: 0.2%             │
│ Most Used Activity: letter-a │
│ Peak Usage: 2:30 PM          │
└──────────────────────────────┘
```

---

## 🚀 Future Enhancements

### Backend can easily add:
- ✅ Rate limiting per user
- ✅ Request caching
- ✅ Database query optimization
- ✅ Detailed error logging
- ✅ Performance monitoring
- ✅ A/B testing
- ✅ Feature flags
- ✅ Analytics pipeline
- ✅ Real-time notifications
- ✅ Admin dashboard

### Frontend remains clean:
- Just calls HTTP endpoints
- No backend knowledge needed
- Easy to maintain
- Easy to update
- Works with any backend
