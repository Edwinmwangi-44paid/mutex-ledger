import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.ledger import WalletResponse


class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="User unique email address")
    password: str = Field(..., min_length=6, description="User password (min 6 chars)")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    user_id: uuid.UUID
    email: str
    wallet: Optional[WalletResponse] = None


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: str
    created_at: datetime
    wallet: Optional[WalletResponse] = None

    model_config = {"from_attributes": True}
