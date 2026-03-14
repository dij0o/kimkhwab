import logging
from typing import Optional

from sqlalchemy.orm import Session

from core.database import SessionLocal
from models.notification import Notification

logger = logging.getLogger(__name__)


def create_in_app_notification(
    db: Session,
    employee_id: int,
    title: str,
    message: str,
    notif_type: str = "info"
) -> Optional[Notification]:
    """
    Utility to instantly create an in-app notification for a specific employee.
    notif_type can be: 'info', 'success', 'warning', 'danger'

    Notification writes are isolated in their own session so a failed notification
    does not undo or falsely fail the primary business action that triggered it.
    """
    notification_db = SessionLocal()

    try:
        new_notif = Notification(
            employee_id=employee_id,
            title=title,
            message=message,
            type=notif_type
        )
        notification_db.add(new_notif)
        notification_db.commit()
        notification_db.refresh(new_notif)
        return new_notif
    except Exception:
        notification_db.rollback()
        logger.exception(
            "Failed to create in-app notification for employee_id=%s with title=%s",
            employee_id,
            title
        )
        return None
    finally:
        notification_db.close()
