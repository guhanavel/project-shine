"""
Pydantic models for attempt logging and analytics
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class LogAttemptRequest(BaseModel):
    """Request body for logging a learning attempt"""
    child_id: str
    activity_slug: str
    correct: bool
    latency_ms: Optional[int] = None
    hints_used: Optional[int] = 0
    transcript: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class AttemptResponse(BaseModel):
    """Response from attempt logging"""
    success: bool
    attempt_id: Optional[str] = None
    message: str = "Attempt logged successfully"
