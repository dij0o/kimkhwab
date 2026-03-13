from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "info"

class NotificationCreate(NotificationBase):
    employee_id: int

class NotificationResponse(NotificationBase):
    id: int
    employee_id: int
    is_read: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)