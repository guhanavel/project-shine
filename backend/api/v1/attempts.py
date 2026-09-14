"""
Routes for attempt logging and analytics
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import os
from supabase import create_client, Client
from schemas.attempts import LogAttemptRequest, AttemptResponse

router = APIRouter(prefix="/attempts", tags=["Attempts"])

# Dependency to get Supabase client
async def get_supabase() -> Client:
    """Get authenticated Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
    if not supabase_url or not supabase_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    return create_client(supabase_url, supabase_key)


def get_token_from_header(authorization: Optional[str]) -> str:
    """Extract and validate Bearer token from Authorization header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.replace("Bearer ", "")
    if token.count(".") != 2:
        raise HTTPException(status_code=401, detail="Invalid token format")
    return token


@router.post("/log", response_model=AttemptResponse)
async def log_attempt(
    request: LogAttemptRequest,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> AttemptResponse:
    """
    Log a child's learning attempt to Supabase.
    
    This replaces the direct RPC call from the frontend with a proper HTTP endpoint
    that can be audited, versioned, and monitored.
    """
    try:
        # Validate authorization
        token = get_token_from_header(authorization)
        
        # Call Supabase RPC with the token
        response = supabase.rpc(
            "log_child_attempt",
            {
                "p_child_id": request.child_id,
                "p_activity_slug": request.activity_slug,
                "p_correct": request.correct,
                "p_latency_ms": request.latency_ms,
                "p_hints_used": request.hints_used or 0,
                "p_transcript": request.transcript,
                "p_meta": request.meta or {},
            },
            headers={"Authorization": f"Bearer {token}"},
        ).execute()
        
        return AttemptResponse(
            success=True,
            attempt_id=response.data.get("id") if response.data else None,
            message="Attempt logged successfully"
        )
    except Exception as e:
        # Log errors but don't break the child journey (fire-and-forget pattern)
        print(f"Error logging attempt: {str(e)}")
        return AttemptResponse(
            success=False,
            message="Attempt logged (with errors)"
        )
