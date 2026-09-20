"""
Pydantic models for authentication
"""
from pydantic import BaseModel
from typing import Optional


class TokenData(BaseModel):
    """Decoded token data"""
    user_id: str
    role: Optional[str] = None
    email: Optional[str] = None


class AuthUserResponse(BaseModel):
    """Authenticated user information"""
    user_id: str
    email: str
    role: str
    name: Optional[str] = None


class AuthErrorResponse(BaseModel):
    """Error response for auth failures"""
    detail: str
    status_code: int = 401
