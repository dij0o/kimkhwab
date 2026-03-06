from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base

class ReferralSource(Base):
    __tablename__ = "referral_sources"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    instagram_handle = Column(String)
    preferred_employee_id = Column(Integer, ForeignKey("employees.id"))
    date_of_birth = Column(Date)
    referral_source_id = Column(Integer, ForeignKey("referral_sources.id"))
    profile_image_url = Column(String)
    
    whatsapp_number = Column(String)
    whatsapp_is_primary = Column(Boolean, default=False)
    mobile_number = Column(String)
    mobile_is_primary = Column(Boolean, default=False)
    email = Column(String)
    email_is_primary = Column(Boolean, default=False)
    media_permission = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    preferred_employee = relationship("Employee")
    referral_source = relationship("ReferralSource")
    profile = relationship("CustomerProfile", back_populates="customer", uselist=False)

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    preferences = Column(String)
    notes = Column(String)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="profile")