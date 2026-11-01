"""
Freshness Detection Router
============================
Endpoints for analysing the freshness of food items from images.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.schemas import FreshnessResponse
from services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Freshness Detection"])

# -------------------------------------------------------------------
# Prompts
# -------------------------------------------------------------------

_FRESHNESS_PROMPT = """
You are an expert food safety inspector. Analyse the provided food image for 
freshness. Examine color, texture, mold, wilting, bruising, discoloration,
odor indicators (condensation, slime), and any other freshness markers.

Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{
  "food_name": "<name of the food item>",
  "freshness_score": <integer 0–100>,
  "freshness_status": "<Fresh | Slightly Aged | Spoiled>",
  "days_remaining": <estimated shelf-life remaining in days>,
  "storage_tips": ["<tip 1>", "<tip 2>", ...],
  "indicators": ["<observed indicator 1>", "<observed indicator 2>", ...]
}

freshness_score guide:
  80-100 = Fresh
  40-79  = Slightly Aged
  0-39   = Spoiled
""".strip()


def _parse_freshness(raw: str) -> FreshnessResponse:
    """Parse raw AI text into a FreshnessResponse."""
    data: dict[str, Any] = ai_service.parse_json_response(raw)
    score = int(data.get("freshness_score", 0))
    status_str = data.get("freshness_status", "")
    if not status_str:
        if score >= 80:
            status_str = "Fresh"
        elif score >= 40:
            status_str = "Slightly Aged"
        else:
            status_str = "Spoiled"

    return FreshnessResponse(
        food_name=data.get("food_name", "Unknown"),
        freshness_score=score,
        freshness_status=status_str,
        days_remaining=int(data.get("days_remaining", 0)),
        storage_tips=data.get("storage_tips", []),
        indicators=data.get("indicators", []),
    )


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------


@router.post(
    "/freshness",
    response_model=FreshnessResponse,
    include_in_schema=False,
)
@router.post(
    "/freshness/analyze",
    response_model=FreshnessResponse,
    summary="Analyse freshness of a single food image",
)
async def analyze_freshness(file: UploadFile = File(...)):
    """Upload a food image to get a freshness analysis."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    try:
        image_bytes = await file.read()
        raw = await ai_service.analyze_image(image_bytes, _FRESHNESS_PROMPT)
        return _parse_freshness(raw)
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post(
    "/freshness/batch",
    response_model=list[FreshnessResponse],
    summary="Analyse freshness of multiple food images",
)
async def analyze_freshness_batch(files: list[UploadFile] = File(...)):
    """Upload multiple food images and get freshness analysis for each."""
    results: list[FreshnessResponse] = []

    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' is not an image.",
            )
        try:
            image_bytes = await file.read()
            raw = await ai_service.analyze_image(image_bytes, _FRESHNESS_PROMPT)
            results.append(_parse_freshness(raw))
        except (ValueError, RuntimeError) as exc:
            logger.error("Error analysing '%s': %s", file.filename, exc)
            # Append a fallback entry so the caller can see which file failed
            results.append(
                FreshnessResponse(
                    food_name=file.filename or "Unknown",
                    freshness_score=0,
                    freshness_status="Spoiled",
                    days_remaining=0,
                    storage_tips=[],
                    indicators=[f"Analysis failed: {exc}"],
                )
            )

    return results
