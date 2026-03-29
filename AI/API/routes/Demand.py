"""
Phase 2 — Demand Forecasting Routes
Predicts demand score and classification for crops in upcoming weeks.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import List, Optional

from Utils.model_loader import ModelLoader

router = APIRouter()
loader = ModelLoader()

class DemandForecastRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    cropName:               str                   = Field(..., alias="crop_name", description="Crop name e.g. Tomato")
    state:                  str                   = Field(..., description="Indian state e.g. Maharashtra")
    month:                  int                   = Field(..., ge=1, le=12, description="Starting month 1-12")
    season:                 str                   = Field(..., description="Kharif | Rabi | Zaid | Winter | Summer | Whole Year")
    historicalDemandScores: Optional[List[float]] = Field(None, alias="historical_demand_scores", description="Last N weeks of demand scores 0-1")
    historicalPrices:       Optional[List[float]] = Field(None, alias="historical_prices", description="Last N weeks of avg prices")
    forecastWeeks:          int                   = Field(1, alias="forecast_weeks", ge=1, le=8, description="Weeks ahead to forecast")


class WeekForecast(BaseModel):
    week:         int
    demand_score: float
    demand_label: str
    confidence:   str


class DemandForecastResponse(BaseModel):
    success:        bool
    cropName:       str
    state:          str
    forecasts:      List[WeekForecast]
    recommendation: str
    model_version:  str


def classify_demand(score: float) -> str:
    if score >= 0.70:
        return "high"
    elif score >= 0.40:
        return "medium"
    return "low"


def generate_recommendation(forecasts: List[WeekForecast], crop: str) -> str:
    avg_score = sum(f.demand_score for f in forecasts) / len(forecasts)
    label = classify_demand(avg_score)
    recs = {
        "high":   f"Strong demand expected for {crop}. Consider increasing stock and reviewing pricing upward.",
        "medium": f"Moderate demand expected for {crop}. Maintain current stock levels.",
        "low":    f"Low demand expected for {crop}. Consider promotions or delaying new listings.",
    }
    return recs[label]


@router.post("/forecast", response_model=DemandForecastResponse)
async def forecast_demand(payload: DemandForecastRequest):
    """Forecast demand score for a crop over the specified number of weeks."""
    try:
        model, preprocessor = loader.get_demand_model()
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Demand model not found. Run training/train_demand.py first. {str(e)}")

    forecasts = []
    try:
        rolling_demand = list(payload.historicalDemandScores or [0.65])
        rolling_prices = list(payload.historicalPrices or [25.0])

        for week in range(1, payload.forecastWeeks + 1):
            feature_dict = {
                "cropName":            payload.cropName,
                "state":               payload.state,
                "month":               (payload.month + week - 1) % 12 + 1,
                "season":              payload.season,
                "demand_lag1":         rolling_demand[-1] if rolling_demand else 0.65,
                "demand_lag2":         rolling_demand[-2] if len(rolling_demand) >= 2 else 0.65,
                "price_lag1":          rolling_prices[-1] if rolling_prices else 25.0,
                "price_lag2":          rolling_prices[-2] if len(rolling_prices) >= 2 else 25.0,
                "demand_rolling_mean": sum(rolling_demand[-4:]) / min(len(rolling_demand), 4),
                "price_rolling_mean":  sum(rolling_prices[-4:]) / min(len(rolling_prices), 4),
            }

            X     = preprocessor.transform(feature_dict)
            score = float(model.predict(X)[0])
            score = round(min(max(score, 0.0), 1.0), 4)

            rolling_demand.append(score)
            rolling_prices.append(rolling_prices[-1] * (1 + (score - 0.5) * 0.05))

            forecasts.append(WeekForecast(
                week=week,
                demand_score=score,
                demand_label=classify_demand(score),
                confidence="medium",
            ))

        return DemandForecastResponse(
            success=True,
            cropName=payload.cropName,
            state=payload.state,
            forecasts=forecasts,
            recommendation=generate_recommendation(forecasts, payload.cropName),
            model_version="1.0.0-xgb",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting failed: {str(e)}")


@router.get("/seasons")
async def get_crop_seasons():
    return {
        "success": True,
        "seasons": {
            "Kharif":     {"months": [6, 7, 8, 9, 10], "crops": ["Rice", "Maize", "Cotton", "Soybean", "Groundnut"]},
            "Rabi":       {"months": [11, 12, 1, 2, 3], "crops": ["Wheat", "Mustard", "Peas", "Gram"]},
            "Zaid":       {"months": [3, 4, 5, 6],      "crops": ["Watermelon", "Cucumber", "Muskmelon"]},
            "Whole Year": {"months": list(range(1, 13)), "crops": ["Tomato", "Potato", "Onion", "Banana"]},
        }
    }