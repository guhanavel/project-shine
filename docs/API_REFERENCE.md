# Complete API Reference with Examples

## Base URL
```
http://localhost:8000
```

## Authentication
All endpoints (except `/health`) require a Supabase JWT token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The frontend's `apiRequest` function automatically includes this header when using the Supabase auth middleware.

---

## ✅ Implemented Endpoints

### System Health

#### GET `/health`
Health check endpoint - no authentication required.

**Response:**
```json
{
  "status": "ok",
  "service": "shineworld-backend"
}
```

---

### Attempts (Learning Analytics)

#### POST `/api/v1/attempts/log`
Log a child's learning attempt. Fire-and-forget pattern - errors don't break the child journey.

**Request:**
```json
{
  "child_id": "550e8400-e29b-41d4-a716-446655440000",
  "activity_slug": "letter-a-tracing",
  "correct": true,
  "latency_ms": 1250,
  "hints_used": 0,
  "transcript": "a, ay, apple",
  "meta": {
    "screen_size": "1920x1080",
    "device_type": "desktop"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "attempt_id": "attempt_123456",
  "message": "Attempt logged successfully"
}
```

**Response (Fire-and-Forget - Always 200):**
```json
{
  "success": false,
  "message": "Attempt logged (with errors)"
}
```

**Frontend Usage:**
```typescript
import { logAttempt } from "@/lib/attempts";

// In your activity component:
await logAttempt({
  slug: "letter-a-tracing",
  correct: isCorrect,
  latencyMs: endTime - startTime,
  hintsUsed: hints.length,
  transcript: userInput,
});
```

---

### Children

#### POST `/api/v1/children/resolve-by-code`
Resolve a child by their 6-character join code.

**Request:**
```json
{
  "join_code": "ABC123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "child": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Emma Johnson",
    "grade": "Grade 1",
    "avatar_url": "https://...",
    "date_of_birth": "2015-06-15"
  }
}
```

**Response (Not Found):**
```
404 Not Found
```

**Frontend Usage:**
```typescript
import { apiRequest } from "@/lib/api";

async function joinClass(code: string) {
  try {
    const response = await apiRequest<{
      child: { id: string; name: string };
      success: boolean;
    }>("/api/v1/children/resolve-by-code", {
      method: "POST",
      body: JSON.stringify({ join_code: code.toUpperCase() }),
    });
    
    if (response.success) {
      localStorage.setItem("activeChildId", response.child.id);
      localStorage.setItem("activeChildName", response.child.name);
    }
  } catch (error) {
    console.error("Failed to join class:", error);
  }
}
```

---

### Teacher Dashboard & Classes

#### GET `/api/v1/teacher/dashboard`
Get the teacher's complete dashboard with all classes and aggregated statistics.

**Query Parameters:** None

**Response:**
```json
{
  "classes": [
    {
      "id": "class_001",
      "name": "Room 101 - Morning",
      "teacher_id": "teacher_123",
      "join_code": "ABC123",
      "theme_id": "theme_starter_letters",
      "created_at": "2026-01-15T08:00:00Z",
      "stats": {
        "total_children": 24,
        "active_this_week": 18,
        "total_attempts": 1250,
        "average_accuracy": 0.87
      }
    },
    {
      "id": "class_002",
      "name": "Room 101 - Afternoon",
      "teacher_id": "teacher_123",
      "join_code": "XYZ789",
      "theme_id": "theme_custom_phonics",
      "created_at": "2026-02-01T13:00:00Z",
      "stats": {
        "total_children": 20,
        "active_this_week": 15,
        "total_attempts": 850,
        "average_accuracy": 0.82
      }
    }
  ],
  "total_children": 44,
  "total_attempts_this_week": 2100,
  "average_accuracy_this_week": 0.845
}
```

**Frontend Usage:**
```typescript
import { getTeacherDashboard } from "@/lib/teacherApi";

export async function loadDashboard() {
  const dashboard = await getTeacherDashboard();
  console.log(`You have ${dashboard.classes.length} classes`);
  dashboard.classes.forEach(cls => {
    console.log(`${cls.name}: ${cls.stats.total_children} children`);
  });
}
```

---

#### POST `/api/v1/teacher/classes`
Create a new class.

**Request:**
```json
{
  "name": "Room 101 - Morning",
  "theme_id": "theme_starter_letters"
}
```

**Response:**
```json
{
  "id": "class_001",
  "name": "Room 101 - Morning",
  "teacher_id": "teacher_123",
  "join_code": "ABC123",
  "theme_id": "theme_starter_letters",
  "created_at": "2026-01-15T08:00:00Z"
}
```

