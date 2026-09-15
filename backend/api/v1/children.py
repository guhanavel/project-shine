"""
Routes for child-related operations
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
import os
from supabase import create_client, Client
from schemas.children import ResolveChildByCodeRequest, ResolveChildResponse, ChildResponse

router = APIRouter(prefix="/children", tags=["Children"])

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


@router.post("/resolve-by-code", response_model=ResolveChildResponse)
async def resolve_child_by_code(
    request: ResolveChildByCodeRequest,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> ResolveChildResponse:
    """
    Resolve a child by their 6-character join code.
    
    This replaces the direct RPC call `resolve_child_by_join_code` from the frontend
    with a proper HTTP endpoint for better auditability and versioning.
    """
    try:
        # Validate authorization
        token = get_token_from_header(authorization)
        
        # Call Supabase RPC to resolve the child
        response = supabase.rpc(
            "resolve_child_by_join_code",
            {"p_join_code": request.join_code},
            headers={"Authorization": f"Bearer {token}"},
        ).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Child not found with that join code")
        
        child_data = response.data
        return ResolveChildResponse(
            success=True,
            child=ChildResponse(
                id=child_data.get("id"),
                name=child_data.get("name"),
                grade=child_data.get("grade"),
                avatar_url=child_data.get("avatar_url"),
                date_of_birth=child_data.get("date_of_birth"),
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resolving child: {str(e)}")
