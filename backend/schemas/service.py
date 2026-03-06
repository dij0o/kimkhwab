from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# --- Service Category Schemas ---

class ServiceCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    is_active: Optional[bool] = True
    background_color: Optional[str] = '#3788d8'
    text_color: Optional[str] = '#ffffff'
    calendar_class: Optional[str] = None

class ServiceCategoryCreate(ServiceCategoryBase):
    pass

class ServiceCategoryResponse(ServiceCategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- Service Schemas ---

class ServiceBase(BaseModel):
    category_id: int
    name: str = Field(..., max_length=100)
    price: float = Field(..., ge=0)
    is_active: Optional[bool] = True

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
