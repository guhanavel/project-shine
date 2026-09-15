from datetime import datetime, timezone
from typing import Dict, List
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Path, status

from schemas.activity_attempts import ActivityAttemptCreate, ActivityAttemptResponse
from schemas.progress import ProgressResponse
from schemas.students import StudentCreate, StudentResponse

router = APIRouter(tags=["Students"])

_students: Dict[UUID, StudentResponse] = {}
_attempts: List[ActivityAttemptResponse] = []


def _student_or_404(student_id: UUID) -> StudentResponse:
    student = _students.get(student_id)
    if student is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@router.post("/students", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(request: StudentCreate) -> StudentResponse:
    student = StudentResponse(
        id=uuid4(),
        name=request.name,
        age=request.age,
        avatar_emoji=request.avatar_emoji,
        created_at=datetime.now(timezone.utc),
    )
    _students[student.id] = student
    return student


@router.get("/students", response_model=List[StudentResponse])
async def list_students() -> List[StudentResponse]:
    return list(_students.values())


@router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: UUID = Path()) -> StudentResponse:
    return _student_or_404(student_id)


@router.post(
    "/activities/{activity_id}/attempts",
    response_model=ActivityAttemptResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity_attempt(
    activity_id: UUID,
    request: ActivityAttemptCreate,
) -> ActivityAttemptResponse:
    _student_or_404(request.student_id)
    attempt = ActivityAttemptResponse(
        id=uuid4(),
        activity_id=activity_id,
        created_at=datetime.now(timezone.utc),
        **request.model_dump(),
    )
    _attempts.append(attempt)
    return attempt


@router.get("/students/{student_id}/progress", response_model=ProgressResponse)
async def get_student_progress(student_id: UUID = Path()) -> ProgressResponse:
    _student_or_404(student_id)
    student_attempts = [attempt for attempt in _attempts if attempt.student_id == student_id]
    total_attempts = len(student_attempts)
    total_correct = sum(attempt.correct for attempt in student_attempts)
    return ProgressResponse(
        student_id=student_id,
        total_attempts=total_attempts,
        total_correct=total_correct,
        accuracy=total_correct / total_attempts if total_attempts else 0.0,
    )
