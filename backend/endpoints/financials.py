import calendar
from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload
from typing import List

from core.config import Configs
from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.customer import Customer
from models.appointment import Appointment
from models.service import Service, ServiceCategory
from models.financial import Invoice, InvoiceItem, LedgerEntry
from schemas.dashboard import (
    DashboardChartResponse,
    DashboardChartSeries,
    DashboardCountMetric,
    DashboardMetricsResponse,
    DashboardMoneyMetric,
    DashboardRangeSummary,
    DashboardResponse
)
from schemas.financial import (
    InvoiceCreate, InvoiceResponse, 
    LedgerEntryResponse, LedgerEntryBase
)
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta
import math

router = APIRouter()
BUSINESS_TIMEZONE = ZoneInfo(Configs.BUSINESS_TIMEZONE)


def _format_range_label(start_date: date, end_date: date) -> str:
    return f"{start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}"


def _resolve_dashboard_range(
    start_date: date | None,
    end_date: date | None
) -> tuple[date, date, date, date]:
    today = datetime.now(BUSINESS_TIMEZONE).date()
    resolved_end = end_date or today
    resolved_start = start_date or (resolved_end - timedelta(days=29))

    if resolved_start > resolved_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be on or before end_date."
        )

    range_length = (resolved_end - resolved_start).days + 1
    comparison_end = resolved_start - timedelta(days=1)
    comparison_start = comparison_end - timedelta(days=range_length - 1)

    return resolved_start, resolved_end, comparison_start, comparison_end


def _resolve_month_to_date_range(today: date) -> tuple[date, date, date, date]:
    current_start = today.replace(day=1)
    current_end = today

    if current_start.month == 1:
        previous_month = 12
        previous_year = current_start.year - 1
    else:
        previous_month = current_start.month - 1
        previous_year = current_start.year

    previous_start = date(previous_year, previous_month, 1)
    previous_month_last_day = calendar.monthrange(previous_year, previous_month)[1]
    previous_end_day = min(today.day, previous_month_last_day)
    previous_end = date(previous_year, previous_month, previous_end_day)

    return current_start, current_end, previous_start, previous_end


def _calculate_trend_percentage(
    current_total: Decimal | int,
    previous_total: Decimal | int
) -> float | None:
    current_value = float(current_total)
    previous_value = float(previous_total)

    if previous_value == 0:
        if current_value == 0:
            return None
        return 100.0

    return round(((current_value - previous_value) / previous_value) * 100, 1)


def _get_ledger_totals(
    db: Session,
    start_date: date,
    end_date: date
) -> tuple[Decimal, Decimal]:
    totals = db.query(
        func.coalesce(
            func.sum(case((LedgerEntry.type == "income", LedgerEntry.amount), else_=0)),
            0
        ).label("income_total"),
        func.coalesce(
            func.sum(case((LedgerEntry.type == "expense", LedgerEntry.amount), else_=0)),
            0
        ).label("expense_total")
    ).filter(
        LedgerEntry.is_deleted == False,
        LedgerEntry.entry_date >= start_date,
        LedgerEntry.entry_date <= end_date
    ).one()

    return Decimal(totals.income_total or 0), Decimal(totals.expense_total or 0)


def _get_appointment_count(
    db: Session,
    start_date: date,
    end_date: date
) -> int:
    return (
        db.query(func.count(Appointment.id))
        .filter(
            func.date(Appointment.start_time) >= start_date,
            func.date(Appointment.start_time) <= end_date,
            Appointment.status.notin_(["cancelled", "no_show"])
        )
        .scalar()
        or 0
    )


def _build_dashboard_chart(
    db: Session,
    start_date: date,
    end_date: date
) -> DashboardChartResponse:
    bucket_dates = [
        start_date + timedelta(days=offset)
        for offset in range((end_date - start_date).days + 1)
    ]
    categories = [bucket.strftime("%b %d") for bucket in bucket_dates]
    bucket_lookup = {bucket: index for index, bucket in enumerate(bucket_dates)}

    rows = (
        db.query(
            func.date(Appointment.start_time).label("bucket_date"),
            ServiceCategory.name.label("category_name"),
            func.count(Appointment.id).label("appointment_total")
        )
        .join(ServiceCategory, ServiceCategory.id == Appointment.service_category_id)
        .filter(
            func.date(Appointment.start_time) >= start_date,
            func.date(Appointment.start_time) <= end_date,
            Appointment.status.notin_(["cancelled", "no_show"])
        )
        .group_by(func.date(Appointment.start_time), ServiceCategory.name)
        .order_by(func.date(Appointment.start_time).asc(), ServiceCategory.name.asc())
        .all()
    )

    chart_map: dict[str, list[int]] = {}

    for row in rows:
        if row.category_name not in chart_map:
            chart_map[row.category_name] = [0] * len(bucket_dates)

        bucket_index = bucket_lookup.get(row.bucket_date)
        if bucket_index is not None:
            chart_map[row.category_name][bucket_index] = int(row.appointment_total)

    ordered_series = sorted(
        chart_map.items(),
        key=lambda item: sum(item[1]),
        reverse=True
    )

    series = [
        DashboardChartSeries(name=category_name, data=data_points)
        for category_name, data_points in ordered_series
    ]

    return DashboardChartResponse(
        categories=categories,
        series=series,
        metric_label="Appointments",
        group_label="Service Categories"
    )


