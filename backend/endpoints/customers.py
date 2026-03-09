from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.customer import Customer, CustomerProfile
from models.appointment import Appointment
from schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta
from sqlalchemy import func
import math

router = APIRouter()

@router.post("/", response_model=APIResponse[CustomerResponse], status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    profile_data = customer_in.profile
    customer_data = customer_in.model_dump(exclude={"profile"})
    
    db_customer = Customer(**customer_data)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    if profile_data:
        db_profile = CustomerProfile(
            customer_id=db_customer.id,
            **profile_data.model_dump()
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_customer)

    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message=f"Customer '{db_customer.full_name}' created successfully.",
        data=db_customer
    )

@router.get("/", response_model=APIPaginatedResponse[CustomerResponse])
def get_customers(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # 1. Subquery for visit counts
    visit_count_subquery = (
        db.query(Appointment.customer_id, func.count(Appointment.id).label("visit_count"))
        .filter(Appointment.status == "completed")
        .group_by(Appointment.customer_id)
        .subquery()
    )

    # 2. Get TOTAL count
    total_records = db.query(Customer).count()
    
    # 3. Get sliced data with counts
    customers_with_counts = (
        db.query(Customer, func.coalesce(visit_count_subquery.c.visit_count, 0).label("visit_count"))
        .outerjoin(visit_count_subquery, Customer.id == visit_count_subquery.c.customer_id)
        .offset(skip).limit(limit).all()
    )
    
    # Map to schema
    data = []
    for customer, visit_count in customers_with_counts:
        customer_resp = CustomerResponse.model_validate(customer)
        customer_resp.visit_count = visit_count
        data.append(customer_resp)
    
    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1
    
    meta = PaginationMeta(
        total_records=total_records,
        total_pages=total_pages,
        current_page=current_page,
        limit=limit,
        has_next=current_page < total_pages,
        has_prev=current_page > 1
    )
    
    return APIPaginatedResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message="Customers retrieved successfully.",
        data=data,
        meta=meta
    )

@router.get("/{id}", response_model=APIResponse[CustomerResponse])
def get_customer(
    id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == id, Customer.is_active == True).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    visit_count = db.query(Appointment).filter(
        Appointment.customer_id == id, 
        Appointment.status == "completed"
    ).count()
    
    customer_resp = CustomerResponse.model_validate(customer)
    customer_resp.visit_count = visit_count
    
    return APIResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message="Customer profile retrieved successfully.",
        data=customer_resp
    )

@router.put("/{id}", response_model=APIResponse[CustomerResponse])
def update_customer(
    id: int,
    customer_in: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    db_customer = db.query(Customer).filter(Customer.id == id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # 1. Update main customer record
    update_data = customer_in.model_dump(exclude={"profile"}, exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)
    
    # 2. Update nested profile if provided
    if customer_in.profile:
        if db_customer.profile:
            # Update existing
            profile_update_data = customer_in.profile.model_dump(exclude_unset=True)
            for field, value in profile_update_data.items():
                setattr(db_customer.profile, field, value)
        else:
            # Create new
            db_profile = CustomerProfile(
                customer_id=id,
                **customer_in.profile.model_dump()
            )
            db.add(db_profile)
    
    db.commit()
    db.refresh(db_customer)
    
    return APIResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message=f"Customer '{db_customer.full_name}' updated successfully.",
        data=db_customer
    )

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_customer(
    id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    db_customer = db.query(Customer).filter(Customer.id == id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db.delete(db_customer) # Hard delete since is_active doesn't exist
    db.commit()
    
    return APIResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message="Customer deleted successfully.",
        data={"id": id}
    )