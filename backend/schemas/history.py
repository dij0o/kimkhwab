from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class HistoryEmployee(BaseModel):
    id: int
    full_name: str
    model_config = ConfigDict(from_attributes=True)

class ServiceHistoryResponse(BaseModel):
    id: int
    customer_id: int
    service_id: int
    service_name: str
    price: float
    performed_on: datetime
    employee_id: Optional[int] = None
    notes: Optional[str] = None
    employee: Optional[HistoryEmployee] = None
    
    model_config = ConfigDict(from_attributes=True)