from pydantic import BaseModel, Field
from typing import Optional


class PredictInput(BaseModel):
    attendance_percent: float = Field(..., ge=0, le=100, description="Attendance percentage (0–100)")
    study_hours_per_day: float = Field(..., ge=0, le=24, description="Study hours per day (0–24)")
    previous_score: float = Field(..., ge=0, le=100, description="Previous exam score (0–100)")
    sleep_hours: float = Field(..., ge=0, le=24, description="Sleep hours per day (0–24)")


class PredictResponse(BaseModel):
    predicted_score: float
    grade: str
    model_version: str


class TrainRequest(BaseModel):
    dataset_path: Optional[str] = None
    use_synthetic: bool = True


class TrainResponse(BaseModel):
    model_version: str
    mae: float
    rmse: float
    r2: float
    cv_r2_mean: float
    cv_r2_std: float
    n_train: int
    n_test: int
    feature_importance: dict[str, float]
    all_candidates: list[dict]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: Optional[str]
