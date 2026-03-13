from sqlalchemy.orm import Session
from models.notification import Notification

def create_in_app_notification(db: Session, employee_id: int, title: str, message: str, notif_type: str = "info"):
    """
    Utility to instantly create an in-app notification for a specific employee.
    notif_type can be: 'info', 'success', 'warning', 'danger'
    """
    new_notif = Notification(
        employee_id=employee_id,
        title=title,
        message=message,
        type=notif_type
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif