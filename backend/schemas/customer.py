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

class CustomerProfileUpdate(BaseModel):
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
    phone_number: Optional[str] = None
    phone_is_primary: bool = False
    email: Optional[EmailStr] = None
    email_is_primary: bool = False
    media_consent: bool = True

class CustomerCreate(CustomerBase):
    profile: Optional[CustomerProfileBase] = None

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    instagram_handle: Optional[str] = None
    preferred_employee_id: Optional[int] = None
    date_of_birth: Optional[date] = None
    referral_source_id: Optional[int] = None
    profile_image_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    whatsapp_is_primary: Optional[bool] = None
    phone_number: Optional[str] = None
    phone_is_primary: Optional[bool] = None
    email: Optional[EmailStr] = None
    email_is_primary: Optional[bool] = None
    media_consent: Optional[bool] = None
    profile: Optional[CustomerProfileUpdate] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    visit_count: int = 0
    profile: Optional[CustomerProfileResponse] = None
    model_config = ConfigDict(from_attributes=True)