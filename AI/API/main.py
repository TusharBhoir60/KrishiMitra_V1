"""
AgriConnect ML Microservice — FastAPI Entry Point
Modular, phase-based ML API for agricultural intelligence.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

# ─────────────────────────────────────────
# App Initialization
# ─────────────────────────────────────────
app = FastAPI(
    title="AgriConnect ML Service",
    description="ML microservice providing price prediction, demand forecasting, and crop quality analysis.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────
# CORS — Allow Node.js backend origin
# ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Request Latency Logging Middleware
# ─────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    print(f"[{request.method}] {request.url.path} → {response.status_code} ({duration_ms}ms)")
    return response

# ─────────────────────────────────────────
# Global Exception Handler
# ─────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "detail": str(exc)},
    )

# ─────────────────────────────────────────
# Route Registration (imported after app to avoid circular deps)
# ─────────────────────────────────────────
from API.routes.Price import router as price_router       # noqa: E402
from API.routes.Demand import router as demand_router     # noqa: E402
from API.routes.Quality import router as quality_router   # noqa: E402

app.include_router(price_router,   prefix="/api/price",   tags=["Phase 1 — Price Prediction"])
app.include_router(demand_router,  prefix="/api/demand",  tags=["Phase 2 — Demand Forecasting"])
app.include_router(quality_router, prefix="/api/quality", tags=["Phase 3 — Crop Quality"])

# ─────────────────────────────────────────
# Health Check
# ─────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "agriconnect-ml",
        "version": "1.0.0",
        "phases": {
            "phase1_price_prediction": "active",
            "phase2_demand_forecasting": "active",
            "phase3_quality_detection": "active",
        },
    }

@app.get("/", tags=["System"])
async def root():
    return {"message": "AgriConnect ML Microservice", "docs": "/docs", "health": "/health"}