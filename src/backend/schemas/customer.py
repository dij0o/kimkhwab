from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import date, datetime

class ReferralSourceResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class CustomerProfileBase(BaseModel):
    preferences: Optional[str] = None
    notes: Optional[str] = None

class CustomerProfileResponse(CustomerProfileBase):
    id: int
    last_updated: datetime
    model_config = ConfigDict(from_attributes=True)

class CustomerBase(BaseModel):
    full_name: str
    instagram_handle: Optional[str] = None
    preferred_employee_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    referral_source_id: Optional[int] = None
    profile_image_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_is_primary: bool = False
    mobile_number: Optional[str] = None
    mobile_is_primary: bool = False
    email: Optional[EmailStr] = None
    email_is_primary: bool = False
    media_permission: bool = True

class CustomerCreate(CustomerBase):
    profile: Optional[CustomerProfileBase] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    profile: Optional[CustomerProfileResponse] = None
    # We can add preferred_employee and referral_source nested models here later if needed
    model_config = ConfigDict(from_attributes=True)