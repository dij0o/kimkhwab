from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import BaseModel

from core.database import get_db
from core.config import Configs
from core.security import verify_password, create_access_token, create_refresh_token
from models.employee import Employee

router = APIRouter()

# Schema for the refresh endpoint body
class TokenRefreshRequest(BaseModel):
    refresh_token: str

@router.post("/login")
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(Employee).filter(Employee.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    # Generate BOTH tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,  # <--- Now returning the refresh token
        "token_type": "bearer",
        "user_id": user.id,
        "role_id": user.role_id
    }

@router.post("/refresh")
def refresh_token(request: TokenRefreshRequest, db: Session = Depends(get_db)):
    """
    Takes a valid refresh token and returns a fresh access token.
    """
    try:
        # 1. Decode the refresh token
        payload = jwt.decode(
            request.refresh_token, Configs.SECRET_KEY, algorithms=[Configs.ALGORITHM]
        )
        
        # 2. Verify it is actually a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        token_data_sub = payload.get("sub")
        if token_data_sub is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
            
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    # 3. Verify the user still exists and is active
    user = db.query(Employee).filter(Employee.id == int(token_data_sub)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found or inactive")
        
    # 4. Issue a new access token
    new_access_token = create_access_token(subject=user.id)
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }