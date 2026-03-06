import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.security import get_password_hash
from core.deps import get_current_user
from models.employee import Employee
from models.financial import EmployeePayslip, LedgerEntry
from schemas.employee import EmployeeCreate, EmployeeResponse
from schemas.payslip import EmployeePayslipCreate, EmployeePayslipResponse
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta

router = APIRouter()

# ==========================================
# STAFF MANAGEMENT
# ==========================================

@router.post("/", response_model=APIResponse[EmployeeResponse], status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # 1. Check for duplicate username
    existing_user = db.query(Employee).filter(Employee.username == employee_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="An employee with this username already exists."
        )

    # 2. Hash the password before saving
    employee_data = employee_in.model_dump()
    employee_data["password"] = get_password_hash(employee_data["password"])

    # 3. Save to database
    db_employee = Employee(**employee_data)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)

    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message=f"Employee '{db_employee.full_name}' created successfully.",
        data=db_employee
    )

@router.get("/", response_model=APIPaginatedResponse[EmployeeResponse])
def get_employees(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    total_records = db.query(Employee).count()
    employees = db.query(Employee).offset(skip).limit(limit).all()

    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1

    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )

    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Employees retrieved successfully.",
        data=employees, meta=meta
    )

# ==========================================
# PAYSLIPS & SALARY
# ==========================================

@router.post("/payslips", response_model=APIResponse[EmployeePayslipResponse], status_code=status.HTTP_201_CREATED)
def generate_payslip(
    payslip_in: EmployeePayslipCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # 1. Verify employee exists
    employee = db.query(Employee).filter(Employee.id == payslip_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    # 2. Calculate net salary
    net_salary = payslip_in.basic_salary + payslip_in.bonuses - payslip_in.deductions

    # 3. Build the immutable JSONB snapshot
    snapshot = {
        "employee_name": employee.full_name,
        "employee_role_id": employee.role_id,
        "basic_salary": payslip_in.basic_salary,
        "bonuses": payslip_in.bonuses,
        "deductions": payslip_in.deductions,
        "net_salary": net_salary,
        "notes": payslip_in.notes,
        "generated_by_username": current_user.username
    }

    # 4. Automate Bookkeeping (Record as Salon Expense)
    ledger_entry_id = None
    if payslip_in.record_in_ledger:
        ledger_entry = LedgerEntry(
            type="expense",
            amount=net_salary,
            description=f"Salary payout for {employee.full_name} ({payslip_in.period_start} to {payslip_in.period_end})",
            category="salary",
            employee_id=employee.id
        )
        db.add(ledger_entry)
        db.flush() # Get the ledger ID without committing yet
        ledger_entry_id = ledger_entry.id

    # 5. Save the Payslip
    db_payslip = EmployeePayslip(
        employee_id=employee.id,
        period_start=payslip_in.period_start,
        period_end=payslip_in.period_end,
        snapshot=snapshot,
        ledger_entry_id=ledger_entry_id
    )
    db.add(db_payslip)
    db.commit()
    db.refresh(db_payslip)

    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message=f"Payslip for {employee.full_name} generated successfully.",
        data=db_payslip
    )

@router.get("/payslips", response_model=APIPaginatedResponse[EmployeePayslipResponse])
def get_payslips(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    total_records = db.query(EmployeePayslip).count()
    payslips = db.query(EmployeePayslip).order_by(EmployeePayslip.generated_at.desc()).offset(skip).limit(limit).all()

    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1

    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )

    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Payslips retrieved successfully.",
        data=payslips, meta=meta
    )