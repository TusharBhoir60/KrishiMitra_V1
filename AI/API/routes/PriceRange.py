"""
Phase 5 — Price Range Routes
Predicts a likely price range using the price model as baseline.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pydantic import ConfigDict

from Utils.model_loader import ModelLoader

router = APIRouter()
loader = ModelLoader()


class PriceRangeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    crop_type: str = Field(..., description="Crop type or crop name")
    historical_avg_price: float = Field(0.0, ge=0, description="Historical average price per kg")
    state: str = Field("Maharashtra", description="State name")
    district: str = Field("Pune", description="District name")
    quantity: float = Field(100.0, gt=0, description="Quantity in kg")
    month: int = Field(6, ge=1, le=12, description="Month 1-12")
    season: str = Field("Kharif", description="Season name")


class PriceRangeResponse(BaseModel):
    success: bool
    crop_type: str
    predicted_base_price_per_kg: float
    price_range: dict
    model_version: str


@router.post("/predict", response_model=PriceRangeResponse)
async def predict_price_range(payload: PriceRangeRequest):
    try:
        model, preprocessor = loader.get_price_model()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Price model not found. {str(e)}")

    try:
        features = {
            "cropName": payload.crop_type,
            "state": payload.state,
            "district": payload.district,
            "quantity": payload.quantity,
            "month": payload.month,
            "season": payload.season,
            "historicalAvgPrice": payload.historical_avg_price,
        }

        X = preprocessor.transform(features)
        base_price = float(model.predict(X)[0])
        base_price = round(max(base_price, 0.5), 2)

        spread = max(base_price * 0.12, 0.5)
        low = round(max(base_price - spread, 0.5), 2)
        high = round(base_price + spread, 2)

        return PriceRangeResponse(
            success=True,
            crop_type=payload.crop_type,
            predicted_base_price_per_kg=base_price,
            price_range={"low": low, "high": high},
            model_version="1.0.0-rf-range",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price range prediction failed: {str(e)}")