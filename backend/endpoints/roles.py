from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from core.deps import get_current_user
from models.employee import Employee, Role, Permission
from schemas.role import RoleCreate, RoleUpdate, RoleResponse
from schemas.response import APIResponse

router = APIRouter()

@router.get("/", response_model=APIResponse[List[RoleResponse]])
def get_roles(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    roles = db.query(Role).all()
    result = []
    
    for r in roles:
        # Count how many employees are currently assigned to this role
        user_count = db.query(Employee).filter(Employee.role_id == r.id).count()
        # Flatten the permission objects into a simple list of string codes for the frontend
        perms = [p.code for p in r.permissions]
        
        result.append(RoleResponse(
            id=r.id,
            name=r.name,
            description=r.description,
            permissions=perms,
            user_count=user_count
        ))
        
    return APIResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Roles retrieved successfully.", data=result
    )

@router.post("/", response_model=APIResponse[RoleResponse])
def create_role(
    role_in: RoleCreate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    # Ensure role name is unique
    if db.query(Role).filter(Role.name == role_in.name).first():
        raise HTTPException(status_code=400, detail="A role with this name already exists.")
        
    new_role = Role(name=role_in.name, description=role_in.description)
    
    # Map and auto-create permissions
    for code in role_in.permissions:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code)
            db.add(perm)
        new_role.permissions.append(perm)
        
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    
    return APIResponse(
        status="success", status_code=status.HTTP_201_CREATED,
        message="Role created successfully.", 
        data=RoleResponse(id=new_role.id, name=new_role.name, description=new_role.description, permissions=role_in.permissions, user_count=0)
    )

@router.put("/{id}", response_model=APIResponse[RoleResponse])
def update_role(
    id: int, 
    role_in: RoleUpdate, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
        
    if id == 1 and current_user.role_id != 1:
        raise HTTPException(status_code=403, detail="Only an Admin can modify the Admin role.")
        
    role.name = role_in.name
    role.description = role_in.description
    
    if role_in.permissions is not None:
        role.permissions.clear()
        for code in role_in.permissions:
            perm = db.query(Permission).filter(Permission.code == code).first()
            if not perm:
                perm = Permission(code=code)
                db.add(perm)
            role.permissions.append(perm)
            
    db.commit()
    
    user_count = db.query(Employee).filter(Employee.role_id == role.id).count()
    
    return APIResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Role updated successfully.", 
        data=RoleResponse(id=role.id, name=role.name, description=role.description, permissions=[p.code for p in role.permissions], user_count=user_count)
    )

@router.delete("/{id}", response_model=APIResponse[dict])
def delete_role(
    id: int, 
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    if id == 1:
        raise HTTPException(status_code=403, detail="Cannot delete the primary Admin role.")
        
    role = db.query(Role).filter(Role.id == id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
        
    user_count = db.query(Employee).filter(Employee.role_id == id).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete a role that has users assigned to it. Reassign users first.")
        
    db.delete(role)
    db.commit()
    
    return APIResponse(
        status="success", status_code=status.HTTP_200_OK,
        message="Role deleted successfully.", data={"id": id}
    )
