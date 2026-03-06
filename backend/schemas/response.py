from pydantic import BaseModel
from typing import Generic, TypeVar, Optional, Any, List

# T represents whatever specific schema we are returning (e.g., EmployeeResponse)
T = TypeVar("T")

# Standard response for single items
class APIResponse(BaseModel, Generic[T]):
    status: str
    status_code: int
    message: str
    data: Optional[T] = None

# Metadata specifically for pagination
class PaginationMeta(BaseModel):
    total_records: int
    total_pages: int
    current_page: int
    limit: int
    has_next: bool
    has_prev: bool

# Response wrapper for lists
class APIPaginatedResponse(BaseModel, Generic[T]):
    status: str
    status_code: int
    message: str
    data: List[T]
    meta: PaginationMeta