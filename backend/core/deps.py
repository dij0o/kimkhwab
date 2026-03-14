from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from core.database import get_db
from core.config import Configs
from models.employee import Employee

# This tells FastAPI where the login URL is, enabling the Swagger UI 'Authorize' button
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{Configs.API_V1_STR}/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Employee:
    """Validates the JWT token and returns the current logged-in employee."""
    try:
        # Decode the token
        payload = jwt.decode(
            token, Configs.SECRET_KEY, algorithms=[Configs.ALGORITHM]
        )
        
        # ==========================================
        # NEW SECURITY CHECK: Prevent refresh tokens 
        # from being used to access standard APIs
        # ==========================================
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type. Please use an access token.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        token_data_sub = payload.get("sub")
        if token_data_sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch the user from the database
    user = db.query(Employee).filter(Employee.id == int(token_data_sub)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user