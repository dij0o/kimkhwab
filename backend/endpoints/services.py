import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.service import Service, ServiceCategory
from schemas.service import (
    ServiceCreate, ServiceResponse, 
    ServiceCategoryCreate, ServiceCategoryResponse
)
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta

router = APIRouter()

# --- Categories ---

@router.post("/categories", response_model=APIResponse[ServiceCategoryResponse], status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: ServiceCategoryCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    existing = db.query(ServiceCategory).filter(ServiceCategory.name == category_in.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name already exists.")
        
    db_category = ServiceCategory(**category_in.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message="Service category created successfully.",
        data=db_category
    )

@router.get("/categories", response_model=APIPaginatedResponse[ServiceCategoryResponse])
def get_categories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    total_records = db.query(ServiceCategory).count()
    categories = db.query(ServiceCategory).offset(skip).limit(limit).all()
    
    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1
    
    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )
    
    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Service categories retrieved successfully.",
        data=categories, meta=meta
    )

# --- Services ---

@router.post("/", response_model=APIResponse[ServiceResponse], status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    category = db.query(ServiceCategory).filter(ServiceCategory.id == service_in.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service Category not found.")
        
    db_service = Service(**service_in.model_dump())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    return APIResponse(
        status="success", status_code=status.HTTP_201_CREATED,
        message="Service created successfully.", data=db_service
    )

@router.get("/", response_model=APIPaginatedResponse[ServiceResponse])
def get_services(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    total_records = db.query(Service).count()
    services = db.query(Service).offset(skip).limit(limit).all()
    
    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1
    
    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )
    
    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Services retrieved successfully.",
        data=services, meta=meta
    )