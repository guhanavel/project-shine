from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ActivityAttemptCreate(BaseModel):
    student_id: UUID
    correct: bool
    latency_ms: Optional[int] = Field(default=None, ge=0)
    hints_used: int = Field(default=0, ge=0)
    transcript: Optional[str] = None
    meta: Dict[str, Any] = Field(default_factory=dict)
    session_id: Optional[UUID] = None


class ActivityAttemptResponse(ActivityAttemptCreate):
    id: UUID
    activity_id: UUID
    created_at: datetime
