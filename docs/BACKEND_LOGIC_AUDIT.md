# Frontend Backend Logic Audit

## Executive Summary
The frontend codebase contains **significant server-side logic and database operations** that should be migrated to the FastAPI backend. This includes:
- Direct Supabase database queries from route components
- RPC calls for business logic (attempt logging, child resolution)
- Authentication & authorization middleware
- Admin operations using service role keys
- Teacher/parent dashboard data aggregation

---

## 1. AUTHENTICATION & AUTHORIZATION

### 1.1 Auth Middleware & Token Validation
**File:** [frontend/src/integrations/supabase/auth-middleware.ts](frontend/src/integrations/supabase/auth-middleware.ts)
- **Type:** Server-side middleware
- **Logic:**
  - Validates JWT bearer tokens from Authorization header
  - Checks token structure (must be 3-part JWT)
  - Extracts user ID (`sub` claim) from token
  - Creates authenticated Supabase client with user context
  - Throws 401 errors for missing/invalid tokens
- **Data Models:**
  - JWT claims (extracts `sub`, `claims`)
  - Returns context with `userId`, `claims`, `supabase`
- **Security:** Requires `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_URL`
- **HTTP Endpoint Needed:** `/auth/validate-token` - Standardize token validation

### 1.2 Auth Attacher (Client-side)
**File:** [frontend/src/integrations/supabase/auth-attacher.ts](frontend/src/integrations/supabase/auth-attacher.ts)
- **Type:** Client-side middleware
- **Logic:**
  - Fetches current session from Supabase
  - Attaches bearer token to all server function RPCs
  - Runs on client before sending requests
- **Uses:** `supabase.auth.getSession()`
- **HTTP Endpoint Dependency:** Requires that server functions accept `Authorization: Bearer {token}` header

### 1.3 Admin Client (Service Role Key)
**File:** [frontend/src/integrations/supabase/client.server.ts](frontend/src/integrations/supabase/client.server.ts)
- **Type:** Server-side admin client
- **Critical Issue:** **Service role key is accessible from frontend code** ⚠️
- **Logic:**
  - Creates Supabase client with `SUPABASE_SERVICE_ROLE_KEY`
  - Bypasses all RLS policies
  - Used for admin operations that need to bypass security
- **Security Risk:** Service role key should ONLY be on the backend, never in frontend
- **Migration Action:** Move to backend, expose via authenticated HTTP endpoints

---

## 2. DATABASE OPERATIONS - ATTEMPT LOGGING

### 2.1 Attempt Logger
**File:** [frontend/src/lib/attempts.ts](frontend/src/lib/attempts.ts)
- **Type:** Business logic (client-callable)
- **Database Tables:** `activity_attempts`, `children`
- **Operations:**
  - Calls `log_child_attempt` RPC with:
    - `_child_id`: Active child ID
    - `_activity_slug`: Learning activity identifier
    - `_correct`: Boolean (answer correctness)
    - `_latency_ms`: Response time in milliseconds
    - `_hints_used`: Number of hints used
    - `_transcript`: User transcription
    - `_meta`: Arbitrary JSON metadata
  - Fire-and-forget pattern (no error handling)
  - Checks `localStorage` for active child before logging
- **Data Model:** `LogAttempt` interface
- **HTTP Endpoint Needed:** `POST /api/v1/attempts` - Centralize logging

---

## 3. DATABASE OPERATIONS - TEACHER DASHBOARD

