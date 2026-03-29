"""
Phase 1 — Price Prediction Routes
Predicts the recommended price per kg for a crop listing.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from pydantic import ConfigDict
from typing import List, Optional
import numpy as np

from Utils.model_loader import ModelLoader

router = APIRouter()
loader = ModelLoader()

VALID_SEASONS = {"Kharif", "Rabi", "Zaid", "Winter", "Summer", "Whole Year"}


class PricePredictRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cropName:           str            = Field(..., alias="crop_name", description="Crop name e.g. Tomato")
    state:              str            = Field(..., description="Indian state e.g. Maharashtra")
    district:           str            = Field(..., description="District e.g. Pune")
    quantity:           float          = Field(..., gt=0, description="Quantity in kg")
    month:              int            = Field(..., ge=1, le=12, description="Month 1-12")
    season:             str            = Field(..., description="Kharif | Rabi | Zaid | Winter | Summer | Whole Year")
    historicalAvgPrice: Optional[float]= Field(None, alias="historical_avg_price", description="Optional: known avg market price per kg")

    @field_validator("season")
    @classmethod
    def season_must_be_valid(cls, v: str) -> str:
        if v not in VALID_SEASONS:
            raise ValueError(f"season must be one of {VALID_SEASONS}")
        return v


class PricePredictResponse(BaseModel):
    success:                bool
    cropName:               str
    predicted_price_per_kg: float
    price_range:            dict
    confidence:             str
    model_version:          str


class BatchPriceRequest(BaseModel):
    items: List[PricePredictRequest]


@router.post("/predict", response_model=PricePredictResponse)
async def predict_price(payload: PricePredictRequest):
    """Predict the recommended price per kg for a crop listing."""
    try:
        model, preprocessor = loader.get_price_model()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Price model not found. Run training/train_price.py first. {str(e)}")

    feature_dict = {
        "cropName":           payload.cropName,
        "state":              payload.state,
        "district":           payload.district,
        "quantity":           payload.quantity,
        "month":              payload.month,
        "season":             payload.season,
        "historicalAvgPrice": payload.historicalAvgPrice or 0.0,
    }

    try:
        X          = preprocessor.transform(feature_dict)
        prediction = float(model.predict(X)[0])
        prediction = round(max(prediction, 0.5), 2)

        all_preds  = [est.predict(X)[0] for est in model.estimators_]
        std_dev    = float(np.std(all_preds))
        low        = round(max(prediction - std_dev, 0.5), 2)
        high       = round(prediction + std_dev, 2)
        confidence = (
            "high"   if std_dev < prediction * 0.05 else
            "medium" if std_dev < prediction * 0.15 else
            "low"
        )

        return PricePredictResponse(
            success=True,
            cropName=payload.cropName,
            predicted_price_per_kg=prediction,
            price_range={"low": low, "high": high},
            confidence=confidence,
            model_version="1.0.0-rf",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch")
async def predict_price_batch(payload: BatchPriceRequest):
    """Batch price predictions — up to 50 items."""
    if len(payload.items) > 50:
        raise HTTPException(status_code=400, detail="Batch limit is 50 items per request.")

    results = []
    for item in payload.items:
        try:
            result = await predict_price(item)
            results.append({"input": item.cropName, "result": result, "error": None})
        except HTTPException as e:
            results.append({"input": item.cropName, "result": None, "error": e.detail})

    return {"success": True, "count": len(results), "predictions": results}


@router.get("/crops")
async def list_supported_crops():
    return {
        "success": True,
        "crops": [
            "Tomato", "Potato", "Onion", "Wheat", "Rice", "Maize",
            "Sugarcane", "Cotton", "Soybean", "Groundnut", "Banana",
            "Mango", "Grapes", "Apple", "Cabbage", "Cauliflower",
            "Brinjal", "Okra", "Peas", "Carrot",
        ],
    }