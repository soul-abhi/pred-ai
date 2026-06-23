from fastapi import APIRouter
from app.schemas.predict_schema import HealthResponse
from app.core.model_registry import registry

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_loaded=registry.is_loaded,
        model_version=registry.version,
    )
