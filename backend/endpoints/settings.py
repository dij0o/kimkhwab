from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee
from models.setting import SystemSetting
from schemas.setting import SettingsUpdate
from schemas.response import APIResponse

router = APIRouter()

@router.get("/", response_model=APIResponse[dict])
def get_settings(
    db: Session = Depends(get_db), 
    current_user: Employee = Depends(get_current_user)
):
    # Security: Only admins can view system settings
    if current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized to view system settings.")
        
    settings = db.query(SystemSetting).all()
    # Convert list of rows into a simple key:value dictionary for the frontend
    settings_dict = {s.key: (s.value or "") for s in settings}
    
    return APIResponse(
        status="success", 
        status_code=status.HTTP_200_OK, 
        message="Settings retrieved.", 
        data=settings_dict
    )

@router.put("/", response_model=APIResponse[dict])
def update_settings(
    settings_in: SettingsUpdate, 
    db: Session = Depends(get_db), 
    current_user: Employee = Depends(get_current_user)
):
    # Security: Only admins can update system settings
    if current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Not authorized to modify system settings.")
        
    for item in settings_in.settings:
        setting = db.query(SystemSetting).filter(SystemSetting.key == item.key).first()
        if setting:
            setting.value = item.value
        else:
            # Auto-create the key if it doesn't exist yet
            new_setting = SystemSetting(key=item.key, value=item.value)
            db.add(new_setting)
            
    db.commit()
    
    # Return updated dictionary
    updated = db.query(SystemSetting).all()
    return APIResponse(
        status="success", 
        status_code=status.HTTP_200_OK, 
        message="System configurations saved successfully.", 
        data={s.key: s.value for s in updated}
    )