import os
import math
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.customer import Customer
from models.history import GalleryImage
from schemas.gallery import GalleryImageResponse
from schemas.response import APIResponse, APIPaginatedResponse, PaginationMeta

router = APIRouter()

# Define where physical images will be saved on the server
UPLOAD_DIR = "uploads/gallery"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=APIResponse[GalleryImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    customer_id: Optional[int] = Form(None),  # Form() is required to parse multipart/form-data from TS
    taken_at: Optional[datetime] = Form(None),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """
    Handles physical file uploads from the frontend (e.g., via Uppy/Dropzone) 
    and logs them in the database.
    """
    # 1. Validate file extension (Basic Security)
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPG, PNG, and WEBP are allowed.")

    # 2. Validate Customer if provided
    if customer_id:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found.")

    # 3. Create a unique filename to prevent overwriting
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp_str}_{file.filename.replace(' ', '_')}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)

    # 4. Save the physical file to disk safely
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file to disk: {str(e)}")
    finally:
        file.file.close()

    # 5. Save the record to PostgreSQL
    # We store a relative URL path. In the TS frontend, they will append this to their VITE_API_BASE_URL
    relative_url_path = f"/static/gallery/{unique_filename}"
    
    db_image = GalleryImage(
        customer_id=customer_id,
        employee_id=current_user.id,
        file_path=relative_url_path,
        taken_at=taken_at
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    return APIResponse(
        status="success",
        status_code=status.HTTP_201_CREATED,
        message="Image uploaded successfully.",
        data=db_image
    )

@router.get("/", response_model=APIPaginatedResponse[GalleryImageResponse])
def get_gallery(
    skip: int = 0, 
    limit: int = 50, 
    customer_id: Optional[int] = None, # Optional filter to view a specific customer's history
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Fetches a paginated list of uploaded images."""
    query = db.query(GalleryImage)
    
    if customer_id:
        query = query.filter(GalleryImage.customer_id == customer_id)
        
    total_records = query.count()
    images = query.order_by(GalleryImage.uploaded_at.desc()).offset(skip).limit(limit).all()

    current_page = (skip // limit) + 1 if limit > 0 else 1
    total_pages = math.ceil(total_records / limit) if limit > 0 else 1

    meta = PaginationMeta(
        total_records=total_records, total_pages=total_pages,
        current_page=current_page, limit=limit,
        has_next=current_page < total_pages, has_prev=current_page > 1
    )

    return APIPaginatedResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Gallery images retrieved successfully.",
        data=images, meta=meta
    )