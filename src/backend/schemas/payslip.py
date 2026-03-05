from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import date, datetime

class EmployeePayslipCreate(BaseModel):
    employee_id: int
    period_start: date
    period_end: date
    basic_salary: float
    bonuses: float = 0.0
    deductions: float = 0.0
    notes: Optional[str] = None
    # If true, the API will automatically record this salary payout as an expense in the ledger
    record_in_ledger: bool = True 

class EmployeePayslipResponse(BaseModel):
    id: int
    employee_id: int
    period_start: date
    period_end: date
    snapshot: Dict[str, Any]
    ledger_entry_id: Optional[int] = None
    generated_at: datetime
    model_config = ConfigDict(from_attributes=True)