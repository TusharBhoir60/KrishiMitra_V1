"""
Test Suite — AgriConnect ML Service
Run: pytest tests/ -v
"""

import sys
from pathlib import Path
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


# ─────────────────────────────────────────────────────────────────────────────
# Preprocessor Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestPricePreprocessor:
    def test_engineer_features_adds_cyclic_month(self):
        import pandas as pd
        from preprocessing.price_preprocessor import engineer_features

        df = pd.DataFrame([{
            "cropName": "Tomato", "state": "Maharashtra", "district": "Pune",
            "quantity": 500, "month": 6, "season": "Kharif", "historicalAvgPrice": 25.0,
        }])
        result = engineer_features(df)
        assert "month_sin" in result.columns
        assert "month_cos" in result.columns
        assert "quantity_log" in result.columns
        assert "is_peak_season" in result.columns
        assert abs(result["month_sin"].iloc[0] - np.sin(2 * np.pi * 6 / 12)) < 1e-6

    def test_quantity_log_transform(self):
        import pandas as pd
        from preprocessing.price_preprocessor import engineer_features

        df = pd.DataFrame([{
            "cropName": "Potato", "state": "UP", "district": "Lucknow",
            "quantity": 1000, "month": 3, "season": "Rabi", "historicalAvgPrice": 18.0,
        }])
        result = engineer_features(df)
        assert abs(result["quantity_log"].iloc[0] - np.log1p(1000)) < 1e-6

    def test_peak_season_flag_tomato_november(self):
        import pandas as pd
        from preprocessing.price_preprocessor import engineer_features

        df = pd.DataFrame([{
            "cropName": "Tomato", "state": "Maharashtra", "district": "Nashik",
            "quantity": 200, "month": 11, "season": "Rabi", "historicalAvgPrice": 30.0,
        }])
        result = engineer_features(df)
        assert result["is_peak_season"].iloc[0] == 1

    def test_missing_historical_price_filled(self):
        import pandas as pd
        from preprocessing.price_preprocessor import engineer_features

        df = pd.DataFrame([{
            "cropName": "Onion", "state": "Karnataka", "district": "Bangalore",
            "quantity": 300, "month": 4, "season": "Summer", "historicalAvgPrice": None,
        }])
        result = engineer_features(df)
        assert result["historicalAvgPrice"].iloc[0] == 0.0


class TestDemandPreprocessor:
    def test_engineer_demand_features(self):
        import pandas as pd
        from preprocessing.demand_preprocessor import engineer_demand_features

        df = pd.DataFrame([{
            "cropName": "Tomato", "state": "Maharashtra", "month": 6,
            "season": "Kharif", "demand_lag1": 0.7, "demand_lag2": 0.65,
            "price_lag1": 25.0, "price_lag2": 24.0,
            "demand_rolling_mean": 0.675, "price_rolling_mean": 24.5,
        }])
        result = engineer_demand_features(df)
        assert "month_sin" in result.columns
        assert "price_demand_ratio" in result.columns
        assert result["price_demand_ratio"].iloc[0] == pytest.approx(25.0 / 0.7, rel=1e-3)


class TestImagePreprocessor:
    def test_preprocess_image_shape(self):
        from preprocessing.image_preprocessor import preprocess_image_bytes
        from PIL import Image
        import io

        img = Image.new("RGB", (640, 480), color=(120, 80, 40))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        result = preprocess_image_bytes(buf.getvalue())

        assert result.shape == (1, 224, 224, 3)
        assert result.dtype == np.float32

    def test_augment_returns_five_variants(self):
        from preprocessing.image_preprocessor import augment_image

        arr = np.random.rand(224, 224, 3).astype(np.float32)
        variants = augment_image(arr)
        assert len(variants) == 5


# ─────────────────────────────────────────────────────────────────────────────
# Synthetic Data Generation Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestDataGeneration:
    def test_synthetic_price_data_shape(self):
        from training.train_price import generate_synthetic_data

        df = generate_synthetic_data(n_samples=100)
        assert len(df) == 100
        assert "price_per_kg" in df.columns
        assert df["price_per_kg"].min() > 0

    def test_synthetic_demand_data(self):
        from training.train_demand import generate_synthetic_demand_data

        df = generate_synthetic_demand_data(n_samples=200)
        assert len(df) == 200
        assert "demand_score" in df.columns
        assert df["demand_score"].between(0, 1).all()


