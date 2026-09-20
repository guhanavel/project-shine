from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StudentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=18)
    avatar_emoji: Optional[str] = Field(default=None, max_length=16)


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    age: Optional[int] = None
    avatar_emoji: Optional[str] = None
    created_at: datetime
