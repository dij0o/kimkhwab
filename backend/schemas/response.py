from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, Any

# T represents whatever specific schema we are returning (e.g., EmployeeResponse)
T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    status: str
    status_code: int
    message: str
    data: Optional[T] = None