### 3.1 Teacher Dashboard Home
**File:** [frontend/src/routes/_authenticated/teacher.index.tsx](frontend/src/routes/_authenticated/teacher.index.tsx#L30-L80)
- **Type:** Route component with multiple database queries
- **Database Queries:**
  1. **Classes Query**
     - Table: `classes`
     - Select: `id, name, created_at`
     - Filter: By current user (teacher_id)
     - Limit: All
  
  2. **Roster Query (Multi-step join)**
     - Step 1: Select from `class_children` (class_id, child_id)
     - Step 2: Select from `children` (id, name, buddy_id, avatar_emoji, join_code)
     - Filter: child_id IN [result from step 1]
     
  3. **Attempts Query (Last 7 days)**
     - Table: `activity_attempts`
     - Select: `child_id, correct, created_at`
     - Filter: child_id IN [roster children], created_at >= 7 days ago
     - Used for: Weekly accuracy calculation, active child count
  
  4. **Class Creation Mutation**
     - Insert into `classes` table
     - Fields: `teacher_id`, `name`
     - Requires: Current authenticated user

- **Data Models:**
  ```typescript
  type ClassRow = { id: string; name: string; created_at: string }
  type ChildRow = {
    id: string;
    name: string;
    buddy_id: string | null;
    avatar_emoji: string | null;
    join_code: string | null;
  }
  type Attempt = { child_id: string; correct: boolean; created_at: string }
  ```

- **Calculations:**
  - Total children count
  - Active children in last 7 days (unique count)
  - Total attempts in last 7 days
  - Accuracy percentage
  - Per-class KPI aggregation

- **HTTP Endpoints Needed:**
  - `GET /api/v1/teacher/classes` - List teacher's classes
  - `POST /api/v1/teacher/classes` - Create new class
  - `GET /api/v1/teacher/children` - Get teacher's children roster
  - `GET /api/v1/teacher/attempts/7d` - Weekly attempts and accuracy

---

### 3.2 Teacher Class View
**File:** [frontend/src/routes/_authenticated/teacher/class/$classId.tsx](frontend/src/routes/_authenticated/teacher/class/$classId.tsx)
- **Type:** Route component with database queries and mutations
- **Database Queries:**
  1. **Class Details**
     - Table: `classes`
     - Filter: id = classId
     - Fields: `id, name`
  
  2. **Class Roster**
     - Step 1: Select from `class_children` (child_id where class_id = $classId)
     - Step 2: Select from `children` by id
     - Fields: `id, name, buddy_id, avatar_emoji, join_code`
  
  3. **Class Attempts (Last 7 days)**
     - Table: `activity_attempts`
     - Filter: child_id IN [roster], created_at >= 7 days ago
     - Select: `child_id, correct, created_at`
  
  4. **Class Themes**
     - Step 1: Select from `class_themes` (theme_id where class_id = $classId)
     - Step 2: Select from `themes`
     - Fields: `id, slug, title, emoji, color`

- **Database Mutations:**
  1. **Create Child**
     - Insert into `children`: `parent_id, name, age, avatar_emoji`
     - Insert into `class_children`: `class_id, child_id`
     - Deduplication: Ignores duplicate errors
  
  2. **Add Child by Join Code**
     - Query `children` by `join_code`
     - Insert into `class_children`
     - Validates code is uppercase, 6 chars (before send)
  
  3. **Remove Child from Class**
     - Delete from `class_children`
     - Filter: class_id = $classId AND child_id = $childId
  
  4. **Unassign Theme**
     - Delete from `class_themes`
     - Filter: class_id = $classId AND theme_id = $themeId

- **Data Aggregation:**
  - Per-day attempt counts (7-day chart)
  - Child mastery percentages
  - Class-wide statistics

- **HTTP Endpoints Needed:**
  - `GET /api/v1/classes/{classId}` - Class details
  - `GET /api/v1/classes/{classId}/children` - Class roster
  - `GET /api/v1/classes/{classId}/attempts/7d` - Weekly data
  - `POST /api/v1/classes/{classId}/children` - Add child (by code or create)
  - `DELETE /api/v1/classes/{classId}/children/{childId}` - Remove child
  - `DELETE /api/v1/classes/{classId}/themes/{themeId}` - Unassign theme

---

### 3.3 Teacher Report (Child Progress)
**File:** [frontend/src/routes/_authenticated/teacher/report/$childId.tsx](frontend/src/routes/_authenticated/teacher/report/$childId.tsx)
- **Type:** Route component with analytics queries
- **Database Queries:**
  1. **Child Details**
     - Table: `children`
     - Filter: id = childId
     - Select: `*` (all fields)
  
  2. **Child Attempts (All-time)**
     - Table: `activity_attempts`
     - Filter: child_id = $childId
     - Order: created_at DESC
     - Limit: 500
     - Select: `id, correct, created_at, activity_id`
  
  3. **Activities Reference**
     - Table: `activities`
     - Select: `id, slug, title, unit, ld_tags`
     - No filter (all activities used for lookup)
  
  4. **Learning Dispositions**
     - Table: `learning_dispositions`
     - Select: `code, name, color`
     - Order: `sort_order`

- **Data Calculations:**
  - Total attempts, correct count, accuracy %
  - Per-activity mastery (% correct per activity)
  - Per-learning-disposition mastery (using `ld_tags` from activities)
  - Aggregations for analytics dashboard

- **Data Models:**
  ```typescript
  type Attempt = { id: string; correct: boolean; created_at: string; activity_id: string }
  type Activity = { id: string; slug: string; title: string; unit: string; ld_tags: string[] | null }
  type LD = { code: string; name: string; color: string | null }
  ```

- **HTTP Endpoints Needed:**
  - `GET /api/v1/children/{childId}` - Child details
  - `GET /api/v1/children/{childId}/attempts` - All attempts (paginated?)
  - `GET /api/v1/children/{childId}/report` - Pre-calculated report data
  - `GET /api/v1/activities` - Activity reference data
  - `GET /api/v1/learning-dispositions` - Learning disposition definitions

---

### 3.4 Teacher Themes Management
**File:** [frontend/src/routes/_authenticated/teacher/themes.tsx](frontend/src/routes/_authenticated/teacher/themes.tsx)
- **Type:** Route component with theme management queries & mutations
- **Database Queries:**
  1. **All Themes**
     - Table: `themes`
     - Select: `id, slug, title, description, emoji, color, is_starter, created_by`
     - Order: is_starter DESC, created_at ASC
  
  2. **Theme Items**
     - Table: `theme_items`
     - Select: `id, theme_id, kind, value, position`
     - Order: position ASC
  
  3. **Teacher's Classes**
     - Table: `classes`
     - Select: `id, name`
     - Order: created_at
  
  4. **Class-Theme Assignments**
     - Table: `class_themes`
     - Select: `class_id, theme_id`

- **Database Mutations:**
  - Create custom theme (likely via mutation form)
  - Assign/unassign themes to classes
  - Modify theme items
  - (Exact mutations truncated in file excerpt)

- **Data Models:**
  ```typescript
  type ThemeRow = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    emoji: string | null;
    color: string | null;
    is_starter: boolean;
    created_by: string | null;
  }
  type ItemRow = {
    id: string;
    theme_id: string;
    kind: "letter" | "word";
    value: string;
    position: number;
  }
  ```

- **Business Logic:**
  - Tracks available phonics items: 26 letters + digraphs (ck, sh, ch) + 22 words
  - Supports theme creation with custom letter/word selections
  - Tracks starter vs custom themes

- **HTTP Endpoints Needed:**
  - `GET /api/v1/themes` - All themes
  - `POST /api/v1/themes` - Create new theme
  - `GET /api/v1/themes/{themeId}/items` - Theme items
  - `POST /api/v1/themes/{themeId}/items` - Add item
  - `DELETE /api/v1/themes/{themeId}/items/{itemId}` - Remove item
  - `POST /api/v1/classes/{classId}/themes/{themeId}` - Assign theme
  - `DELETE /api/v1/classes/{classId}/themes/{themeId}` - Unassign theme

---

## 4. DATABASE OPERATIONS - CHILD ROUTES

### 4.1 Child Join by Code
**File:** [frontend/src/routes/child.index.tsx](frontend/src/routes/child.index.tsx)
- **Type:** Route component with RPC call
- **RPC Call:** `resolve_child_by_join_code`
  - Input: `_code` (6-character uppercase string)
  - Returns: Child record with at least `id` and `name`
  - Error handling: Shows "We couldn't find that code" if no match
- **Post-Resolution:**
  - Stores `childId` and `childName` in localStorage
  - Navigates to `/child/buddy`
- **Security:** Client-side code validation (6 chars) before RPC

- **HTTP Endpoint Needed:**
  - `POST /api/v1/children/resolve-by-code` - Resolve child by join code

---

## 5. AUTHORIZATION & ROLE-BASED ACCESS

### 5.1 Role Query
**File:** [frontend/src/lib/useMyRole.ts](frontend/src/lib/useMyRole.ts)
- **Type:** React Query hook for user role
- **Database Query:**
  - Step 1: `supabase.auth.getUser()` - Get current user
  - Step 2: Query `user_roles` table
    - Filter: user_id = current user
    - Select: `role`
    - All matched roles: Map to AppRole type
- **Business Logic:**
  - Returns highest priority role: admin > teacher > parent > null
  - Role priorities hardcoded in app
- **Caching:** staleTime: 60,000ms (1 minute)

- **HTTP Endpoint Needed:**
  - `GET /api/v1/user/role` - Get current user's role (can be derived from JWT claims)

---

## 6. CLIENT-SIDE ONLY (NOT BACKEND LOGIC)

### 6.1 Local Storage & Client State
- **phonicsProgress.ts:** Local tracking of completed phonics steps (localStorage only)
- **characters.ts:** Static character definitions + localStorage preference (no DB)
- **audio.ts:** Static audio URL mappings (no DB)
- **audioCache.ts:** Local audio caching (localStorage/IDB)
- **utils.ts:** CSS utility functions (cn/clsx merge)

### 6.2 Client-Side UI Logic
- **child.buddy.tsx:** Character picker (no DB queries)
- **child.phonics.*.tsx:** Lesson routes (use local state + attempt logging)
- **auth.tsx:** Sign-up/sign-in UI (uses Supabase auth directly)

---

## 7. ENVIRONMENT & CONFIGURATION

### 7.1 API Client Setup
**File:** [frontend/src/lib/api.ts](frontend/src/lib/api.ts)
- **Configuration:**
  - Base URL: `import.meta.env.VITE_API_URL` (FastAPI backend URL)
  - Fallback: Same-origin (relative URLs)
- **Current Status:** Health check only
  ```typescript
  checkBackendHealth(): GET /health
  ```

### 7.2 Supabase Configuration
**Files:**
- `client.ts`: Public key client (browser auth)
- `client.server.ts`: Service role client (⚠️ **SECURITY RISK** - should be backend only)
- `auth-middleware.ts`: Server-side auth validation
- `auth-attacher.ts`: Client-side token attachment

---

## 8. SECURITY ISSUES & RECOMMENDATIONS

### Critical Issues

1. **Service Role Key in Frontend** ⚠️⚠️⚠️
   - **Location:** `client.server.ts`
   - **Risk:** Private key leaked to all clients via source code or network
   - **Action:** Move to backend `.server.ts` files only, never in frontend bundle
   - **Mitigation:** Replace with authenticated HTTP endpoints to backend

2. **Direct RLS Queries from Frontend**
   - **Pattern:** Routes calling `supabase.from().select()` directly
   - **Risk:** RLS bypasses if service role key is leaked
   - **Action:** Proxy all database queries through FastAPI backend endpoints

3. **RPC Call Pattern**
   - **Calls:** `log_child_attempt`, `resolve_child_by_join_code`
   - **Risk:** RPCs are harder to audit and version control than HTTP endpoints
   - **Action:** Replace with RESTful HTTP endpoints

4. **Token Validation in Frontend Middleware**
   - **Location:** `auth-middleware.ts`
   - **Risk:** Custom JWT validation logic prone to bypass
   - **Action:** Move to backend, standardize with FastAPI dependency injection

### Medium Priority

5. **Missing Error Handling**
   - **Pattern:** Fire-and-forget attempt logging in `attempts.ts`
   - **Risk:** Silent failures if logging fails
   - **Action:** Add retry logic and error monitoring to backend

6. **No Request Validation**
   - **Pattern:** Client sends arbitrary JSON metadata in attempts
   - **Risk:** Backend needs to validate all inputs
   - **Action:** Add Pydantic schemas to FastAPI endpoints

---

## 9. MIGRATION PRIORITY ROADMAP

### Phase 1: Authentication & Authorization (Blocking)
- [ ] Migrate `auth-middleware.ts` validation to FastAPI
- [ ] Move `client.server.ts` to backend only
- [ ] Create `POST /api/v1/auth/validate-token` endpoint
- [ ] Create `GET /api/v1/user/role` endpoint
- [ ] Remove service role key from frontend build

### Phase 2: Child Routes (High Priority)
- [ ] Create `POST /api/v1/children/resolve-by-code` endpoint
- [ ] Create `POST /api/v1/attempts` endpoint (replaces `log_child_attempt` RPC)
- [ ] Test child journey with new endpoints

### Phase 3: Teacher Dashboard (High Priority)
- [ ] Create teacher endpoints:
  - `GET /api/v1/teacher/classes`
  - `POST /api/v1/teacher/classes`
  - `GET /api/v1/teacher/children`
  - `GET /api/v1/teacher/attempts/7d`
  - `GET /api/v1/classes/{classId}`
  - `GET /api/v1/classes/{classId}/children`
  - `POST /api/v1/classes/{classId}/children`
  - `DELETE /api/v1/classes/{classId}/children/{childId}`
  - `GET /api/v1/classes/{classId}/attempts/7d`
  - `GET /api/v1/classes/{classId}/themes`
  - `DELETE /api/v1/classes/{classId}/themes/{themeId}`

### Phase 4: Reports & Analytics (Medium Priority)
- [ ] Create `GET /api/v1/children/{childId}/report` endpoint
- [ ] Create `GET /api/v1/children/{childId}/attempts` endpoint
- [ ] Create `GET /api/v1/activities` endpoint
- [ ] Create `GET /api/v1/learning-dispositions` endpoint

### Phase 5: Theme Management (Medium Priority)
- [ ] Create theme CRUD endpoints
- [ ] Create theme assignment endpoints
- [ ] Validate phonics items (letters/words)

### Phase 6: Data Aggregation & Caching (Optional)
- [ ] Implement pre-calculated report queries
- [ ] Add Redis caching for teacher dashboards
- [ ] Optimize attempt queries with indexes

---

## 10. SUMMARY TABLE

| Category | Files | Tables | Operations | Endpoints Needed |
|----------|-------|--------|-----------|------------------|
| Auth | auth-middleware.ts, auth-attacher.ts | jwt (implicit) | Token validation | POST /auth/validate-token |
| Attempts | lib/attempts.ts | activity_attempts | INSERT (log_child_attempt RPC) | POST /attempts |
| Child Routes | child.index.tsx | children | RPC resolve_child_by_join_code | POST /children/resolve-by-code |
| Teacher Dashboard | teacher/index.tsx | classes, children, class_children, activity_attempts | SELECT (4 queries), INSERT (class) | GET/POST /teacher/classes, GET /teacher/children, GET /teacher/attempts/7d |
| Class Management | teacher/class/$classId.tsx | classes, children, class_children, class_themes, themes, activity_attempts | SELECT (4), INSERT/DELETE (3 mutations) | 7 endpoints for class CRUD |
| Reports | teacher/report/$childId.tsx | children, activity_attempts, activities, learning_dispositions | SELECT (4 queries) | GET /children/{id}/report, /children/{id}/attempts, /activities, /learning-dispositions |
| Themes | teacher/themes.tsx | themes, theme_items, classes, class_themes | SELECT (4), mutations for create/assign | 8+ endpoints for theme CRUD |
| User Role | lib/useMyRole.ts | user_roles | SELECT (queries auth.getUser + user_roles) | GET /user/role |

---

## 11. ENVIRONMENT VARIABLES REQUIRING BACKEND

These should move from frontend `.env` to backend `.env`:
- `SUPABASE_URL` - Keep in frontend (needed for auth client), but only URL
- `SUPABASE_PUBLISHABLE_KEY` - Keep in frontend (public key)
- `SUPABASE_SERVICE_ROLE_KEY` - **MOVE TO BACKEND ONLY** ⚠️
- `VITE_API_URL` - Keep in frontend (backend URL)

---

## Implementation Notes

1. All Supabase RPC calls should be converted to HTTP endpoints for better versioning and auditing
2. Implement consistent error responses across all new endpoints
3. Add request/response logging and monitoring
4. Validate all inputs using Pydantic schemas
5. Use FastAPI dependencies for auth, role checking, and child context
6. Keep frontend auth client for sign-up/sign-in only; proxy all data operations through backend
7. Consider GraphQL or JSON:API for complex data fetching (reports, analytics)
