from uuid import UUID

from pydantic import BaseModel, Field


class ProgressResponse(BaseModel):
    student_id: UUID
    total_attempts: int = Field(ge=0)
    total_correct: int = Field(ge=0)
    accuracy: float = Field(ge=0, le=1)
