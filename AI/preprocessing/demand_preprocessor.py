"""
Demand Preprocessor — Feature Engineering Pipeline for Phase 2
Handles lag features, rolling stats, and encoding for demand forecasting.
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import joblib


CATEGORICAL_FEATURES = ["cropName", "state", "season"]
NUMERICAL_FEATURES   = [
    "month", "month_sin", "month_cos",
    "demand_lag1", "demand_lag2",
    "price_lag1", "price_lag2",
    "demand_rolling_mean", "price_rolling_mean",
    "price_demand_ratio",
]
TARGET_COLUMN = "demand_score"


def engineer_demand_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)

    # Price-to-demand ratio — captures inverse relationship
    df["price_demand_ratio"] = df["price_lag1"] / (df["demand_lag1"] + 1e-6)

    df.fillna(0, inplace=True)
    return df


def build_demand_preprocessor() -> ColumnTransformer:
    numerical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    categorical_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer(
        transformers=[
            ("num", numerical_pipeline,   NUMERICAL_FEATURES),
            ("cat", categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )


class DemandPreprocessor:
    def __init__(self, column_transformer: ColumnTransformer):
        self.ct = column_transformer

    def transform(self, feature_dict: dict) -> np.ndarray:
        df = pd.DataFrame([feature_dict])
        df = engineer_demand_features(df)
        return self.ct.transform(df)

    def save(self, path: str):
        joblib.dump(self, path)

    @classmethod
    def load(cls, path: str) -> "DemandPreprocessor":
        return joblib.load(path)