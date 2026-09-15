"""
Routes for teacher dashboard and class management
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
import os
from supabase import create_client, Client
from schemas.classes import (
    ClassResponse, ClassStats, TeacherDashboardResponse,
    CreateClassRequest, UpdateClassRequest,
    AddChildToClassRequest, RemoveChildFromClassRequest
)

router = APIRouter(prefix="/teacher", tags=["Teacher"])

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


@router.get("/dashboard", response_model=TeacherDashboardResponse)
async def get_dashboard(
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> TeacherDashboardResponse:
    """
    Get the teacher's dashboard with all classes and aggregated statistics.
    
    Replaces multiple direct Supabase queries from the frontend with a single
    API endpoint that handles all the data fetching and aggregation on the backend.
    """
    try:
        # Validate authorization
        token = get_token_from_header(authorization)
        
        # Query classes for this teacher
        classes_response = supabase.table("classes").select("*").execute()
        classes_data = classes_response.data or []
        
        # Build class responses with stats
        class_responses = []
        total_children = 0
        total_attempts_week = 0
        total_correct_week = 0
        
        for class_data in classes_data:
            # Get class statistics
            stats_response = supabase.rpc(
                "get_class_statistics",
                {"p_class_id": class_data["id"]},
                headers={"Authorization": f"Bearer {token}"},
            ).execute()
            
            stats_data = stats_response.data or {}
            stats = ClassStats(
                total_children=stats_data.get("total_children", 0),
                active_this_week=stats_data.get("active_this_week", 0),
                total_attempts=stats_data.get("total_attempts", 0),
                average_accuracy=stats_data.get("average_accuracy", 0.0),
            )
            
            total_children += stats.total_children
            total_attempts_week += stats.total_attempts
            
            class_responses.append(ClassResponse(
                id=class_data["id"],
                name=class_data.get("name"),
                teacher_id=class_data.get("teacher_id"),
                join_code=class_data.get("join_code"),
                theme_id=class_data.get("theme_id"),
                created_at=class_data.get("created_at"),
                stats=stats,
            ))
        
        # Calculate overall accuracy (simplified)
        average_accuracy = (total_correct_week / total_attempts_week * 100) if total_attempts_week > 0 else 0.0
        
        return TeacherDashboardResponse(
            classes=class_responses,
            total_children=total_children,
            total_attempts_this_week=total_attempts_week,
            average_accuracy_this_week=average_accuracy,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dashboard: {str(e)}")


@router.post("/classes", response_model=ClassResponse)
async def create_class(
    request: CreateClassRequest,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> ClassResponse:
    """Create a new class for the teacher"""
    try:
        token = get_token_from_header(authorization)
        
        # Insert class into database
        response = supabase.table("classes").insert({
            "name": request.name,
            "theme_id": request.theme_id,
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create class")
        
        class_data = response.data[0]
        return ClassResponse(
            id=class_data["id"],
            name=class_data.get("name"),
            teacher_id=class_data.get("teacher_id"),
            join_code=class_data.get("join_code"),
            theme_id=class_data.get("theme_id"),
            created_at=class_data.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating class: {str(e)}")


@router.get("/classes/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: str,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> ClassResponse:
    """Get details of a specific class"""
    try:
        token = get_token_from_header(authorization)
        
        response = supabase.table("classes").select("*").eq("id", class_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        class_data = response.data[0]
        return ClassResponse(
            id=class_data["id"],
            name=class_data.get("name"),
            teacher_id=class_data.get("teacher_id"),
            join_code=class_data.get("join_code"),
            theme_id=class_data.get("theme_id"),
            created_at=class_data.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching class: {str(e)}")


@router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    request: UpdateClassRequest,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> ClassResponse:
    """Update a class"""
    try:
        token = get_token_from_header(authorization)
        
        update_data = {}
        if request.name:
            update_data["name"] = request.name
        if request.theme_id:
            update_data["theme_id"] = request.theme_id
        
        response = supabase.table("classes").update(update_data).eq("id", class_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        class_data = response.data[0]
        return ClassResponse(
            id=class_data["id"],
            name=class_data.get("name"),
            teacher_id=class_data.get("teacher_id"),
            join_code=class_data.get("join_code"),
            theme_id=class_data.get("theme_id"),
            created_at=class_data.get("created_at"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating class: {str(e)}")


@router.post("/classes/{class_id}/children", response_model=dict)
async def add_child_to_class(
    class_id: str,
    request: AddChildToClassRequest,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Add a child to a class"""
    try:
        token = get_token_from_header(authorization)
        
        response = supabase.table("class_children").insert({
            "class_id": class_id,
            "child_id": request.child_id,
        }).execute()
        
        return {"success": True, "message": "Child added to class"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding child to class: {str(e)}")


@router.delete("/classes/{class_id}/children/{child_id}", response_model=dict)
async def remove_child_from_class(
    class_id: str,
    child_id: str,
    authorization: Optional[str] = None,
    supabase: Client = Depends(get_supabase),
) -> dict:
    """Remove a child from a class"""
    try:
        token = get_token_from_header(authorization)
        
        supabase.table("class_children").delete().eq("class_id", class_id).eq("child_id", child_id).execute()
        
        return {"success": True, "message": "Child removed from class"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing child from class: {str(e)}")
