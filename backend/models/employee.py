from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

# Association Table for Role <-> Permissions Many-to-Many
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)
    description = Column(String)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    
    permissions = relationship("Permission", secondary=role_permissions)
    employees = relationship("Employee", back_populates="role")

class EmployeeType(Base):
    __tablename__ = "employee_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    designation = Column(String)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False) # Hashed
    role_id = Column(Integer, ForeignKey("roles.id"))
    type_id = Column(Integer, ForeignKey("employee_types.id"), nullable=False)
    specialties = Column(String)
    profile_image_path = Column(String)
    id_card_number = Column(String, unique=True)
    email = Column(String)
    mobile_number = Column(String)
    telephone_number = Column(String)
    address_line = Column(String)
    city = Column(String)
    province = Column(String)
    postal_code = Column(String)
    country = Column(String)
    salary = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role", back_populates="employees")
    employee_type = relationship("EmployeeType")