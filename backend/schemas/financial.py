from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from decimal import Decimal
from datetime import date, datetime

class InvoiceItemBase(BaseModel):
    service_id: int
    unit_price: Decimal
    quantity: int = 1
    employee_id: Optional[int] = None

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    customer_id: int
    employee_id: Optional[int] = None
    appointment_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    total_amount: Decimal
    paid: bool = False
    snapshot: Optional[Dict[str, Any]] = None

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemBase]

class InvoiceResponse(InvoiceBase):
    id: int
    created_at: datetime
    items: List[InvoiceItemResponse] = []
    model_config = ConfigDict(from_attributes=True)

class LedgerEntryBase(BaseModel):
    entry_date: Optional[date] = None
    type: str # 'income' or 'expense'
    amount: Decimal
    currency: str = "PKR"
    description: Optional[str] = None
    category: Optional[str] = None
    invoice_id: Optional[int] = None
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None

class LedgerEntryResponse(LedgerEntryBase):
    id: int
    is_deleted: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)