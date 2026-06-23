import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from typing import Tuple

FEATURES = ["attendance_percent", "study_hours_per_day", "previous_score", "sleep_hours"]
TARGET = "final_score"


def preprocess(df: pd.DataFrame, scaler: StandardScaler | None = None, fit: bool = False):
    """Return scaled X, optional y, and the (possibly fitted) scaler."""
    X = df[FEATURES].copy()

    if fit or scaler is None:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
    else:
        X_scaled = scaler.transform(X)

    y = df[TARGET].values if TARGET in df.columns else None
    return X_scaled, y, scaler


def score_to_grade(score: float) -> str:
    if score >= 90:
        return "A"
    elif score >= 75:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 50:
        return "D"
    return "F"
