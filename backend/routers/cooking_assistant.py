"""
Cooking Assistant Router
=========================
Endpoints for generating recipes from images or text, and a cooking chatbot.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.schemas import ChatRequest, CookingResponse, RecipeFromTextRequest
from services.ai_service import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Cooking Assistant"])

# -------------------------------------------------------------------
# Prompts
# -------------------------------------------------------------------

_RECIPE_FROM_IMAGE_PROMPT = """
You are a world-class chef and recipe developer. Analyse the provided image 
to identify visible ingredients. Then suggest a delicious recipe using those 
ingredients.

Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{
  "recipe_name": "<name of the recipe>",
  "cuisine": "<cuisine type>",
  "difficulty": "<Easy | Medium | Hard>",
  "prep_time": "<e.g., 15 minutes>",
  "cook_time": "<e.g., 30 minutes>",
  "servings": <integer>,
  "ingredients": [
    {"name": "<ingredient>", "quantity": "<amount>", "unit": "<unit>"},
    ...
  ],
  "instructions": [
    {"step": 1, "description": "<instruction>"},
    ...
  ],
  "tips": ["<tip 1>", ...],
  "nutrition_per_serving": {
    "calories": <number>,
    "protein": <grams>,
    "carbs": <grams>,
    "fat": <grams>
  }
}
""".strip()


def _build_recipe_text_prompt(
    ingredients: list[str],
    cuisine: str,
    restrictions: list[str],
) -> str:
    """Compose a text prompt for recipe generation."""
    parts = [
        "You are a world-class chef. Create a recipe using these ingredients:",
        ", ".join(ingredients) + ".",
    ]
    if cuisine:
        parts.append(f"Cuisine preference: {cuisine}.")
    if restrictions:
        parts.append(f"Dietary restrictions: {', '.join(restrictions)}.")

    parts.append(
        """
Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{
  "recipe_name": "<name>",
  "cuisine": "<cuisine>",
  "difficulty": "<Easy | Medium | Hard>",
  "prep_time": "<time>",
  "cook_time": "<time>",
  "servings": <int>,
  "ingredients": [{"name": "<name>", "quantity": "<qty>", "unit": "<unit>"}, ...],
  "instructions": [{"step": 1, "description": "<desc>"}, ...],
  "tips": ["<tip>", ...],
  "nutrition_per_serving": {"calories": <n>, "protein": <g>, "carbs": <g>, "fat": <g>}
}
""".strip()
    )
    return "\n".join(parts)


def _parse_cooking(raw: str) -> CookingResponse:
    """Parse raw AI text into a CookingResponse."""
    data: dict[str, Any] = ai_service.parse_json_response(raw)
    return CookingResponse(
        recipe_name=data.get("recipe_name", "Unnamed Recipe"),
        cuisine=data.get("cuisine", ""),
        difficulty=data.get("difficulty", "Medium"),
        prep_time=data.get("prep_time", ""),
        cook_time=data.get("cook_time", ""),
        servings=int(data.get("servings", 2)),
        ingredients=data.get("ingredients", []),
        instructions=data.get("instructions", []),
        tips=data.get("tips", []),
        nutrition_per_serving=data.get("nutrition_per_serving", {}),
    )


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------


@router.post(
    "/cooking/recipe-from-image",
    response_model=CookingResponse,
    summary="Generate a recipe from an image of ingredients",
)
async def recipe_from_image(file: UploadFile = File(...)):
    """Upload an image of ingredients to receive a recipe suggestion."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    try:
        image_bytes = await file.read()
        raw = await ai_service.analyze_image(image_bytes, _RECIPE_FROM_IMAGE_PROMPT)
        return _parse_cooking(raw)
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post(
    "/cooking/recipe-from-text",
    response_model=CookingResponse,
    summary="Generate a recipe from a text ingredient list",
)
async def recipe_from_text(body: RecipeFromTextRequest):
    """Provide ingredients, cuisine preference, and restrictions to get a recipe."""
    if not body.ingredients:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one ingredient is required.",
        )

    prompt = _build_recipe_text_prompt(
        body.ingredients,
        body.cuisine_preference,
        body.dietary_restrictions,
    )

    try:
        raw = await ai_service.generate_text(prompt)
        return _parse_cooking(raw)
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post(
    "/cooking/chat",
    summary="Cooking chatbot for step-by-step guidance",
)
async def cooking_chat(body: ChatRequest):
    """Interactive cooking chatbot — ask about techniques, substitutions, timing, etc."""
    system_prompt = (
        "You are a friendly, experienced chef assistant. Help the user with "
        "cooking questions, step-by-step guidance, ingredient substitutions, "
        "timing, and technique tips. Keep answers practical and concise."
    )
    if body.context:
        system_prompt += f"\n\nCurrent recipe context: {body.context}"

    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        reply = await ai_service.chat(messages, system_prompt)
        return {"reply": reply}
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
