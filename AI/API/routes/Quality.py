"""
Phase 3 — Crop Quality Detection Routes
Classifies crop quality grade and freshness from uploaded images
using transfer learning (MobileNetV2 fine-tuned on crop images).
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import io
import numpy as np

from Utils.Model_Loader import ModelLoader
from preprocessing.Image_preprocessor import preprocess_image_bytes

router = APIRouter()
loader = ModelLoader()

# ─────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────

class QualityAnalysisResponse(BaseModel):
    success: bool
    cropName: Optional[str]
    grade: str                    # A | B | C
    grade_confidence: float       # 0.0 – 1.0
    freshness: str                # fresh | moderate | stale
    freshness_confidence: float
    marketability: str            # sellable | borderline | reject
    recommendations: list
    model_version: str


# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

GRADE_LABELS    = ["A", "B", "C"]
FRESHNESS_LABELS = ["fresh", "moderate", "stale"]

def get_marketability(grade: str, freshness: str) -> str:
    if grade == "A" and freshness in ("fresh", "moderate"):
        return "sellable"
    if grade == "C" or freshness == "stale":
        return "reject"
    return "borderline"

def build_recommendations(grade: str, freshness: str) -> list:
    recs = []
    if grade == "A":
        recs.append("Premium grade — list at full market price or above.")
    elif grade == "B":
        recs.append("Good grade — suitable for standard marketplace listing.")
    else:
        recs.append("Low grade — consider local market or processing units.")

    if freshness == "fresh":
        recs.append("Freshness is excellent — optimal window for listing now.")
    elif freshness == "moderate":
        recs.append("Freshness is moderate — list within 2 days for best results.")
    else:
        recs.append("Freshness is low — not recommended for direct consumer sale.")

    return recs


# ─────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────

@router.post("/analyze", response_model=QualityAnalysisResponse)
async def analyze_crop_quality(
    file: UploadFile = File(..., description="Crop image (JPEG/PNG, max 5MB)"),
    cropName: Optional[str] = Form(None, description="Crop name (optional, for context)"),
):
    """
    Analyze crop quality from an uploaded image.
    Returns grade (A/B/C), freshness, and marketability insights.
    """
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted.")

    # Validate file size (5MB limit)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB.")

    try:
        quality_model = loader.get_quality_model()
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Quality model not found. Run training/train_quality.py first. {str(e)}"
        )

    try:
        # Preprocess image → (1, 224, 224, 3) normalized tensor
        img_tensor = preprocess_image_bytes(contents)

        # Model output: [grade_probs (3), freshness_probs (3)]
        predictions = quality_model.predict(img_tensor, verbose=0)

        grade_probs     = predictions[0][0]   # shape (3,)
        freshness_probs = predictions[1][0]   # shape (3,)

        grade_idx     = int(np.argmax(grade_probs))
        freshness_idx = int(np.argmax(freshness_probs))

        grade     = GRADE_LABELS[grade_idx]
        freshness = FRESHNESS_LABELS[freshness_idx]

        grade_conf     = round(float(grade_probs[grade_idx]), 4)
        freshness_conf = round(float(freshness_probs[freshness_idx]), 4)

        marketability = get_marketability(grade, freshness)
        recommendations = build_recommendations(grade, freshness)

        return QualityAnalysisResponse(
            success=True,
            cropName=cropName,
            grade=grade,
            grade_confidence=grade_conf,
            freshness=freshness,
            freshness_confidence=freshness_conf,
            marketability=marketability,
            recommendations=recommendations,
            model_version="1.0.0-mobilenetv2",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality analysis failed: {str(e)}")


@router.get("/grades")
async def get_grade_descriptions():
    """Returns descriptions for each quality grade."""
    return {
        "success": True,
        "grades": {
            "A": "Premium quality. Uniform size, no defects, excellent color. Commands highest price.",
            "B": "Good quality. Minor blemishes acceptable. Standard market price.",
            "C": "Below standard. Visible defects, discoloration, or damage. Discounted pricing.",
        },
        "freshness": {
            "fresh":    "Harvested within 1–2 days. Optimal nutritional value and shelf life.",
            "moderate": "Harvested 3–5 days ago. Acceptable for immediate sale.",
            "stale":    "Past optimal freshness window. Not recommended for direct consumer sale.",
        }
    }