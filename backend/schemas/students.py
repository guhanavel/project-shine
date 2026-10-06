from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

STUDENT_ACTIVITY_ATTEMPTS_TABLE = "student_activity_attempts"


class StudentBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    first_name: str = Field(min_length=1, max_length=100)
    avatar_id: str = Field(min_length=1)

    # TODO: Add Evaluation Metrics fields here once provided by Wenxuan.

    @field_validator("first_name")
    @classmethod
    def first_name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("first_name must not be blank")
        return value


class StudentCreate(StudentBase):
    pass


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    class_id: UUID
    created_at: datetime


class ActivityAttempt(BaseModel):
    id: UUID
    student_id: UUID
    activity_type: str
    completion_score: float
    timestamp: datetime


class ActivityAttemptCreate(BaseModel):
    activity_type: str
    completion_score: float