**Frontend Usage:**
```typescript
import { createClass } from "@/lib/teacherApi";

const newClass = await createClass("Room 101 - Morning", "theme_starter_letters");
console.log(`Created class with join code: ${newClass.join_code}`);
```

---

#### GET `/api/v1/teacher/classes/{class_id}`
Get details of a specific class.

**Response:**
```json
{
  "id": "class_001",
  "name": "Room 101 - Morning",
  "teacher_id": "teacher_123",
  "join_code": "ABC123",
  "theme_id": "theme_starter_letters",
  "created_at": "2026-01-15T08:00:00Z"
}
```

**Frontend Usage:**
```typescript
import { getClass } from "@/lib/teacherApi";

const classData = await getClass("class_001");
console.log(`Class name: ${classData.name}, Join code: ${classData.join_code}`);
```

---

#### PUT `/api/v1/teacher/classes/{class_id}`
Update a class.

**Request:**
```json
{
  "name": "Room 101 - Advanced",
  "theme_id": "theme_words_level2"
}
```

**Response:**
```json
{
  "id": "class_001",
  "name": "Room 101 - Advanced",
  "teacher_id": "teacher_123",
  "join_code": "ABC123",
  "theme_id": "theme_words_level2",
  "created_at": "2026-01-15T08:00:00Z"
}
```

**Frontend Usage:**
```typescript
import { updateClass } from "@/lib/teacherApi";

await updateClass("class_001", "Room 101 - Advanced", "theme_words_level2");
console.log("Class updated!");
```

---

#### POST `/api/v1/teacher/classes/{class_id}/children`
Add a child to a class.

**Request:**
```json
{
  "child_id": "child_123",
  "class_id": "class_001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Child added to class"
}
```

**Frontend Usage:**
```typescript
import { addChildToClass } from "@/lib/teacherApi";

await addChildToClass("class_001", "child_123");
console.log("Child added!");
```

---

#### DELETE `/api/v1/teacher/classes/{class_id}/children/{child_id}`
Remove a child from a class.

**Response:**
```json
{
  "success": true,
  "message": "Child removed from class"
}
```

**Frontend Usage:**
```typescript
import { removeChildFromClass } from "@/lib/teacherApi";

await removeChildFromClass("class_001", "child_123");
console.log("Child removed!");
```

---

## ⏳ To Be Implemented

### Reports

#### GET `/api/v1/reports/child/{child_id}`
Get comprehensive report for a child's progress.

**Expected Response Schema:**
```json
{
  "child_id": "uuid",
  "child_name": "Emma Johnson",
  "total_attempts": 523,
  "total_correct": 450,
  "overall_accuracy": 0.86,
  "all_attempts": [
    {
      "id": "attempt_001",
      "activity_slug": "letter-a",
      "correct": true,
      "latency_ms": 1250,
      "hints_used": 0,
      "created_at": "2026-09-13T10:30:00Z",
      "transcript": "a",
      "meta": {}
    }
  ],
  "activity_mastery": [
    {
      "activity_slug": "letter-a",
      "attempts": 45,
      "correct": 42,
      "accuracy": 0.93,
      "last_attempted": "2026-09-13T10:30:00Z"
    }
  ],
  "disposition_mastery": [
    {
      "disposition_name": "Phonological Awareness",
      "activities": ["letter-a", "letter-b"],
      "overall_accuracy": 0.88
    }
  ]
}
```

---

### Themes

#### GET `/api/v1/themes`
List all themes available to teacher.

#### POST `/api/v1/themes`
Create a new custom theme.

#### PUT `/api/v1/themes/{theme_id}`
Update a theme.

#### DELETE `/api/v1/themes/{theme_id}`
Delete a custom theme.

#### POST `/api/v1/themes/{theme_id}/assign-to-class`
Assign a theme to a class.

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Missing or invalid authorization header"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Error description"
}
```

---

## Testing with curl

### Test Health
```bash
curl http://localhost:8000/health
```

### Test Attempt Logging (with token)
```bash
curl -X POST http://localhost:8000/api/v1/attempts/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "child_id": "550e8400-e29b-41d4-a716-446655440000",
    "activity_slug": "letter-a",
    "correct": true,
    "latency_ms": 1250,
    "hints_used": 0
  }'
```

### Test Child Resolution
```bash
curl -X POST http://localhost:8000/api/v1/children/resolve-by-code \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"join_code": "ABC123"}'
```

### Test Teacher Dashboard
```bash
curl -X GET http://localhost:8000/api/v1/teacher/dashboard \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Interactive API Explorer

Once backend is running, visit:
```
http://localhost:8000/docs
```

This provides an interactive Swagger UI where you can:
- See all endpoints
- View request/response schemas
- Try out endpoints (with auth token)
- See documentation for each endpoint
