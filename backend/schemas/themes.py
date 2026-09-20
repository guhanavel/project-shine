"""
Pydantic models for theme management
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ThemeResponse(BaseModel):
    """Theme data in responses"""
    id: str
    name: str
    created_by: str
    is_starter: bool
    letters: Optional[List[str]] = None
    digraphs: Optional[List[str]] = None
    words: Optional[List[str]] = None
    created_at: str


class CreateThemeRequest(BaseModel):
    """Request to create a new theme"""
    name: str
    letters: Optional[List[str]] = None
    digraphs: Optional[List[str]] = None
    words: Optional[List[str]] = None


class UpdateThemeRequest(BaseModel):
    """Request to update a theme"""
    name: Optional[str] = None
    letters: Optional[List[str]] = None
    digraphs: Optional[List[str]] = None
    words: Optional[List[str]] = None


class AssignThemeToClassRequest(BaseModel):
    """Request to assign a theme to a class"""
    class_id: str
    theme_id: str
