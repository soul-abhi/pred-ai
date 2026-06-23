"""Generate synthetic student performance data using the same formula as the prototype."""
import numpy as np
import pandas as pd


FEATURES = ["attendance_percent", "study_hours_per_day", "previous_score", "sleep_hours"]
TARGET = "final_score"


def generate_synthetic_data(n: int = 500, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    attendance = rng.uniform(40, 100, n)
    study_hours = rng.uniform(0, 8, n)
    previous_score = rng.uniform(30, 100, n)
    sleep_hours = rng.uniform(4, 10, n)

    # Same weighted formula as prototype — preserves R²≈0.727 baseline
    noise = rng.normal(0, 5, n)
    score = (
        0.4 * attendance
        + 0.3 * study_hours * 10
        + 0.2 * previous_score
        + 0.1 * sleep_hours * 5
        + noise
    )
    score = np.clip(score, 0, 100)

    return pd.DataFrame({
        "attendance_percent": attendance,
        "study_hours_per_day": study_hours,
        "previous_score": previous_score,
        "sleep_hours": sleep_hours,
        TARGET: score,
    })
