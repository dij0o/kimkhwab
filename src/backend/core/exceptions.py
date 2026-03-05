from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles manually raised HTTP exceptions (e.g., 404 Not Found, 400 Bad Request)"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "status_code": exc.status_code,
            "message": exc.detail,
            "data": None
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles Pydantic validation errors (e.g., missing fields, wrong data types)"""
    # Extracting a cleaner error message from Pydantic's default error array
    error_messages = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
    clean_message = "Validation Failed. " + " | ".join(error_messages)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "message": clean_message,
            "data": None
        }
    )