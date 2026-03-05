from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.customer import Customer, CustomerProfile
from schemas.customer import CustomerCreate, CustomerResponse
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta
import math

router = APIRouter()

@router.post("/", response_model=APIResponse[CustomerResponse], status_code=status.HTTP_201_CREATED)
def create_customer(
    customer_in: CustomerCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user) # <--- Security Gatekeeper
):
    # Extract profile data before creating the customer
    profile_data = customer_in.profile
    customer_data = customer_in.model_dump(exclude={"profile"})
    
    # 1. Create the Customer
    db_customer = Customer(**customer_data)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # 2. Create the Customer Profile (if provided)
    if profile_data:
        db_profile = CustomerProfile(
            customer_id=db_customer.id,
            **profile_data.model_dump()
        )
        db.add(db_profile)
        db.commit()
        db.refresh(db_customer) # Refresh to load the newly attached profile

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
    # 1. Get the TOTAL count of records for the metadata
    total_records = db.query(Customer).count()
    
    # 2. Get the actual sliced data
    customers = db.query(Customer).offset(skip).limit(limit).all()
    
    # 3. Calculate pagination math
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
    
    # 4. Return the structured response
    return APIPaginatedResponse(
        status="success",
        status_code=status.HTTP_200_OK,
        message="Customers retrieved successfully.",
        data=customers,
        meta=meta
    )