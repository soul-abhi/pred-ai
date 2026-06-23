"""Singleton model registry — loads model once at startup, reloads only when retrained."""
import joblib
import logging
from pathlib import Path
from typing import Optional
import numpy as np

from app.core.config import MODEL_DIR

logger = logging.getLogger(__name__)


class ModelRegistry:
    def __init__(self):
        self._model = None
        self._scaler = None
        self._version: Optional[str] = None
        self._name: Optional[str] = None

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def version(self) -> Optional[str]:
        return self._version

    @property
    def name(self) -> Optional[str]:
        return self._name

    def load(self, path: Optional[Path] = None) -> bool:
        target = path or MODEL_DIR / "latest.joblib"
        if not target.exists():
            logger.warning("No model artifact found at %s", target)
            return False
        try:
            artifact = joblib.load(target)
            self._model = artifact["model"]
            self._scaler = artifact["scaler"]
            self._version = artifact["version"]
            self._name = artifact.get("name", "unknown")
            logger.info("Loaded model version=%s name=%s", self._version, self._name)
            return True
        except Exception as e:
            logger.error("Failed to load model: %s", e)
            return False

    def predict(self, features: list[float]) -> float:
        if not self.is_loaded:
            raise RuntimeError("No model loaded")
        X = np.array([features])
        X_scaled = self._scaler.transform(X)
        return float(self._model.predict(X_scaled)[0])

    def feature_importances(self) -> dict[str, float]:
        if not self.is_loaded:
            raise RuntimeError("No model loaded")
        from app.core.preprocess import FEATURES
        model = self._model
        if hasattr(model, "feature_importances_"):
            fi = model.feature_importances_
        elif hasattr(model, "coef_"):
            fi = np.abs(model.coef_)
            fi = fi / fi.sum()
        else:
            fi = [0.25] * len(FEATURES)
        return dict(zip(FEATURES, [round(float(v), 4) for v in fi]))


# Module-level singleton
registry = ModelRegistry()
