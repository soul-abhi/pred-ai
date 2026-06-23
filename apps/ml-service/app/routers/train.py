from fastapi import APIRouter, HTTPException
from anyio import to_thread
from app.schemas.predict_schema import TrainRequest, TrainResponse
from app.core.model_registry import registry
from app.ml.train_pipeline import train_on_synthetic, train_on_csv

router = APIRouter()


@router.post("/train", response_model=TrainResponse)
async def train(body: TrainRequest):
    def _train():
        if body.dataset_path:
            return train_on_csv(body.dataset_path)
        return train_on_synthetic()

    try:
        result = await to_thread.run_sync(_train)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")

    # Hot-reload the registry with the new model
    registry.load()

    return TrainResponse(**{k: v for k, v in result.items() if k != "winner"})


@router.get("/feature-importance")
def feature_importance():
    if not registry.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"feature_importance": registry.feature_importances()}
