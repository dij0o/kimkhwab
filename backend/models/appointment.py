from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class AppointmentSource(Base):
    __tablename__ = "appointment_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Null if walk-in
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    service_category_id = Column(Integer, ForeignKey("service_categories.id"), nullable=False)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="booked") # e.g., booked, completed, cancelled, no_show
    source_id = Column(Integer, ForeignKey("appointment_sources.id"), nullable=True)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships mapping back to your other tables
    customer = relationship("Customer")
    employee = relationship("Employee")
    category = relationship("ServiceCategory")
    source = relationship("AppointmentSource")