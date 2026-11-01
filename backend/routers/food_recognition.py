"""
Food Recognition Router
========================
Endpoints for identifying food items from images and follow-up chat.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.schemas import ChatRequest, FoodRecognitionResponse
from services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Food Recognition"])

# -------------------------------------------------------------------
# Prompts
# -------------------------------------------------------------------

_RECOGNITION_PROMPT = """
You are an expert food nutritionist and image analyst. Analyse the provided 
food image and respond ONLY with a valid JSON object (no markdown, no extra 
text) using exactly these keys:

{
  "food_name": "<name of the food>",
  "confidence": <confidence score 0-100>,
  "calories_estimate": <estimated calories in kcal for the visible serving>,
  "protein": <grams of protein>,
  "carbs": <grams of carbohydrates>,
  "fat": <grams of fat>,
  "fiber": <grams of dietary fiber>,
  "description": "<short description of the food>",
  "health_benefits": ["<benefit 1>", "<benefit 2>", ...],
  "serving_size": "<estimated serving size>"
}

Be as accurate as possible. If you cannot identify the food, set confidence
to 0 and food_name to "Unknown".
""".strip()


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------


@router.post(
    "/recognize",
    response_model=FoodRecognitionResponse,
    summary="Recognize food from an image",
)
async def recognize_food(file: UploadFile = File(...)):
    """Upload a food image to identify the item and estimate its nutrition."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    try:
        image_bytes = await file.read()
        raw = await ai_service.analyze_image(image_bytes, _RECOGNITION_PROMPT)
        data = ai_service.parse_json_response(raw)

        return FoodRecognitionResponse(
            food_name=data.get("food_name", "Unknown"),
            confidence=float(data.get("confidence", 0)),
            calories_estimate=float(data.get("calories_estimate", 0)),
            protein=float(data.get("protein", 0)),
            carbs=float(data.get("carbs", 0)),
            fat=float(data.get("fat", 0)),
            fiber=float(data.get("fiber", 0)),
            description=data.get("description", ""),
            health_benefits=data.get("health_benefits", []),
            serving_size=data.get("serving_size", "1 serving"),
        )
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )


@router.post(
    "/recognize/chat",
    summary="Chat about recognized food",
)
async def recognize_chat(body: ChatRequest):
    """Follow-up chat about a previously recognized food item."""
    system_prompt = (
        "You are a friendly and knowledgeable food nutrition expert. "
        "Answer questions about food items, their nutrition, health benefits, "
        "and preparation methods. Keep answers concise and helpful."
    )
    if body.context:
        system_prompt += f"\n\nAdditional context: {body.context}"

    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        reply = await ai_service.chat(messages, system_prompt)
        return {"reply": reply}
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
