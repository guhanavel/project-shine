"""
Pydantic models for teacher and class management
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ClassStats(BaseModel):
    """Statistics for a class"""
    total_children: int
    active_this_week: int
    total_attempts: int
    average_accuracy: float


class ClassResponse(BaseModel):
    """Class data in responses"""
    id: str
    name: str
    teacher_id: str
    join_code: str
    theme_id: Optional[str] = None
    created_at: str
    stats: Optional[ClassStats] = None


class TeacherDashboardResponse(BaseModel):
    """Response for teacher dashboard"""
    classes: List[ClassResponse]
    total_children: int
    total_attempts_this_week: int
    average_accuracy_this_week: float


class CreateClassRequest(BaseModel):
    """Request to create a new class"""
    name: str
    theme_id: Optional[str] = None


class UpdateClassRequest(BaseModel):
    """Request to update a class"""
    name: Optional[str] = None
    theme_id: Optional[str] = None


class AddChildToClassRequest(BaseModel):
    """Request to add a child to a class"""
    child_id: str
    class_id: str


class RemoveChildFromClassRequest(BaseModel):
    """Request to remove a child from a class"""
    child_id: str
    class_id: str
