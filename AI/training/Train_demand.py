"""
Phase 2 Training Script — Demand Forecasting
============================================================
Trains an XGBoost regressor to predict weekly demand scores (0–1).

Usage:
    python training/train_demand.py
    python training/train_demand.py --data datasets/demand_data.csv

Output:
    models/saved/demand_model.joblib
    models/saved/demand_preprocessor.joblib
    models/saved/demand_metrics.json
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error

try:
    from xgboost import XGBRegressor
    XGB_AVAILABLE = True
except ImportError:
    from sklearn.ensemble import GradientBoostingRegressor
    XGB_AVAILABLE = False
    print("[Warning] XGBoost not found — falling back to GradientBoostingRegressor")

sys.path.insert(0, str(Path(__file__).parent.parent))

from preprocessing.demand_preprocessor import (
    build_demand_preprocessor,
    engineer_demand_features,
    DemandPreprocessor,
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
)

MODELS_DIR = Path(__file__).parent.parent / "models" / "saved"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
RANDOM_STATE = 42


# ─────────────────────────────────────────
# Synthetic Data Generation
# ─────────────────────────────────────────

def generate_synthetic_demand_data(n_samples: int = 4000) -> pd.DataFrame:
    """
    Generates synthetic demand data with realistic seasonality and lag features.
    """
    print(f"[DataGen] Generating {n_samples} demand training samples...")
    rng = np.random.default_rng(RANDOM_STATE)

    CROPS   = ["Tomato", "Potato", "Onion", "Wheat", "Rice", "Maize",
               "Banana", "Mango", "Cotton", "Soybean"]
    STATES  = ["Maharashtra", "Punjab", "UP", "Karnataka", "AP", "Tamil Nadu"]
    SEASONS = ["Kharif", "Rabi", "Zaid", "Winter", "Summer", "Whole Year"]

    # Seasonal demand patterns per crop (higher score = higher demand month)
    CROP_SEASONALITY = {
        "Tomato": {11: 0.9, 12: 0.85, 1: 0.8, 2: 0.7, 6: 0.5},
        "Mango":  {4: 0.95, 5: 0.9, 6: 0.8, 3: 0.6},
        "Onion":  {3: 0.85, 4: 0.9, 5: 0.8},
        "Wheat":  {3: 0.9, 4: 0.85, 2: 0.7},
    }

    records = []
    for _ in range(n_samples):
        crop   = rng.choice(CROPS)
        state  = rng.choice(STATES)
        month  = int(rng.integers(1, 13))
        season = rng.choice(SEASONS)

        # Base demand from seasonality
        base_demand = CROP_SEASONALITY.get(crop, {}).get(month, 0.55)
        base_demand = rng.uniform(base_demand * 0.85, min(base_demand * 1.15, 1.0))

        lag1 = float(np.clip(base_demand + rng.normal(0, 0.05), 0.1, 1.0))
        lag2 = float(np.clip(lag1 + rng.normal(0, 0.05), 0.1, 1.0))
        p1   = rng.uniform(10, 120)
        p2   = p1 * rng.uniform(0.9, 1.1)
        roll_demand = (lag1 + lag2) / 2
        roll_price  = (p1 + p2) / 2

        # Target demand score is influenced by lags + price trend
        price_trend = (p1 - p2) / max(p2, 1)
        target = float(np.clip(
            base_demand + 0.1 * (lag1 - 0.5) - 0.05 * price_trend + rng.normal(0, 0.04),
            0.05, 1.0
        ))

        records.append({
            "cropName":            crop,
            "state":               state,
            "month":               month,
            "season":              season,
            "demand_lag1":         round(lag1, 4),
            "demand_lag2":         round(lag2, 4),
            "price_lag1":          round(p1, 2),
            "price_lag2":          round(p2, 2),
            "demand_rolling_mean": round(roll_demand, 4),
            "price_rolling_mean":  round(roll_price, 2),
            "demand_score":        round(target, 4),
        })

    df = pd.DataFrame(records)
    print(f"[DataGen] Demand score: mean={df['demand_score'].mean():.3f}, "
          f"std={df['demand_score'].std():.3f}")
    return df


# ─────────────────────────────────────────
# Training
# ─────────────────────────────────────────

def train(data_path: str = None):
    print("\n" + "="*60)
    print("  AgriConnect — Phase 2: Demand Forecasting Model Training")
    print("="*60)

    # Load Data
    if data_path and Path(data_path).exists():
        df = pd.read_csv(data_path)
        print(f"[Data] Loaded {len(df)} rows from {data_path}")
    else:
        df = generate_synthetic_demand_data()

    df = engineer_demand_features(df)

    feature_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
    X_raw = df[feature_cols]
    y     = df["demand_score"].values

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=RANDOM_STATE
    )

    # Fit preprocessor
    column_transformer = build_demand_preprocessor()
    X_train = column_transformer.fit_transform(X_train_raw)
    X_test  = column_transformer.transform(X_test_raw)

    print(f"\n[Train] Train: {len(X_train)} | Test: {len(X_test)}")

    # Train XGBoost (or fallback)
    if XGB_AVAILABLE:
        print("[Train] Training XGBoostRegressor...")
        model = XGBRegressor(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            verbosity=0,
        )
    else:
        print("[Train] Training GradientBoostingRegressor (XGBoost fallback)...")
        from sklearn.ensemble import GradientBoostingRegressor
        model = GradientBoostingRegressor(
            n_estimators=200, learning_rate=0.05,
            max_depth=5, random_state=RANDOM_STATE,
        )

    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0, 1)

    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    # Classification accuracy (high/medium/low)
    def label(s): return "high" if s >= 0.7 else ("medium" if s >= 0.4 else "low")
    y_label_true = [label(v) for v in y_test]
    y_label_pred = [label(v) for v in y_pred]
    cls_acc = sum(t == p for t, p in zip(y_label_true, y_label_pred)) / len(y_test)

    print(f"\n{'─'*40}")
    print(f"  Evaluation Metrics")
    print(f"{'─'*40}")
    print(f"  MAE           : {mae:.4f}")
    print(f"  RMSE          : {rmse:.4f}")
    print(f"  R²            : {r2:.4f}")
    print(f"  Class Accuracy: {cls_acc*100:.1f}%  (high/medium/low)")
    print(f"{'─'*40}")

    # Save
    wrapped = DemandPreprocessor(column_transformer)
    model_path   = MODELS_DIR / "demand_model.joblib"
    prep_path    = MODELS_DIR / "demand_preprocessor.joblib"
    metrics_path = MODELS_DIR / "demand_metrics.json"

    joblib.dump(model,   str(model_path), compress=3)
    joblib.dump(wrapped, str(prep_path),  compress=3)

    metrics = {
        "mae": round(mae, 4), "rmse": round(rmse, 4), "r2": round(r2, 4),
        "classification_accuracy_pct": round(cls_acc * 100, 2),
        "model_version": "1.0.0-xgb",
    }
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[Save] Demand model  → {model_path}")
    print(f"[Save] Preprocessor  → {prep_path}")
    print("\n✅  Phase 2 training complete!\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default=None)
    args = parser.parse_args()
    train(data_path=args.data)