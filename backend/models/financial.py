from sqlalchemy import Column, Integer, String, Boolean, Numeric, Date, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    paid = Column(Boolean, default=False)
    snapshot = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("InvoiceItem", back_populates="invoice")
    customer = relationship("Customer")
    employee = relationship("Employee")
    appointment = relationship("Appointment")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    employee_id = Column(Integer, ForeignKey("employees.id"))

    invoice = relationship("Invoice", back_populates="items")
    service = relationship("Service")

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(Integer, primary_key=True, index=True)
    entry_date = Column(Date, server_default=func.current_date())
    type = Column(String, nullable=False) # 'income' or 'expense'
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, default="PKR")
    description = Column(String)
    category = Column(String)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EmployeePayslip(Base):
    __tablename__ = "employee_payslips"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    snapshot = Column(JSONB, nullable=False)
    ledger_entry_id = Column(Integer, ForeignKey("ledger_entries.id"))
    generated_at = Column(DateTime(timezone=True), server_default=func.now())