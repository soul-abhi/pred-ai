"""Training pipeline: 3 candidates + 5-fold CV + best model wins."""
import datetime
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from xgboost import XGBRegressor

from app.core.preprocess import FEATURES, TARGET, preprocess
from app.core.config import MODEL_DIR
from app.ml.generate_synthetic import generate_synthetic_data


def _build_candidates():
    return [
        ("LinearRegression", LinearRegression()),
        (
            "RandomForestRegressor",
            RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42, n_jobs=-1),
        ),
        (
            "XGBRegressor",
            XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05, random_state=42, verbosity=0),
        ),
    ]


def run_training(df: pd.DataFrame) -> dict:
    X, y, scaler = preprocess(df, fit=True)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    all_candidates = []
    best_model = None
    best_r2 = -np.inf
    best_name = ""

    for name, model in _build_candidates():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="r2", n_jobs=-1)
        cv_r2_mean = float(cv_scores.mean())
        cv_r2_std = float(cv_scores.std())

        candidate = {
            "name": name,
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "cv_r2_mean": round(cv_r2_mean, 4),
            "cv_r2_std": round(cv_r2_std, 4),
        }
        all_candidates.append(candidate)

        if r2 > best_r2:
            best_r2 = r2
            best_model = model
            best_name = name

    # Re-train winner on full train split for final artifact
    best_model.fit(X_train, y_train)
    y_pred_final = best_model.predict(X_test)

    mae_final = float(mean_absolute_error(y_test, y_pred_final))
    rmse_final = float(np.sqrt(mean_squared_error(y_test, y_pred_final)))
    r2_final = float(r2_score(y_test, y_pred_final))
    cv_final = cross_val_score(best_model, X, y, cv=5, scoring="r2", n_jobs=-1)

    # Feature importance
    if hasattr(best_model, "feature_importances_"):
        fi = dict(zip(FEATURES, best_model.feature_importances_.tolist()))
    elif hasattr(best_model, "coef_"):
        coefs = np.abs(best_model.coef_)
        fi = dict(zip(FEATURES, (coefs / coefs.sum()).tolist()))
    else:
        fi = {f: 0.25 for f in FEATURES}

    # Versioned artifact
    version = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    artifact_path = MODEL_DIR / f"model_{version}.joblib"
    joblib.dump({"model": best_model, "scaler": scaler, "version": version, "name": best_name}, artifact_path)

    # Also write latest pointer
    latest_path = MODEL_DIR / "latest.joblib"
    joblib.dump({"model": best_model, "scaler": scaler, "version": version, "name": best_name}, latest_path)

    return {
        "model_version": version,
        "winner": best_name,
        "mae": round(mae_final, 4),
        "rmse": round(rmse_final, 4),
        "r2": round(r2_final, 4),
        "cv_r2_mean": round(float(cv_final.mean()), 4),
        "cv_r2_std": round(float(cv_final.std()), 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "feature_importance": {k: round(v, 4) for k, v in fi.items()},
        "all_candidates": all_candidates,
    }


def train_on_synthetic() -> dict:
    df = generate_synthetic_data(n=500)
    return run_training(df)


def train_on_csv(path: str) -> dict:
    df = pd.read_csv(path)

    required = set(FEATURES + [TARGET])
    missing = required - set(df.columns)
    if missing:
        # Try mapping common aliases
        col_map = {
            "attendance": "attendance_percent",
            "study_hours": "study_hours_per_day",
            "sleep": "sleep_hours",
            "score": "final_score",
            "previous": "previous_score",
        }
        df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})
        missing = required - set(df.columns)
        if missing:
            raise ValueError(f"CSV is missing columns: {missing}. Required: {required}")

    df = df.dropna(subset=list(required))
    return run_training(df)
