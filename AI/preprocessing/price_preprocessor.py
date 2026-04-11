"""
Price Preprocessor — Feature Engineering Pipeline for Phase 1
Handles encoding, scaling, and feature construction for price prediction.
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, OrdinalEncoder
from sklearn.impute import SimpleImputer
from typing import Union
import joblib


# ─────────────────────────────────────────
# Feature Schema
# ─────────────────────────────────────────

CATEGORICAL_FEATURES = ["cropName", "state", "district", "season"]
NUMERICAL_FEATURES   = ["quantity", "month", "historicalAvgPrice",
                         "quantity_log", "month_sin", "month_cos",
                         "is_peak_season"]
TARGET_COLUMN        = "price_per_kg"

# Crops that typically have high seasonality (used for is_peak_season flag)
SEASONAL_PEAKS = {
    "Tomato":     [11, 12, 1, 2],
    "Onion":      [3, 4, 5],
    "Potato":     [1, 2, 3],
    "Mango":      [4, 5, 6],
    "Watermelon": [4, 5, 6],
}


# ─────────────────────────────────────────
# Feature Engineering Functions
# ─────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply all feature engineering transformations to a DataFrame.
    Called during both training (fit_transform) and inference (transform).
    """
    df = df.copy()

    # Log-transform quantity to reduce skew
    df["quantity_log"] = np.log1p(df["quantity"])

    # Cyclical encoding for month (preserves circular nature Jan→Dec→Jan)
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    # Peak season flag — crop-specific
    def is_peak(row):
        peaks = SEASONAL_PEAKS.get(row["cropName"], [])
        return 1 if row["month"] in peaks else 0
    df["is_peak_season"] = df.apply(is_peak, axis=1)

    # Fill missing historical price with 0 (handled by imputer later)
    df["historicalAvgPrice"] = df["historicalAvgPrice"].fillna(0.0)

    return df


# ─────────────────────────────────────────
# Sklearn Pipeline Builder
# ─────────────────────────────────────────

def build_price_preprocessor() -> ColumnTransformer:
    """
    Build and return the sklearn preprocessing pipeline.
    Handles categorical encoding + numerical scaling in one transformer.
    """
    # Numerical sub-pipeline: impute missing → scale
    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])

    # Categorical sub-pipeline: impute missing → one-hot encode
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline,  NUMERICAL_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )

    return preprocessor


# ─────────────────────────────────────────
# Inference Wrapper Class
# ─────────────────────────────────────────

class PricePreprocessor:
    """
    Wrapper loaded at inference time.
    Converts a single feature dict → numpy array ready for model.predict().
    """

    def __init__(self, column_transformer: ColumnTransformer):
        self.ct = column_transformer

    def transform(self, feature_dict: dict) -> np.ndarray:
        """
        Transform a single prediction request dict into a model-ready array.

        Args:
            feature_dict: dict with keys matching the input schema

        Returns:
            np.ndarray of shape (1, n_features)
        """
        df = pd.DataFrame([feature_dict])
        df = engineer_features(df)
        return self.ct.transform(df)

    def save(self, path: str):
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str) -> "PricePreprocessor":
        return joblib.load(path)