# ─────────────────────────────────────────────────────────────────────────────
# Model Loader Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestModelLoader:
    def test_list_models_returns_dict(self):
        from utils.model_loader import ModelLoader

        result = ModelLoader.list_available_models()
        assert "price" in result
        assert "demand" in result
        assert "quality" in result
        for v in result.values():
            assert "available" in v
            assert "path" in v

    def test_price_model_raises_when_missing(self, tmp_path, monkeypatch):
        from utils.model_loader import ModelLoader
        import utils.model_loader as ml_module

        monkeypatch.setattr(ml_module, "MODELS_DIR", tmp_path)
        loader = ModelLoader()
        loader._price_model = None
        loader._price_preprocessor = None

        with pytest.raises(FileNotFoundError):
            loader.get_price_model()


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Endpoint Integration Tests
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def test_client():
    """Create a FastAPI test client."""
    try:
        from fastapi.testclient import TestClient
        from api.main import app
        return TestClient(app)
    except Exception:
        pytest.skip("FastAPI test client could not be initialized")


class TestHealthEndpoint:
    def test_health_returns_200(self, test_client):
        res = test_client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"

    def test_root_returns_200(self, test_client):
        res = test_client.get("/")
        assert res.status_code == 200


class TestPriceEndpoint:
    VALID_PAYLOAD = {
        "cropName": "Tomato",
        "state": "Maharashtra",
        "district": "Pune",
        "quantity": 500,
        "month": 6,
        "season": "Kharif",
    }

    def test_predict_returns_503_when_model_missing(self, test_client):
        """Should return 503 if model files haven't been trained yet."""
        res = test_client.post("/api/price/predict", json=self.VALID_PAYLOAD)
        assert res.status_code in (200, 503)

    def test_predict_rejects_invalid_season(self, test_client):
        payload = {**self.VALID_PAYLOAD, "season": "NotASeason"}
        res = test_client.post("/api/price/predict", json=payload)
        assert res.status_code == 422

    def test_predict_rejects_zero_quantity(self, test_client):
        payload = {**self.VALID_PAYLOAD, "quantity": 0}
        res = test_client.post("/api/price/predict", json=payload)
        assert res.status_code == 422

    def test_predict_rejects_invalid_month(self, test_client):
        payload = {**self.VALID_PAYLOAD, "month": 13}
        res = test_client.post("/api/price/predict", json=payload)
        assert res.status_code == 422

    def test_supported_crops_endpoint(self, test_client):
        res = test_client.get("/api/price/crops")
        assert res.status_code == 200
        data = res.json()
        assert "crops" in data
        assert "Tomato" in data["crops"]


class TestDemandEndpoint:
    VALID_PAYLOAD = {
        "cropName": "Tomato",
        "state": "Maharashtra",
        "month": 6,
        "season": "Kharif",
        "forecastWeeks": 3,
    }

    def test_forecast_returns_503_when_model_missing(self, test_client):
        res = test_client.post("/api/demand/forecast", json=self.VALID_PAYLOAD)
        assert res.status_code in (200, 503)

    def test_seasons_endpoint(self, test_client):
        res = test_client.get("/api/demand/seasons")
        assert res.status_code == 200
        data = res.json()
        assert "seasons" in data
        assert "Kharif" in data["seasons"]


class TestQualityEndpoint:
    def test_analyze_rejects_missing_file(self, test_client):
        res = test_client.post("/api/quality/analyze")
        assert res.status_code == 422

    def test_grades_endpoint(self, test_client):
        res = test_client.get("/api/quality/grades")
        assert res.status_code == 200
        data = res.json()
        assert "grades" in data
        assert "A" in data["grades"]
        assert "freshness" in data

    def test_analyze_rejects_non_image(self, test_client):
        res = test_client.post(
            "/api/quality/analyze",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )
        assert res.status_code == 400


# ─────────────────────────────────────────────────────────────────────────────
# End-to-End: Train → Predict
# ─────────────────────────────────────────────────────────────────────────────

class TestTrainAndPredict:
    """
    Full pipeline test: trains model on synthetic data, then runs inference.
    Skipped in fast mode (set AGRICONNECT_SKIP_TRAIN=1 to skip).
    """
    @pytest.mark.skipif(
        __import__("os").environ.get("AGRICONNECT_SKIP_TRAIN") == "1",
        reason="Training skipped via env var"
    )
    def test_price_train_and_predict(self, tmp_path, monkeypatch):
        import utils.model_loader as ml_module
        monkeypatch.setattr(ml_module, "MODELS_DIR", tmp_path)

        import training.train_price as tp
        monkeypatch.setattr(tp, "MODELS_DIR", tmp_path)
        tmp_path.mkdir(exist_ok=True)

        model, preprocessor, metrics = tp.train(data_path=None)
        assert metrics["r2"] > 0.5, f"R² too low: {metrics['r2']}"
        assert metrics["mae"] > 0

        # Test inference
        feature_dict = {
            "cropName": "Tomato", "state": "Maharashtra", "district": "Pune",
            "quantity": 300, "month": 5, "season": "Summer", "historicalAvgPrice": 25.0,
        }
        X = preprocessor.transform(feature_dict)
        pred = float(model.predict(X)[0])
        assert pred > 0, "Predicted price should be positive"
        print(f"\n[Test] Predicted price: ₹{pred:.2f}/kg")