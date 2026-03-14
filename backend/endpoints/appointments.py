from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.appointment import Appointment
from schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta

# IMPORT THE NOTIFICATION UTILITY
from utils.notifications import create_in_app_notification

router = APIRouter()

@router.post("/", response_model=APIResponse[AppointmentResponse], status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_in: AppointmentCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Validate times
    if appointment_in.end_time <= appointment_in.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="End time must be after the start time."
        )
        
    db_appointment = Appointment(**appointment_in.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    # ==========================================
    # EVENT TRIGGER: NEW BOOKING
    # ==========================================
    if db_appointment.employee_id:
        create_in_app_notification(
            db=db,
            employee_id=db_appointment.employee_id,
            title="New Appointment Booked",
            message=f"You have a new appointment scheduled for {db_appointment.start_time.strftime('%b %d at %I:%M %p')}.",
            notif_type="info"
        )
    
    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message="Appointment booked successfully.",
        data=db_appointment
    )

@router.get("/", response_model=APIPaginatedResponse[AppointmentResponse])
def get_appointments(
    start_date: datetime = None, 
    end_date: datetime = None, 
    customer_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    query = db.query(Appointment)
    
   # Apply filters
    if customer_id:
        query = query.filter(Appointment.customer_id == customer_id)
    if start_date:
        query = query.filter(Appointment.start_time >= start_date)
    if end_date:
        query = query.filter(Appointment.end_time <= end_date)
        
    # Get total count matching the filters
    total_records = query.count()
    
    # Fetch paginated slice
    appointments = query.order_by(Appointment.start_time.asc()).offset(skip).limit(limit).all()
    
    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1
    
    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )
    
    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message=f"Retrieved {len(appointments)} appointments.",
        data=appointments, meta=meta
    )

@router.put("/{appointment_id}", response_model=APIResponse[AppointmentResponse])
def update_appointment(
    appointment_id: int, 
    appointment_in: AppointmentUpdate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Used for rescheduling (dragging on calendar) or updating status."""
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    # Remember the original state BEFORE applying updates
    original_status = db_appointment.status
    original_start_time = db_appointment.start_time
        
    update_data = appointment_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_appointment, field, value)
        
    db.commit()
    db.refresh(db_appointment)

    # ==========================================
    # EVENT TRIGGERS: CANCELLATIONS & RESCHEDULING
    # ==========================================
    if db_appointment.employee_id:
        # 1. Did they cancel it?
        if original_status != "cancelled" and db_appointment.status == "cancelled":
            create_in_app_notification(
                db=db,
                employee_id=db_appointment.employee_id,
                title="Appointment Cancelled",
                message=f"An appointment on {original_start_time.strftime('%b %d at %I:%M %p')} has been cancelled.",
                notif_type="danger" # Red alert
            )
        # 2. Did they change the time?
        elif "start_time" in update_data and original_start_time != db_appointment.start_time:
            create_in_app_notification(
                db=db,
                employee_id=db_appointment.employee_id,
                title="Appointment Rescheduled",
                message=f"An appointment was moved to {db_appointment.start_time.strftime('%b %d at %I:%M %p')}.",
                notif_type="warning" # Yellow alert
            )
    
    return APIResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message="Appointment updated successfully.",
        data=db_appointment
    )