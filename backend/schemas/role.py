from pydantic import BaseModel
from typing import List, Optional

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permissions: List[str] = []

class RoleUpdate(RoleBase):
    permissions: Optional[List[str]] = None

class RoleResponse(RoleBase):
    id: int
    permissions: List[str]
    user_count: int = 0