import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.attendance import router as attendance_router
from app.api.v1.auth import router as auth_router
from app.api.v1.departments import router as departments_router
from app.api.v1.designations import router as designations_router
from app.api.v1.employees import router as employees_router
from app.api.v1.leave_balances import router as leave_balances_router
from app.api.v1.leave_policies import router as leave_policies_router
from app.api.v1.leave_requests import router as leave_requests_router
from app.api.v1.leave_types import router as leave_types_router
from app.api.v1.payroll import router as payroll_router
from app.api.v1.shifts import router as shifts_router
from app.core.config import settings
from app.db.session import engine

logger = logging.getLogger("app.main")

# Production safety: conditionally enable interactive API documentation
is_prod = settings.APP_ENV.lower() in ("production", "prod")
show_docs = (not is_prod) or settings.ENABLE_DOCS

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    docs_url="/docs" if show_docs else None,
    redoc_url="/redoc" if show_docs else None,
    openapi_url="/openapi.json" if show_docs else None,
)

# Parse explicit CORS origins from configuration
cors_origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
]

# Ensure no wildcard origins are combined with credentials
if "*" in cors_origins:
    cors_origins = [o for o in cors_origins if o != "*"]

cors_kwargs = {
    "allow_origins": cors_origins,
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
}

if settings.CORS_ORIGIN_REGEX:
    cors_kwargs["allow_origin_regex"] = settings.CORS_ORIGIN_REGEX

app.add_middleware(
    CORSMiddleware,
    **cors_kwargs,
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject standard HTTP security headers into every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "frame-ancestors 'none';"
    )

    # Enable HSTS only for HTTPS requests or in production
    is_https = (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
        or is_prod
    )
    if is_https:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Prevent unhandled internal server errors from leaking tracebacks, schema details, or secrets."""
    logger.exception("Unhandled server exception processing %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred."},
    )


# Register API v1 routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(employees_router, prefix="/api/v1")
app.include_router(departments_router, prefix="/api/v1")
app.include_router(designations_router, prefix="/api/v1")
app.include_router(shifts_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(payroll_router, prefix="/api/v1")
app.include_router(leave_types_router, prefix="/api/v1")
app.include_router(leave_policies_router, prefix="/api/v1")
app.include_router(leave_balances_router, prefix="/api/v1")
app.include_router(leave_requests_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
    }


@app.get("/health/db", tags=["Health"])
def database_health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        return {
            "status": "ok",
            "database": "connected",
        }
    except Exception as exc:
        logger.exception("Database health check failed: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "database": "unreachable",
            },
        )


if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
