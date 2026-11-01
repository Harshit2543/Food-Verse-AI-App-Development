"""
Pydantic schemas for all request and response models used across the API.
"""

from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Food Recognition
# ---------------------------------------------------------------------------

class FoodRecognitionResponse(BaseModel):
    """Structured response for food recognition analysis."""

    food_name: str = Field(..., description="Identified food item name")
    confidence: float = Field(..., ge=0, le=100, description="Confidence score 0-100")
    calories_estimate: float = Field(..., description="Estimated calories (kcal)")
    protein: float = Field(..., description="Estimated protein in grams")
    carbs: float = Field(..., description="Estimated carbohydrates in grams")
    fat: float = Field(..., description="Estimated fat in grams")
    fiber: float = Field(0.0, description="Estimated fiber in grams")
    description: str = Field("", description="Brief description of the food")
    health_benefits: list[str] = Field(default_factory=list, description="List of health benefits")
    serving_size: str = Field("1 serving", description="Estimated serving size")


# ---------------------------------------------------------------------------
# Freshness Detection
# ---------------------------------------------------------------------------

class FreshnessResponse(BaseModel):
    """Structured response for freshness analysis of a food item."""

    food_name: str = Field(..., description="Identified food item name")
    freshness_score: int = Field(..., ge=0, le=100, description="Freshness score 0-100")
    freshness_status: str = Field(
        ...,
        description="Freshness status: Fresh / Slightly Aged / Spoiled",
    )
    days_remaining: int = Field(0, description="Estimated remaining shelf-life in days")
    storage_tips: list[str] = Field(default_factory=list, description="Storage recommendations")
    indicators: list[str] = Field(
        default_factory=list,
        description="Visual indicators observed (color, texture, mold, etc.)",
    )


# ---------------------------------------------------------------------------
# Hygiene Monitor
# ---------------------------------------------------------------------------

class HygieneCategory(BaseModel):
    """A single hygiene evaluation category."""

    name: str
    score: int = Field(..., ge=0, le=100)
    issues: list[str] = Field(default_factory=list)


class HygieneResponse(BaseModel):
    """Structured response for kitchen / restaurant hygiene analysis."""

    overall_score: int = Field(..., ge=0, le=100, description="Overall hygiene score 0-100")
    grade: str = Field(..., description="Letter grade: A / B / C / D / F")
    categories: list[dict[str, Any]] = Field(
        default_factory=list,
        description="List of category dicts with name, score, issues",
    )
    recommendations: list[str] = Field(default_factory=list)
    critical_violations: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Cooking Assistant
# ---------------------------------------------------------------------------

class IngredientItem(BaseModel):
    """Single ingredient entry."""

    name: str
    quantity: str = ""
    unit: str = ""


class InstructionStep(BaseModel):
    """Single cooking instruction step."""

    step: int
    description: str


class CookingResponse(BaseModel):
    """Structured recipe response from the cooking assistant."""

    recipe_name: str
    cuisine: str = ""
    difficulty: str = "Medium"
    prep_time: str = ""
    cook_time: str = ""
    servings: int = 2
    ingredients: list[dict[str, Any]] = Field(default_factory=list)
    instructions: list[dict[str, Any]] = Field(default_factory=list)
    tips: list[str] = Field(default_factory=list)
    nutrition_per_serving: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Nutrition Planner
# ---------------------------------------------------------------------------

class MealItem(BaseModel):
    """A single meal within a daily plan."""

    name: str
    foods: list[str] = Field(default_factory=list)
    calories: float = 0
    macros: dict[str, float] = Field(default_factory=dict)


class NutritionPlanResponse(BaseModel):
    """Structured daily nutrition plan response."""

    daily_calories: float
    meals: list[dict[str, Any]] = Field(default_factory=list)
    total_macros: dict[str, float] = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)
    weekly_variety_suggestions: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """Single chat message with role and content."""

    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class ChatRequest(BaseModel):
    """Request body for chat endpoints."""

    messages: list[ChatMessage]
    context: Optional[str] = None


# ---------------------------------------------------------------------------
# Cooking text-based request
# ---------------------------------------------------------------------------

class RecipeFromTextRequest(BaseModel):
    """Request body for generating a recipe from a textual ingredient list."""

    ingredients: list[str]
    cuisine_preference: str = ""
    dietary_restrictions: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Nutrition plan request
# ---------------------------------------------------------------------------

class NutritionPlanRequest(BaseModel):
    """User profile for generating a nutrition plan."""

    age: int = Field(..., ge=1, le=120)
    weight_kg: float = Field(..., gt=0)
    height_cm: float = Field(..., gt=0)
    gender: str = Field(..., description="'male' or 'female'")
    activity_level: str = Field(
        "moderate",
        description="sedentary / light / moderate / active / very_active",
    )
    dietary_preference: str = ""
    allergies: list[str] = Field(default_factory=list)
    goal: str = Field("maintain", description="lose / maintain / gain")


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------

class HealthCheckResponse(BaseModel):
    """Health-check response."""

    status: str = "ok"
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """Standard error envelope."""

    detail: str
