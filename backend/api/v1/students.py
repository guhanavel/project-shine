from typing import Any, Dict, List, Optional
from uuid import UUID

import os
from fastapi import APIRouter, Depends, HTTPException, Path, status
from supabase import Client, create_client

from schemas.activity_attempts import ActivityAttemptCreate, ActivityAttemptResponse
from schemas.progress import ProgressResponse
from schemas.students import StudentCreate, StudentResponse

router = APIRouter(tags=["Students"])


async def get_supabase() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(supabase_url, supabase_key)


def get_token_from_header(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    return authorization.removeprefix("Bearer ")


def _student_from_row(row: Dict[str, Any]) -> StudentResponse:
    return StudentResponse(
        id=row["id"],
        name=row["name"],
        age=row.get("age"),
        avatar_emoji=row.get("avatar_emoji"),
        created_at=row["created_at"],
    )


async def _student_or_404(student_id: UUID, supabase: Client) -> StudentResponse:
    response = supabase.table("children").select("*").eq("id", str(student_id)).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return _student_from_row(response.data[0])


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    request: StudentCreate,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> StudentResponse:
    token = get_token_from_header(authorization)
    user = supabase.auth.get_user(token)
    if not user.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization token")

    response = supabase.table("children").insert({
        "parent_id": user.user.id,
        "name": request.name,
        "age": request.age,
        "avatar_emoji": request.avatar_emoji,
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create student")
    return _student_from_row(response.data[0])


@router.get("/students", response_model=List[StudentResponse])
async def list_students(supabase: Client = Depends(get_supabase)) -> List[StudentResponse]:
    response = supabase.table("children").select("*").order("created_at").execute()
    return [_student_from_row(row) for row in response.data or []]


@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: UUID = Path(),
    supabase: Client = Depends(get_supabase),
) -> StudentResponse:
    return await _student_or_404(student_id, supabase)


@router.post(
    "/activities/{activity_id}/attempts",
    response_model=ActivityAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity_attempt(
    activity_id: UUID,
    request: ActivityAttemptCreate,
    supabase: Client = Depends(get_supabase),
) -> ActivityAttemptResponse:
    await _student_or_404(request.student_id, supabase)
    response = supabase.table("activity_attempts").insert({
        "child_id": str(request.student_id),
        "activity_id": str(activity_id),
        **request.model_dump(exclude={"student_id"}),
    }).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Failed to create attempt")
    row = response.data[0]
    return ActivityAttemptResponse(
        id=row["id"],
        activity_id=row["activity_id"],
        student_id=row["child_id"],
        correct=row["correct"],
        latency_ms=row.get("latency_ms"),
        hints_used=row.get("hints_used", 0),
        transcript=row.get("transcript"),
        meta=row.get("meta", {}),
        session_id=row.get("session_id"),
        created_at=row["created_at"],
    )


@router.get("/students/{student_id}/progress", response_model=ProgressResponse)
async def get_student_progress(
    student_id: UUID = Path(),
    supabase: Client = Depends(get_supabase),
) -> ProgressResponse:
    await _student_or_404(student_id, supabase)
    response = supabase.table("activity_attempts").select("correct").eq("child_id", str(student_id)).execute()
    student_attempts = response.data or []
    total_attempts = len(student_attempts)
    total_correct = sum(attempt["correct"] for attempt in student_attempts)
    return ProgressResponse(
        student_id=student_id,
        total_attempts=total_attempts,
        total_correct=total_correct,
        accuracy=total_correct / total_attempts if total_attempts else 0.0,
    )
