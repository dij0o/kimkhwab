from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.customer import Customer
from models.service import Service
from models.financial import Invoice, InvoiceItem, LedgerEntry
from schemas.financial import (
    InvoiceCreate, InvoiceResponse, 
    LedgerEntryResponse, LedgerEntryBase
)
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta
import math

router = APIRouter()

# ==========================================
# INVOICES
# ==========================================

@router.post("/invoices", response_model=APIResponse[InvoiceResponse], status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: InvoiceCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Creates a new invoice, attaches the line items, generates an immutable JSONB 
    snapshot of the transaction, and automatically updates the ledger if paid.
    """
    # 1. Verify the customer exists
    customer = db.query(Customer).filter(Customer.id == invoice_in.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Customer with ID {invoice_in.customer_id} not found."
        )

    # 2. Extract items and prepare the main invoice data
    items_data = invoice_in.items
    invoice_dict = invoice_in.model_dump(exclude={"items", "snapshot"})
    
    # 3. Build the immutable snapshot (capturing exact names/details at this moment in time)
    snapshot = {
        "customer_name": customer.full_name,
        "cashier_username": current_user.username,
        "items": []
    }

    # 4. Create the Invoice
    db_invoice = Invoice(**invoice_dict, snapshot=snapshot)
    db.add(db_invoice)
    db.flush() # Flush to get the db_invoice.id without committing yet

    # 5. Process Invoice Items
    for item in items_data:
        # Verify service exists to capture its name for the snapshot
        service = db.query(Service).filter(Service.id == item.service_id).first()
        if not service:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Service with ID {item.service_id} does not exist."
            )
            
        db_item = InvoiceItem(invoice_id=db_invoice.id, **item.model_dump())
        db.add(db_item)
        
        # Add to snapshot
        snapshot["items"].append({
            "service_name": service.name,
            "unit_price": float(item.unit_price),
            "quantity": item.quantity
        })

    # Update the invoice with the final snapshot
    db_invoice.snapshot = snapshot

    # 6. Automate the Ledger Entry (If the invoice is paid immediately)
    if db_invoice.paid:
        ledger_entry = LedgerEntry(
            type="income",
            amount=db_invoice.total_amount,
            description=f"Payment for Invoice #{db_invoice.id}",
            category="service_sale",
            invoice_id=db_invoice.id,
            customer_id=db_invoice.customer_id,
            employee_id=current_user.id
        )
        db.add(ledger_entry)

    db.commit()
    db.refresh(db_invoice)

    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message="Invoice created successfully.",
        data=db_invoice
    )

@router.get("/invoices", response_model=APIPaginatedResponse[InvoiceResponse])
def get_invoices(
    skip: int = 0, 
    limit: int = 50, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    total_records = db.query(Invoice).count()
    invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    
    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1
    
    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )
    
    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Invoices retrieved successfully.",
        data=invoices, meta=meta
    )

# ==========================================
# LEDGER (BOOKKEEPING)
# ==========================================

@router.post("/ledger", response_model=APIResponse[LedgerEntryResponse], status_code=status.HTTP_201_CREATED)
def create_manual_ledger_entry(
    entry_in: LedgerEntryBase, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Allows managers to record manual expenses (like buying salon supplies, paying rent)
    or other manual income sources.
    """
    if entry_in.type not in ["income", "expense"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Ledger entry type must be either 'income' or 'expense'."
        )

    db_entry = LedgerEntry(**entry_in.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)

    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message=f"Manual {entry_in.type} entry recorded successfully.",
        data=db_entry
    )

@router.get("/ledger", response_model=APIPaginatedResponse[LedgerEntryResponse])
def get_ledger_entries(
    skip: int = 0, 
    limit: int = 100, 
    entry_type: str = None, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(LedgerEntry).filter(LedgerEntry.is_deleted == False)
    
    if entry_type:
        query = query.filter(LedgerEntry.type == entry_type)
        
    total_records = query.count()
    entries = query.order_by(LedgerEntry.entry_date.desc()).offset(skip).limit(limit).all()

    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1
    
    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )

    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Ledger entries retrieved successfully.",
        data=entries, meta=meta
    )