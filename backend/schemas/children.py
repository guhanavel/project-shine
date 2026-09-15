"""
Pydantic models for child-related operations
"""
from pydantic import BaseModel
from typing import Optional


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
