from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Permissions & Roles ---
class PermissionBase(BaseModel):
    code: str
    description: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    id: int
    permissions: List[PermissionResponse] = []
    model_config = ConfigDict(from_attributes=True)

class EmployeeTypeResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

# --- Employees ---
class EmployeeBase(BaseModel):
    full_name: str
    username: str
    role_id: Optional[int] = None
    type_id: int
    specialties: Optional[str] = None
    profile_image_path: Optional[str] = None
    id_card_number: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    telephone_number: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    salary: Optional[int] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    password: str  # Only required when creating

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    role: Optional[RoleResponse] = None
    employee_type: Optional[EmployeeTypeResponse] = None
    model_config = ConfigDict(from_attributes=True)