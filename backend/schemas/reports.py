"""
Pydantic models for reporting and analytics
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class AttemptRecord(BaseModel):
    """Individual attempt record"""
    id: str
    activity_slug: str
    correct: bool
    latency_ms: Optional[int] = None
    hints_used: int
    created_at: str
    transcript: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class ActivityMastery(BaseModel):
    """Mastery level for an activity"""
    activity_slug: str
    attempts: int
    correct: int
    accuracy: float
    last_attempted: str


class DispositionMastery(BaseModel):
    """Mastery level for a learning disposition"""
    disposition_name: str
    activities: List[str]
    overall_accuracy: float


class ChildReportResponse(BaseModel):
    """Comprehensive report for a child"""
    child_id: str
    child_name: str
    total_attempts: int
    total_correct: int
    overall_accuracy: float
    all_attempts: List[AttemptRecord]
    activity_mastery: List[ActivityMastery]
    disposition_mastery: List[DispositionMastery]
