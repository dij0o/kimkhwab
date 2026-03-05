from pydantic import BaseModel, ConfigDict
from typing import Optional
from decimal import Decimal
from datetime import datetime
from .customer import CustomerResponse
from .employee import EmployeeResponse

# --- Services ---
class ServiceCategoryBase(BaseModel):
    name: str
    is_active: bool = True
    background_color: Optional[str] = "#3788d8"
    text_color: Optional[str] = "#ffffff"
    calendar_class: Optional[str] = None

class ServiceCategoryResponse(ServiceCategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ServiceBase(BaseModel):
    category_id: int
    name: str
    price: Decimal
    is_active: bool = True

class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime
    category: Optional[ServiceCategoryResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- Appointments ---
class AppointmentSourceResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class AppointmentBase(BaseModel):
    customer_id: Optional[int] = None
    employee_id: int
    service_category_id: int
    start_time: datetime
    end_time: datetime
    status: Optional[str] = "booked"
    source_id: Optional[int] = None
    notes: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    employee_id: Optional[int] = None

class AppointmentResponse(AppointmentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Nested responses to populate the calendar UI with names instead of just IDs
    customer: Optional[CustomerResponse] = None
    employee: Optional[EmployeeResponse] = None
    category: Optional[ServiceCategoryResponse] = None
    model_config = ConfigDict(from_attributes=True)