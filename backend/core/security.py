from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt # from pyjwt package
import bcrypt
from core.config import Configs

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if a plain text password matches the hash in the database."""
    # The hashed_password from db might be a string, bcrypt needs bytes
    encoded_hash = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
    encoded_password = plain_password.encode('utf-8')
    return bcrypt.checkpw(encoded_password, encoded_hash)

def get_password_hash(password: str) -> str:
    """Hashes a password for secure database storage."""
    encoded_password = password.encode('utf-8')
    return bcrypt.hashpw(encoded_password, bcrypt.gensalt()).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a short-lived JWT token for API access."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=Configs.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Notice we added "type": "access"
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, Configs.SECRET_KEY, algorithm=Configs.ALGORITHM)

def create_refresh_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a long-lived JWT token used strictly for getting new access tokens."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=Configs.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    # Notice we added "type": "refresh"
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, Configs.SECRET_KEY, algorithm=Configs.ALGORITHM)