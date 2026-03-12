from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import os

# Core & Infrastructure Imports
from core.settings import settings
from core.database import engine, Base
from core.exceptions import custom_http_exception_handler, validation_exception_handler

# API Router Imports
from endpoints import (
    auth,
    employees,
    customers,
    services,
    appointments,
    financials,
    gallery
)

# ==========================================
# DATABASE INITIALIZATION
# ==========================================
# This automatically creates all your tables in PostgreSQL based on your models.
# (Note: For a production app later on, you will want to replace this single line 
# with Alembic migration scripts so you can alter tables without dropping them).
Base.metadata.create_all(bind=engine)


# ==========================================
# FASTAPI APPLICATION SETUP
# ==========================================
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Backend API for KimKhawb Hair Studio Management System"
)

# ==========================================
# STATIC FILE SERVING (MUST BE BEFORE ROUTERS)
# ==========================================
# Ensure the directory exists so FastAPI doesn't crash on startup
os.makedirs("uploads/gallery", exist_ok=True)
os.makedirs("uploads/employees", exist_ok=True)
# Mount the directory to the /static URL path
app.mount("/static", StaticFiles(directory="uploads"), name="static")


# ==========================================
# MIDDLEWARE (CORS)
# ==========================================
# This allows your frontend HTML/JS files to securely communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all headers (especially important for Authorization tokens)
)


# ==========================================
# EXCEPTION HANDLERS
# ==========================================
# This enforces the strict "JSend" JSON response format across the entire app
# so your frontend never receives a malformed error response.
app.add_exception_handler(StarletteHTTPException, custom_http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)


# ==========================================
# ROUTER MOUNTING
# ==========================================
# Here we attach all the modules we built to their specific URL paths.
# E.g., The auth router will be available at: http://localhost:8000/api/v1/auth

app.include_router(
    auth.router, 
    prefix=f"{settings.API_V1_STR}/auth", 
    tags=["Authentication"]
)

app.include_router(
    employees.router, 
    prefix=f"{settings.API_V1_STR}/employees", 
    tags=["Employees & HR"]
)

app.include_router(
    customers.router, 
    prefix=f"{settings.API_V1_STR}/customers", 
    tags=["Customers"]
)

app.include_router(
    services.router, 
    prefix=f"{settings.API_V1_STR}/services", 
    tags=["Services"]
)

app.include_router(
    appointments.router, 
    prefix=f"{settings.API_V1_STR}/appointments", 
    tags=["Appointments"]
)

app.include_router(
    financials.router, 
    prefix=f"{settings.API_V1_STR}/financials", 
    tags=["Financials"]
)

app.include_router(
    gallery.router, 
    prefix=f"{settings.API_V1_STR}/gallery", 
    tags=["Gallery"]
)

# ==========================================
# ROOT / HEALTH CHECK ENDPOINT
# ==========================================
@app.get("/", tags=["Health"])
def read_root():
    """
    A simple health-check endpoint to verify the API is online.
    """
    return {
        "status": "online",
        "message": f"Welcome to the {settings.PROJECT_NAME}",
        "version": settings.VERSION
    }