# ==========================================
# DASHBOARD
# ==========================================

@router.get("/dashboard", response_model=APIResponse[DashboardResponse])
def get_dashboard_overview(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    today = datetime.now(BUSINESS_TIMEZONE).date()
    (
        current_month_start,
        current_month_end,
        previous_month_start,
        previous_month_end
    ) = _resolve_month_to_date_range(today)

    (
        resolved_start,
        resolved_end,
        comparison_start,
        comparison_end
    ) = _resolve_dashboard_range(start_date, end_date)

    current_income, current_expenses = _get_ledger_totals(db, current_month_start, current_month_end)
    previous_income, previous_expenses = _get_ledger_totals(db, previous_month_start, previous_month_end)

    current_revenue = current_income - current_expenses
    previous_revenue = previous_income - previous_expenses

    current_appointments = _get_appointment_count(db, current_month_start, current_month_end)
    previous_appointments = _get_appointment_count(db, previous_month_start, previous_month_end)

    upcoming_appointments = (
        db.query(Appointment)
        .options(
            joinedload(Appointment.customer),
            joinedload(Appointment.employee),
            joinedload(Appointment.category)
        )
        .filter(
            Appointment.status == "booked",
            Appointment.start_time >= datetime.now(BUSINESS_TIMEZONE)
        )
        .order_by(Appointment.start_time.asc())
        .limit(5)
        .all()
    )

    dashboard_data = DashboardResponse(
        kpi_range=DashboardRangeSummary(
            start_date=current_month_start,
            end_date=current_month_end,
            label=_format_range_label(current_month_start, current_month_end),
            comparison_start_date=previous_month_start,
            comparison_end_date=previous_month_end,
            comparison_label=_format_range_label(previous_month_start, previous_month_end)
        ),
        range=DashboardRangeSummary(
            start_date=resolved_start,
            end_date=resolved_end,
            label=_format_range_label(resolved_start, resolved_end),
            comparison_start_date=comparison_start,
            comparison_end_date=comparison_end,
            comparison_label=_format_range_label(comparison_start, comparison_end)
        ),
        metrics=DashboardMetricsResponse(
            income=DashboardMoneyMetric(
                total=current_income,
                previous_total=previous_income,
                trend_percentage=_calculate_trend_percentage(current_income, previous_income)
            ),
            expenses=DashboardMoneyMetric(
                total=current_expenses,
                previous_total=previous_expenses,
                trend_percentage=_calculate_trend_percentage(current_expenses, previous_expenses)
            ),
            net_revenue=DashboardMoneyMetric(
                total=current_revenue,
                previous_total=previous_revenue,
                trend_percentage=_calculate_trend_percentage(current_revenue, previous_revenue)
            ),
            appointments_in_range=DashboardCountMetric(
                total=current_appointments,
                previous_total=previous_appointments,
                trend_percentage=_calculate_trend_percentage(current_appointments, previous_appointments)
            )
        ),
        chart=_build_dashboard_chart(db, resolved_start, resolved_end),
        upcoming_appointments=upcoming_appointments
    )

    return APIResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message="Dashboard analytics retrieved successfully.",
        data=dashboard_data
    )

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
    customer = db.query(Customer).filter(
        Customer.id == invoice_in.customer_id,
        Customer.is_active == True
    ).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Customer with ID {invoice_in.customer_id} not found."
        )

    # 2. Extract items and prepare the main invoice data
    items_data = invoice_in.items
    invoice_dict = invoice_in.model_dump(exclude={"items", "snapshot"})
    appointment = None

    if invoice_in.appointment_id is not None:
        appointment = db.query(Appointment).filter(Appointment.id == invoice_in.appointment_id).first()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {invoice_in.appointment_id} not found."
            )

        if appointment.status in {"cancelled", "no_show"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create an invoice for an appointment marked as {appointment.status}."
            )

        existing_invoice = db.query(Invoice).filter(Invoice.appointment_id == appointment.id).first()
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Appointment #{appointment.id} already has invoice #{existing_invoice.id}."
            )

        if appointment.customer_id is not None and appointment.customer_id != customer.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The selected customer does not match the linked appointment."
            )

        if appointment.customer_id is None:
            appointment.customer_id = customer.id

        if invoice_dict.get("employee_id") is None:
            invoice_dict["employee_id"] = appointment.employee_id

        appointment.status = "completed"
    
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
