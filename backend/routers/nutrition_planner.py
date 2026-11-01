"""
Nutrition Planner Router
=========================
Endpoints for personalised nutrition plans, meal analysis, and a nutrition
advisor chatbot.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from models.schemas import ChatRequest, NutritionPlanRequest, NutritionPlanResponse
from services.ai_service import ai_service
from services.nutrition_service import nutrition_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Nutrition Planner"])

# -------------------------------------------------------------------
# Prompts
# -------------------------------------------------------------------

_MEAL_PLAN_PROMPT_TEMPLATE = """
You are an expert registered dietitian. Create a detailed daily meal plan for 
a person with the following profile:

- Daily calorie target: {tdee} kcal
- Macros target: ~{protein_g}g protein, ~{carbs_g}g carbs, ~{fat_g}g fat
- Dietary preference: {dietary_preference}
- Allergies / restrictions: {allergies}
- Goal: {goal}

Base your plan on this scaffold (adjust foods and portions as needed):
{scaffold}

Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{{
  "daily_calories": <number>,
  "meals": [
    {{
      "name": "<Breakfast | Lunch | Dinner | Snack>",
      "foods": ["<food item 1>", "<food item 2>", ...],
      "calories": <number>,
      "macros": {{"protein": <g>, "carbs": <g>, "fat": <g>}}
    }},
    ...
  ],
  "total_macros": {{"protein": <g>, "carbs": <g>, "fat": <g>}},
  "recommendations": ["<recommendation 1>", ...],
  "weekly_variety_suggestions": ["<suggestion 1>", ...]
}}
""".strip()

_MEAL_ANALYSIS_PROMPT = """
You are an expert nutritionist. Analyse the provided meal image and estimate 
its complete nutritional content.

Respond ONLY with a valid JSON object (no markdown, no extra text) using 
exactly these keys:

{
  "meal_description": "<what you see in the image>",
  "estimated_calories": <total kcal>,
  "macros": {
    "protein": <grams>,
    "carbs": <grams>,
    "fat": <grams>,
    "fiber": <grams>
  },
  "items": [
    {"name": "<food item>", "portion": "<estimated portion>", "calories": <kcal>},
    ...
  ],
  "health_notes": ["<note 1>", ...],
  "suggestions": ["<improvement suggestion 1>", ...]
}
""".strip()


# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------


@router.post(
    "/nutrition/plan",
    response_model=NutritionPlanResponse,
    summary="Generate a personalised nutrition plan",
)
async def create_nutrition_plan(body: NutritionPlanRequest):
    """Generate a daily nutrition plan based on user profile and goals."""
    # Step 1: Calculate calorie needs
    needs = nutrition_service.calculate_daily_needs(
        age=body.age,
        weight_kg=body.weight_kg,
        height_cm=body.height_cm,
        gender=body.gender,
        activity_level=body.activity_level,
    )

    # Adjust TDEE based on goal
    tdee = needs["tdee"]
    goal = body.goal.strip().lower()
    if goal == "lose":
        tdee *= 0.80  # 20 % deficit
    elif goal == "gain":
        tdee *= 1.15  # 15 % surplus

    # Step 2: Build scaffold from NutritionService
    scaffold = nutrition_service.generate_meal_plan(
        calories_target=tdee,
        dietary_preference=body.dietary_preference,
        allergies=body.allergies,
    )

    # Step 3: Enrich with AI
    prompt = _MEAL_PLAN_PROMPT_TEMPLATE.format(
        tdee=round(tdee),
        protein_g=needs["protein_g"],
        carbs_g=needs["carbs_g"],
        fat_g=needs["fat_g"],
        dietary_preference=body.dietary_preference or "none",
        allergies=", ".join(body.allergies) if body.allergies else "none",
        goal=body.goal,
        scaffold=json.dumps(scaffold, indent=2),
    )

    try:
        raw = await ai_service.generate_text(prompt)
        data: dict[str, Any] = ai_service.parse_json_response(raw)

        return NutritionPlanResponse(
            daily_calories=float(data.get("daily_calories", tdee)),
            meals=data.get("meals", scaffold["meals"]),
            total_macros=data.get("total_macros", scaffold["total_macros"]),
            recommendations=data.get("recommendations", []),
            weekly_variety_suggestions=data.get("weekly_variety_suggestions", []),
        )
    except ValueError:
        # Fallback to scaffold if AI parsing fails
        logger.warning("AI response could not be parsed; returning scaffold plan.")
        return NutritionPlanResponse(
            daily_calories=scaffold["daily_calories"],
            meals=scaffold["meals"],
            total_macros=scaffold["total_macros"],
            recommendations=[
                "Drink at least 8 glasses of water per day.",
                "Include a variety of colourful vegetables.",
            ],
            weekly_variety_suggestions=[
                "Rotate protein sources across the week.",
                "Try a new grain like quinoa or millet.",
            ],
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post(
    "/nutrition/analyze-meal",
    summary="Analyse a meal's nutritional content from an image",
)
async def analyze_meal(file: UploadFile = File(...)):
    """Upload an image of a meal to get a detailed nutritional breakdown."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be an image.",
        )

    try:
        image_bytes = await file.read()
        raw = await ai_service.analyze_image(image_bytes, _MEAL_ANALYSIS_PROMPT)
        data: dict[str, Any] = ai_service.parse_json_response(raw)
        return data
    except ValueError as exc:
        logger.error("JSON parsing error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {exc}",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.post(
    "/nutrition/chat",
    summary="Nutrition advisor chatbot",
)
async def nutrition_chat(body: ChatRequest):
    """Interactive nutrition advisor — ask about diet, supplements, macros, etc."""
    system_prompt = (
        "You are a friendly, evidence-based nutrition advisor. Answer questions "
        "about diet planning, macronutrients, micronutrients, supplements, and "
        "healthy eating habits. Always remind users to consult a healthcare "
        "professional for medical dietary needs. Keep answers concise."
    )
    if body.context:
        system_prompt += f"\n\nAdditional context: {body.context}"

    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        reply = await ai_service.chat(messages, system_prompt)
        return {"reply": reply}
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
