"""
Model Loader — Lazy singleton loader for all ML models.
Models are loaded once on first use and cached in memory.
Avoids cold-start delay by deferring loading until first request.
"""

import os
import joblib
from pathlib import Path
from typing import Tuple, Optional

# Optional TF import — only needed for Phase 3
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"


class ModelLoader:
    """
    Singleton-style lazy loader for all AgriConnect ML models.
    Thread-safe for FastAPI's async workers (models are read-only after load).
    """

    _price_model       = None
    _price_preprocessor = None
    _demand_model       = None
    _demand_preprocessor = None
    _quality_model      = None

    # ── Phase 1: Price Model ────────────────────────────────────────────────

    def get_price_model(self) -> Tuple:
        if self._price_model is None:
            model_path = MODELS_DIR / "price_model.joblib"
            prep_path  = MODELS_DIR / "price_preprocessor.joblib"

            if not model_path.exists():
                raise FileNotFoundError(f"Price model not found at {model_path}")
            if not prep_path.exists():
                raise FileNotFoundError(f"Price preprocessor not found at {prep_path}")

            print(f"[ModelLoader] Loading price model from {model_path}")
            ModelLoader._price_model        = joblib.load(model_path)
            ModelLoader._price_preprocessor = joblib.load(prep_path)

        return self._price_model, self._price_preprocessor

    # ── Phase 2: Demand Model ───────────────────────────────────────────────

    def get_demand_model(self) -> Tuple:
        if self._demand_model is None:
            model_path = MODELS_DIR / "demand_model.joblib"
            prep_path  = MODELS_DIR / "demand_preprocessor.joblib"

            if not model_path.exists():
                raise FileNotFoundError(f"Demand model not found at {model_path}")
            if not prep_path.exists():
                raise FileNotFoundError(f"Demand preprocessor not found at {prep_path}")

            print(f"[ModelLoader] Loading demand model from {model_path}")
            ModelLoader._demand_model        = joblib.load(model_path)
            ModelLoader._demand_preprocessor = joblib.load(prep_path)

        return self._demand_model, self._demand_preprocessor

    # ── Phase 3: Quality Model ──────────────────────────────────────────────

    def get_quality_model(self):
        if self._quality_model is None:
            if not TF_AVAILABLE:
                raise ImportError("TensorFlow not installed. Run: pip install tensorflow")

            model_path = MODELS_DIR / "quality_model.h5"
            if not model_path.exists():
                raise FileNotFoundError(f"Quality model not found at {model_path}")

            print(f"[ModelLoader] Loading quality model from {model_path}")
            ModelLoader._quality_model = tf.keras.models.load_model(str(model_path))

        return self._quality_model

    # ── Utility ─────────────────────────────────────────────────────────────

    @staticmethod
    def list_available_models() -> dict:
        available = {}
        for name, filename in [
            ("price",   "price_model.joblib"),
            ("demand",  "demand_model.joblib"),
            ("quality", "quality_model.h5"),
        ]:
            path = MODELS_DIR / filename
            available[name] = {
                "available": path.exists(),
                "path": str(path),
                "size_kb": round(path.stat().st_size / 1024, 1) if path.exists() else None,
            }
        return available