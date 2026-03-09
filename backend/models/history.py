from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class ServiceHistory(Base):
    __tablename__ = "service_history"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    service_name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    performed_on = Column(DateTime(timezone=True), server_default=func.now())
    employee_id = Column(Integer, ForeignKey("employees.id"))
    notes = Column(String)

class GalleryImage(Base):
    __tablename__ = "gallery_images"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    file_path = Column(String)
    taken_at = Column(DateTime(timezone=True))
    is_profile_picture = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())