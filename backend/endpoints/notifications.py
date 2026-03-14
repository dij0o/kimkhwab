from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.notification import Notification
from schemas.notification import NotificationResponse
from schemas.response import APIResponse

router = APIRouter(tags=["Notifications"])

@router.get("/", response_model=APIResponse[list[NotificationResponse]])
def get_my_notifications(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(get_db), 
    current_user: Employee = Depends(get_current_user)
):
    """Fetch notifications for the currently logged-in user."""
    notifications = db.query(Notification)\
        .filter(Notification.employee_id == current_user.id)\
        .order_by(Notification.created_at.desc())\
        .offset(skip).limit(limit).all()
        
    return APIResponse(
        status="success", 
        status_code=status.HTTP_200_OK,
        message="Notifications retrieved successfully.", 
        data=notifications
    )

@router.put("/{id}/read", response_model=APIResponse[dict])
def mark_as_read(
    id: int, 
    db: Session = Depends(get_db), 
    current_user: Employee = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(Notification.id == id, Notification.employee_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    
    return APIResponse(status="success", status_code=status.HTTP_200_OK, message="Marked as read.", data={"id": id})

@router.put("/read-all", response_model=APIResponse[dict])
def mark_all_as_read(
    db: Session = Depends(get_db), 
    current_user: Employee = Depends(get_current_user)
):
    """Mark all unread notifications as read."""
    db.query(Notification)\
        .filter(Notification.employee_id == current_user.id, Notification.is_read == False)\
        .update({"is_read": True})
    db.commit()
    
    return APIResponse(status="success", status_code=status.HTTP_200_OK, message="All marked as read.", data={})
