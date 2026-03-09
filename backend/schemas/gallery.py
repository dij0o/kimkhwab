from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class GalleryImageResponse(BaseModel):
    id: int
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    file_path: str  # The relative URL the frontend will use to display the image
    taken_at: Optional[datetime] = None
    is_profile_picture: bool = False
    uploaded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)