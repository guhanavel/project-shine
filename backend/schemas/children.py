"""
Pydantic models for child-related operations
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChildCreate(BaseModel):
    """Request to create a child profile in the existing child API."""

    name: str = Field(min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=18)
    avatar_emoji: Optional[str] = Field(default=None, max_length=16)


class ChildProfileResponse(BaseModel):
    """Response for a child profile in the existing child API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    age: Optional[int] = None
    avatar_emoji: Optional[str] = None
    created_at: datetime


class ResolveChildByCodeRequest(BaseModel):
    """Request to resolve a child by their join code"""
    join_code: str


class ChildResponse(BaseModel):
    """Child data in responses"""
    id: str
    name: str
    grade: Optional[str] = None
    avatar_url: Optional[str] = None
    date_of_birth: Optional[str] = None


class ResolveChildResponse(BaseModel):
    """Response from child resolution by code"""
    child: ChildResponse
    success: bool
