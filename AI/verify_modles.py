"""
verify_models.py — AgriConnect Phase 1 & 2 Verification Script
===============================================================
Run this from the project root BEFORE starting the server.
It checks models, runs predictions directly, then tests live API endpoints.

Usage:
    # Check models only (no server needed):
    python verify_models.py

    # Check models + test live API (server must be running):
    python verify_models.py --api

    # Custom server URL:
    python verify_models.py --api --url http://localhost:8000
"""

import sys
import json
import argparse
import pathlib

# ── ANSI colors ───────────────────────────────────────────────────────────────
G = "\033[92m"   # green
R = "\033[91m"   # red
Y = "\033[93m"   # yellow
B = "\033[94m"   # blue
W = "\033[0m"    # reset
TICK = f"{G}✓{W}"
CROSS = f"{R}✗{W}"
WARN  = f"{Y}!{W}"

def ok(msg):   print(f"  {TICK}  {msg}")
def fail(msg): print(f"  {CROSS}  {msg}")
def warn(msg): print(f"  {WARN}  {msg}")
def section(title): print(f"\n{B}{'─'*50}{W}\n{B}  {title}{W}\n{B}{'─'*50}{W}")

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Check model files exist
# ─────────────────────────────────────────────────────────────────────────────
def check_model_files():
    section("Step 1 — Model files")
    models_dir = pathlib.Path("models/saved")
    required = {
        "Phase 1 model":        "price_model.joblib",
        "Phase 1 preprocessor": "price_preprocessor.joblib",
        "Phase 1 metrics":      "price_metrics.json",
        "Phase 2 model":        "demand_model.joblib",
        "Phase 2 preprocessor": "demand_preprocessor.joblib",
        "Phase 2 metrics":      "demand_metrics.json",
    }

    all_found = True
    for label, filename in required.items():
        path = models_dir / filename
        if path.exists():
            size = round(path.stat().st_size / 1024, 1)
            ok(f"{label:<28} {filename}  ({size} KB)")
        else:
            fail(f"{label:<28} {filename}  — MISSING")
            all_found = False

    if not all_found:
        print(f"\n  {R}Some models are missing. Run:{W}")
        print(f"    python training/train_price.py")
        print(f"    python training/train_demand.py")
        sys.exit(1)

    return True


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Read training metrics
# ─────────────────────────────────────────────────────────────────────────────
def check_metrics():
    section("Step 2 — Training metrics")
    models_dir = pathlib.Path("models/saved")

    THRESHOLDS = {
        "price_metrics.json": {
            "r2":      (0.75, "R²"),
            "mape_pct":(20.0, "MAPE %", "lower"),
        },
        "demand_metrics.json": {
            "r2":                       (0.60, "R²"),
            "classification_accuracy_pct": (70.0, "Class accuracy %"),
        },
    }

    for filename, checks in THRESHOLDS.items():
        path = models_dir / filename
        data = json.loads(path.read_text())
        phase = "Phase 1" if "price" in filename else "Phase 2"
        print(f"\n  {phase} ({filename}):")

        for key, info in checks.items():
            if key not in data:
                warn(f"  {key} not in metrics file")
                continue

            val = data[key]
            threshold = info[0]
            label     = info[1]
            mode      = info[2] if len(info) > 2 else "higher"

            passed = (val >= threshold) if mode == "higher" else (val <= threshold)
            symbol = TICK if passed else WARN
            tip    = "good" if passed else f"consider retraining (target {'>' if mode=='higher' else '<'} {threshold})"
            print(f"    {symbol}  {label}: {val}  — {tip}")

    print()


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Direct Python inference (no server needed)
# ─────────────────────────────────────────────────────────────────────────────
def check_direct_inference():
    section("Step 3 — Direct inference test (no server)")
    import joblib
    import numpy as np

    # Phase 1
    print("  Phase 1 — Price Prediction:")
    test_cases = [
        {"cropName": "Tomato",  "state": "Maharashtra", "district": "Pune",      "quantity": 500,  "month": 6,  "season": "Kharif",     "historicalAvgPrice": 22.5},
        {"cropName": "Potato",  "state": "Punjab",       "district": "Ludhiana", "quantity": 2000, "month": 3,  "season": "Rabi",       "historicalAvgPrice": 16.0},
        {"cropName": "Onion",   "state": "Karnataka",    "district": "Bangalore","quantity": 800,  "month": 4,  "season": "Summer",     "historicalAvgPrice": 20.0},
        {"cropName": "Wheat",   "state": "Haryana",      "district": "Karnal",   "quantity": 4500, "month": 4,  "season": "Rabi",       "historicalAvgPrice": 19.5},
        {"cropName": "Mango",   "state": "Maharashtra",  "district": "Ratnagiri","quantity": 800,  "month": 5,  "season": "Summer",     "historicalAvgPrice": 75.0},
    ]

    model = joblib.load("models/saved/price_model.joblib")
    prep  = joblib.load("models/saved/price_preprocessor.joblib")

    all_ok = True
    for tc in test_cases:
        try:
            X    = prep.transform(tc)
            pred = float(model.predict(X)[0])
            all_preds = [e.predict(X)[0] for e in model.estimators_]
            std  = float(np.std(all_preds))
            low  = round(max(pred - std, 0.5), 2)
            high = round(pred + std, 2)
            conf = "high" if std < pred*0.05 else ("medium" if std < pred*0.15 else "low")
            status = TICK if pred > 0 else CROSS
            print(f"    {status}  {tc['cropName']:<12} Rs {pred:>7.2f}/kg  range [{low} – {high}]  confidence: {conf}")
            if pred <= 0:
                all_ok = False
        except Exception as e:
            fail(f"  {tc['cropName']} failed: {e}")
            all_ok = False

    # Phase 2
    print("\n  Phase 2 — Demand Forecasting:")
    demand_cases = [
        {"cropName": "Tomato", "state": "Maharashtra", "month": 6,  "season": "Kharif",     "demand_lag1": 0.72, "demand_lag2": 0.68, "price_lag1": 24.5, "price_lag2": 23.0, "demand_rolling_mean": 0.70, "price_rolling_mean": 23.75, "price_demand_ratio": 24.5/0.72},
        {"cropName": "Potato", "state": "Punjab",       "month": 3,  "season": "Rabi",       "demand_lag1": 0.60, "demand_lag2": 0.55, "price_lag1": 18.0, "price_lag2": 17.5, "demand_rolling_mean": 0.58, "price_rolling_mean": 17.75, "price_demand_ratio": 18.0/0.60},
        {"cropName": "Wheat",  "state": "Haryana",      "month": 4,  "season": "Rabi",       "demand_lag1": 0.80, "demand_lag2": 0.78, "price_lag1": 22.0, "price_lag2": 21.5, "demand_rolling_mean": 0.79, "price_rolling_mean": 21.75, "price_demand_ratio": 22.0/0.80},
        {"cropName": "Onion",  "state": "Maharashtra",  "month": 4,  "season": "Summer",     "demand_lag1": 0.50, "demand_lag2": 0.45, "price_lag1": 20.0, "price_lag2": 19.0, "demand_rolling_mean": 0.48, "price_rolling_mean": 19.5,  "price_demand_ratio": 20.0/0.50},
    ]

    dmodel = joblib.load("models/saved/demand_model.joblib")
    dprep  = joblib.load("models/saved/demand_preprocessor.joblib")

    for dc in demand_cases:
        try:
            import pandas as pd, numpy as np
            df = pd.DataFrame([dc])
            df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
            df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
            df.fillna(0, inplace=True)
            X     = dprep.ct.transform(df)
            score = float(np.clip(dmodel.predict(X)[0], 0, 1))
            label = "high" if score >= 0.7 else ("medium" if score >= 0.4 else "low")
            status = TICK if 0 <= score <= 1 else CROSS
            print(f"    {status}  {dc['cropName']:<12} demand score: {score:.3f}  ({label})")
            if not (0 <= score <= 1):
                all_ok = False
        except Exception as e:
            fail(f"  {dc['cropName']} failed: {e}")
            all_ok = False

    return all_ok


# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Live API tests (optional, requires running server)
# ─────────────────────────────────────────────────────────────────────────────
def check_live_api(base_url: str):
    section(f"Step 4 — Live API tests  ({base_url})")
    try:
        import httpx
    except ImportError:
        warn("httpx not installed. Run: pip install httpx")
        return

    client = httpx.Client(base_url=base_url, timeout=15)

    # Health
    print("  Health check:")
    try:
        r = client.get("/health")
        if r.status_code == 200:
            ok(f"/health  →  {r.status_code}  {r.json().get('status')}")
        else:
            fail(f"/health returned {r.status_code}")
    except Exception as e:
        fail(f"Server not reachable: {e}")
        print(f"\n  {Y}Make sure the server is running:{W}")
        print(f"    uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload")
        return

    # Phase 1 API tests
    print("\n  Phase 1 — /api/price/predict:")
    price_tests = [
        ("Tomato",  "Maharashtra", "Pune",      500,  6,  "Kharif"),
        ("Potato",  "Punjab",       "Ludhiana", 2000, 3,  "Rabi"),
        ("Wheat",   "Haryana",      "Karnal",   4500, 4,  "Rabi"),
        ("Mango",   "Maharashtra",  "Ratnagiri", 800, 5,  "Summer"),
        ("Onion",   "Karnataka",    "Bangalore", 800, 4,  "Summer"),
    ]
    for crop, state, district, qty, month, season in price_tests:
        payload = {"cropName": crop, "state": state, "district": district,
                   "quantity": qty, "month": month, "season": season}
        r = client.post("/api/price/predict", json=payload)
        if r.status_code == 200:
            d = r.json()
            ok(f"{crop:<12}  Rs {d['predicted_price_per_kg']:>7.2f}/kg  "
               f"[{d['price_range']['low']} – {d['price_range']['high']}]  "
               f"conf: {d['confidence']}")
        else:
            fail(f"{crop:<12}  status {r.status_code}  {r.text[:120]}")

    # Phase 1 validation tests
    print("\n  Phase 1 — validation (should return 422):")
    bad_tests = [
        ("bad season",    {"cropName":"Tomato","state":"MH","district":"Pune","quantity":100,"month":6,"season":"Invalid"}),
        ("zero quantity", {"cropName":"Tomato","state":"MH","district":"Pune","quantity":0, "month":6,"season":"Kharif"}),
        ("month 13",      {"cropName":"Tomato","state":"MH","district":"Pune","quantity":100,"month":13,"season":"Kharif"}),
    ]
    for label, payload in bad_tests:
        r = client.post("/api/price/predict", json=payload)
        if r.status_code == 422:
            ok(f"{label:<18}  correctly rejected  (422)")
        else:
            fail(f"{label:<18}  expected 422 got {r.status_code}")

    # Phase 2 API tests
    print("\n  Phase 2 — /api/demand/forecast:")
    demand_tests = [
        ("Tomato",  "Maharashtra", 6,  "Kharif",  4),
        ("Potato",  "Punjab",      3,  "Rabi",    3),
        ("Wheat",   "Haryana",     4,  "Rabi",    2),
        ("Onion",   "Karnataka",   4,  "Summer",  4),
    ]
    for crop, state, month, season, weeks in demand_tests:
        payload = {"cropName": crop, "state": state,
                   "month": month, "season": season, "forecastWeeks": weeks}
        r = client.post("/api/demand/forecast", json=payload)
        if r.status_code == 200:
            d  = r.json()
            scores = [f["demand_score"] for f in d["forecasts"]]
            labels = [f["demand_label"] for f in d["forecasts"]]
            ok(f"{crop:<12}  {weeks} weeks → scores: {[round(s,2) for s in scores]}  labels: {labels}")
        else:
            fail(f"{crop:<12}  status {r.status_code}  {r.text[:120]}")

    # Batch test
    print("\n  Phase 1 — /api/price/batch (3 items):")
    batch_payload = {"items": [
        {"cropName":"Tomato","state":"Maharashtra","district":"Pune",     "quantity":500, "month":6,"season":"Kharif"},
        {"cropName":"Potato","state":"Punjab",      "district":"Ludhiana","quantity":2000,"month":3,"season":"Rabi"},
        {"cropName":"Mango", "state":"Maharashtra", "district":"Ratnagiri","quantity":800,"month":5,"season":"Summer"},
    ]}
    r = client.post("/api/price/batch", json=batch_payload)
    if r.status_code == 200:
        d = r.json()
        for pred in d["predictions"]:
            if pred["result"]:
                ok(f"  {pred['input']:<12}  Rs {pred['result']['predicted_price_per_kg']:.2f}/kg")
            else:
                fail(f"  {pred['input']:<12}  error: {pred['error']}")
    else:
        fail(f"Batch failed: {r.status_code} {r.text[:120]}")

    client.close()


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify AgriConnect ML models")
    parser.add_argument("--api", action="store_true", help="Also run live API tests (server must be running)")
    parser.add_argument("--url", default="http://localhost:8000", help="ML service base URL")
    args = parser.parse_args()

    print(f"\n{B}AgriConnect ML — Model Verification{W}")
    print(f"{B}Phase 1 (Price) + Phase 2 (Demand){W}")

    check_model_files()
    check_metrics()
    check_direct_inference()

    if args.api:
        check_live_api(args.url)
    else:
        print(f"\n{Y}Tip: To also test live API endpoints, run:{W}")
        print(f"  1. Start server:   uvicorn api.main:app --reload")
        print(f"  2. Run with flag:  python verify_models.py --api")

    print(f"\n{G}All checks complete.{W}\n")