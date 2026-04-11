"""
Phase 4 — Crop Recommendation Routes
Provides crop recommendations based on soil and season context.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from pydantic import ConfigDict
from typing import List

router = APIRouter()

SOIL_RULES = {
    "loamy": ["Wheat", "Sugarcane", "Cotton", "Tomato", "Maize"],
    "clay": ["Rice", "Jute", "Soybean", "Cabbage", "Mustard"],
    "sandy": ["Groundnut", "Carrot", "Potato", "Watermelon", "Bajra"],
    "silt": ["Rice", "Onion", "Brinjal", "Chilli", "Cauliflower"],
    "black": ["Cotton", "Soybean", "Sorghum", "Tur", "Sunflower"],
    "red": ["Millets", "Groundnut", "Pulses", "Castor", "Maize"],
}


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    soil_type: str = Field(..., description="Soil type e.g. loamy, clay, sandy")
    top_k: int = Field(3, ge=1, le=10, description="Top K recommendations")


class RecommendationResponse(BaseModel):
    success: bool
    soil_type: str
    top_recommendation: str
    recommendations: List[str]
    model_version: str


@router.post("/predict", response_model=RecommendationResponse)
async def recommend_crop(payload: RecommendationRequest):
    soil_key = payload.soil_type.strip().lower()
    options = SOIL_RULES.get(soil_key, ["Wheat", "Rice", "Maize", "Soybean", "Potato"])
    recommendations = options[: payload.top_k]

    return RecommendationResponse(
        success=True,
        soil_type=payload.soil_type,
        top_recommendation=recommendations[0],
        recommendations=recommendations,
        model_version="1.0.0-rules",
    )