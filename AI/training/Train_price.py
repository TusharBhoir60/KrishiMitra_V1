"""
Phase 1 Training Script — Crop Price Prediction
============================================================
Trains a RandomForestRegressor to predict price per kg.

Usage:
    python training/train_price.py
    python training/train_price.py --data datasets/price_data.csv --tune

Output:
    models/saved/price_model.joblib
    models/saved/price_preprocessor.joblib
    models/saved/price_metrics.json
"""

import argparse
import json
import sys
import os
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
)

# Allow imports from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from preprocessing.price_preprocessor import (
    build_price_preprocessor,
    engineer_features,
    PricePreprocessor,
)

# ─────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────

MODELS_DIR   = Path(__file__).parent.parent / "models" / "saved"
DATASETS_DIR = Path(__file__).parent.parent / "datasets"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42

RF_PARAMS = {
    "n_estimators":     200,
    "max_depth":        15,
    "min_samples_split": 5,
    "min_samples_leaf":  2,
    "max_features":     "sqrt",
    "random_state":     RANDOM_STATE,
    "n_jobs":           -1,
}

TUNING_PARAM_GRID = {
    "n_estimators":  [100, 200, 300],
    "max_depth":     [10, 15, 20, None],
    "max_features":  ["sqrt", "log2"],
}


# ─────────────────────────────────────────
# Data Generation (Synthetic Fallback)
# ─────────────────────────────────────────

def generate_synthetic_data(n_samples: int = 5000) -> pd.DataFrame:
    """
    Generate realistic synthetic training data when real dataset is unavailable.
    Prices are modeled with crop-specific base prices + seasonal/regional variations.
    """
    print(f"[DataGen] Generating {n_samples} synthetic training samples...")

    rng = np.random.default_rng(RANDOM_STATE)

    CROP_BASE_PRICES = {
        "Tomato": 25, "Potato": 18, "Onion": 22, "Wheat": 20, "Rice": 35,
        "Maize": 15, "Sugarcane": 3.5, "Cotton": 60, "Soybean": 45,
        "Groundnut": 55, "Banana": 30, "Mango": 80, "Grapes": 90,
        "Apple": 120, "Cabbage": 12, "Cauliflower": 20, "Brinjal": 15,
        "Okra": 30, "Peas": 40, "Carrot": 25,
    }

    STATES   = ["Maharashtra", "Punjab", "Uttar Pradesh", "Karnataka", "Andhra Pradesh",
                 "Tamil Nadu", "Rajasthan", "Gujarat", "Madhya Pradesh", "West Bengal"]
    SEASONS  = ["Kharif", "Rabi", "Zaid", "Winter", "Summer", "Whole Year"]
    DISTRICTS = ["Pune", "Nashik", "Amravati", "Ludhiana", "Patna", "Jaipur",
                  "Bangalore", "Chennai", "Hyderabad", "Kolkata"]

    crops   = rng.choice(list(CROP_BASE_PRICES.keys()), n_samples)
    states  = rng.choice(STATES, n_samples)
    districts = rng.choice(DISTRICTS, n_samples)
    months  = rng.integers(1, 13, n_samples)
    seasons = rng.choice(SEASONS, n_samples)
    quantities = rng.lognormal(mean=5, sigma=1.5, size=n_samples).clip(10, 50000)

    # Price = base × regional_factor × seasonal_noise × quantity_discount
    base_prices        = np.array([CROP_BASE_PRICES[c] for c in crops])
    regional_factors   = rng.uniform(0.7, 1.4, n_samples)
    seasonal_noise     = rng.normal(1.0, 0.15, n_samples)
    quantity_discount  = 1 - np.log1p(quantities) / 200   # bulk = slight discount
    historical_prices  = base_prices * regional_factors * rng.uniform(0.9, 1.1, n_samples)

    prices = (base_prices * regional_factors * seasonal_noise * quantity_discount)
    prices = np.abs(prices) + rng.uniform(0.5, 2.5, n_samples)   # add small floor noise

    df = pd.DataFrame({
        "cropName":           crops,
        "state":              states,
        "district":           districts,
        "quantity":           quantities.round(1),
        "month":              months,
        "season":             seasons,
        "historicalAvgPrice": historical_prices.round(2),
        "price_per_kg":       prices.round(2),
    })

    print(f"[DataGen] Price stats: min={df['price_per_kg'].min():.2f}, "
          f"max={df['price_per_kg'].max():.2f}, mean={df['price_per_kg'].mean():.2f}")
    return df


# ─────────────────────────────────────────
# Data Loading
# ─────────────────────────────────────────

def load_data(data_path: str = None) -> pd.DataFrame:
    """Load dataset from CSV or generate synthetic data."""
    if data_path and Path(data_path).exists():
        print(f"[Data] Loading dataset from {data_path}")
        df = pd.read_csv(data_path)
        required_cols = {"cropName", "state", "district", "quantity",
                         "month", "season", "price_per_kg"}
        missing = required_cols - set(df.columns)
        if missing:
            raise ValueError(f"Dataset missing required columns: {missing}")
        if "historicalAvgPrice" not in df.columns:
            df["historicalAvgPrice"] = 0.0
        print(f"[Data] Loaded {len(df)} rows from {data_path}")
        return df.dropna(subset=["price_per_kg"])
    else:
        print("[Data] No dataset provided — using synthetic data for demo.")
        return generate_synthetic_data()


