"""
Hygiene Monitor Router
=======================
Endpoints for evaluating kitchen / restaurant hygiene from images or
video frames.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.schemas import HygieneResponse
from services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Hygiene Monitor"])

# -------------------------------------------------------------------
# Prompts
# -------------------------------------------------------------------

_HYGIENE_PROMPT = """
You are a certified food-safety and hygiene inspector. Analyse the provided 
image of a kitchen or restaurant environment. Evaluate:
  1. Surface cleanliness
  2. Food storage practices
  3. Equipment condition and maintenance
  4. Staff hygiene practices (if visible)
  5. Pest indicators
  6. General organisation

Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{
  "overall_score": <integer 0-100>,
  "grade": "<A | B | C | D | F>",
  "categories": [
    {"name": "<category name>", "score": <0-100>, "issues": ["<issue>", ...]},
    ...
  ],
  "recommendations": ["<recommendation 1>", ...],
  "critical_violations": ["<violation 1>", ...]  
}

Grade scale:
  90-100 = A
  80-89  = B
  70-79  = C
  60-69  = D
  0-59   = F
""".strip()

_VIDEO_FRAME_PROMPT = """
You are a certified food-safety and hygiene inspector. This image is a frame 
extracted from a video of a kitchen or restaurant. Evaluate the visible 
environment for hygiene and safety, taking into account that this is a single 
moment captured from continuous footage.

Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{
  "overall_score": <integer 0-100>,
  "grade": "<A | B | C | D | F>",
  "categories": [
    {"name": "<category name>", "score": <0-100>, "issues": ["<issue>", ...]},
    ...
  ],
  "recommendations": ["<recommendation 1>", ...],
  "critical_violations": ["<violation 1>", ...]
}

Grade scale:
  90-100 = A
  80-89  = B
  70-79  = C
  60-69  = D
  0-59   = F
""".strip()


def _parse_hygiene(raw: str) -> HygieneResponse:
    """Parse raw AI text into a HygieneResponse."""
    data: dict[str, Any] = ai_service.parse_json_response(raw)
    score = int(data.get("overall_score", 0))
    grade = data.get("grade", "")
    if not grade:
        if score >= 90:
            grade = "A"
        elif score >= 80:
            grade = "B"
        elif score >= 70:
            grade = "C"
        elif score >= 60:
            grade = "D"
        else:
            grade = "F"

    return HygieneResponse(
        overall_score=score,
        grade=grade,
        categories=data.get("categories", []),
        recommendations=data.get("recommendations", []),
        critical_violations=data.get("critical_violations", []),
    )


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------


@router.post(
    "/hygiene",
    response_model=HygieneResponse,
    include_in_schema=False,
)
@router.post(
    "/hygiene/analyze",
    response_model=HygieneResponse,
    summary="Analyse kitchen/restaurant hygiene from an image",
)
async def analyze_hygiene(file: UploadFile = File(...)):
    """Upload an image of a kitchen or restaurant to receive a hygiene evaluation."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    try:
        image_bytes = await file.read()
        raw = await ai_service.analyze_image(image_bytes, _HYGIENE_PROMPT)
        return _parse_hygiene(raw)
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post(
    "/hygiene/video-frame",
    response_model=HygieneResponse,
    summary="Analyse hygiene from a video frame",
)
async def analyze_video_frame(file: UploadFile = File(...)):
    """Upload a video frame image for hygiene analysis optimised for video context."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    try:
        image_bytes = await file.read()
        raw = await ai_service.analyze_image(image_bytes, _VIDEO_FRAME_PROMPT)
        return _parse_hygiene(raw)
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
