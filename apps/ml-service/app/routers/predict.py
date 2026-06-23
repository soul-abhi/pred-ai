from fastapi import APIRouter, HTTPException
from anyio import to_thread
from app.schemas.predict_schema import PredictInput, PredictResponse
from app.core.model_registry import registry
from app.core.preprocess import score_to_grade

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
async def predict(body: PredictInput):
    if not registry.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded — run /train first")

    features = [
        body.attendance_percent,
        body.study_hours_per_day,
        body.previous_score,
        body.sleep_hours,
    ]

    # Offload CPU-bound prediction to a thread so the event loop stays free
    predicted_score = await to_thread.run_sync(lambda: registry.predict(features))
    predicted_score = round(float(predicted_score), 2)

    return PredictResponse(
        predicted_score=predicted_score,
        grade=score_to_grade(predicted_score),
        model_version=registry.version or "unknown",
    )