# ─────────────────────────────────────────
# Training
# ─────────────────────────────────────────

def train(data_path: str = None, tune_hyperparams: bool = False):
    print("\n" + "="*60)
    print("  AgriConnect — Phase 1: Price Prediction Model Training")
    print("="*60)

    # 1. Load Data
    df = load_data(data_path)
    print(f"\n[Train] Dataset shape: {df.shape}")

    # 2. Feature Engineering
    df_engineered = engineer_features(df)

    from preprocessing.price_preprocessor import CATEGORICAL_FEATURES, NUMERICAL_FEATURES
    feature_cols = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
    X_raw = df_engineered[feature_cols]
    y     = df_engineered["price_per_kg"].values

    # 3. Train/Test Split
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=RANDOM_STATE
    )
    print(f"[Train] Train: {len(X_train_raw)} | Test: {len(X_test_raw)}")

    # 4. Fit Preprocessor on Training Data
    column_transformer = build_price_preprocessor()
    X_train = column_transformer.fit_transform(X_train_raw)
    X_test  = column_transformer.transform(X_test_raw)

    # 5. Train Model
    if tune_hyperparams:
        print("\n[Train] Running hyperparameter tuning (GridSearchCV)...")
        base_model = RandomForestRegressor(random_state=RANDOM_STATE, n_jobs=-1)
        grid_search = GridSearchCV(
            base_model,
            TUNING_PARAM_GRID,
            cv=3, scoring="neg_mean_absolute_error",
            n_jobs=-1, verbose=1,
        )
        grid_search.fit(X_train, y_train)
        model = grid_search.best_estimator_
        print(f"[Train] Best params: {grid_search.best_params_}")
    else:
        print("\n[Train] Training RandomForestRegressor...")
        model = RandomForestRegressor(**RF_PARAMS)
        model.fit(X_train, y_train)

    # 6. Evaluate
    y_pred     = model.predict(X_test)
    mae        = mean_absolute_error(y_test, y_pred)
    mse        = mean_squared_error(y_test, y_pred)
    rmse       = np.sqrt(mse)
    r2         = r2_score(y_test, y_pred)
    mape       = mean_absolute_percentage_error(y_test, y_pred) * 100

    # Cross-validation
    cv_scores  = cross_val_score(model, X_train, y_train, cv=5, scoring="r2", n_jobs=-1)

    print(f"\n{'─'*40}")
    print(f"  Evaluation Metrics")
    print(f"{'─'*40}")
    print(f"  MAE  : ₹{mae:.2f}/kg")
    print(f"  RMSE : ₹{rmse:.2f}/kg")
    print(f"  MAPE : {mape:.1f}%")
    print(f"  R²   : {r2:.4f}")
    print(f"  CV R²: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print(f"{'─'*40}")

    # Feature importance (top 10)
    cat_encoder   = column_transformer.named_transformers_["cat"]["encoder"]
    cat_feat_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    all_feat_names = NUMERICAL_FEATURES + cat_feat_names
    importances   = model.feature_importances_
    top10_idx     = np.argsort(importances)[::-1][:10]

    print(f"\n  Top 10 Feature Importances:")
    for i in top10_idx:
        if i < len(all_feat_names):
            print(f"    {all_feat_names[i]:<35} {importances[i]:.4f}")

    # 7. Save model and preprocessor
    wrapped_preprocessor = PricePreprocessor(column_transformer)

    model_path = MODELS_DIR / "price_model.joblib"
    prep_path  = MODELS_DIR / "price_preprocessor.joblib"

    joblib.dump(model,                str(model_path), compress=3)
    joblib.dump(wrapped_preprocessor, str(prep_path),  compress=3)

    metrics = {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape_pct": round(mape, 2),
        "r2": round(r2, 4),
        "cv_r2_mean": round(cv_scores.mean(), 4),
        "cv_r2_std": round(cv_scores.std(), 4),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "model_version": "1.0.0-rf",
    }
    metrics_path = MODELS_DIR / "price_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n[Save] Model saved to      → {model_path}")
    print(f"[Save] Preprocessor saved  → {prep_path}")
    print(f"[Save] Metrics saved to    → {metrics_path}")
    print("\n✅  Phase 1 training complete!\n")

    return model, wrapped_preprocessor, metrics


# ─────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train AgriConnect Price Prediction Model")
    parser.add_argument("--data", type=str, default=None, help="Path to training CSV")
    parser.add_argument("--tune", action="store_true", help="Run hyperparameter tuning (slower)")
    args = parser.parse_args()

    train(data_path=args.data, tune_hyperparams=args.tune)