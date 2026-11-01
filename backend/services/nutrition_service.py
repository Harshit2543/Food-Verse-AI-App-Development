"""
Nutrition Service — local nutrition database, BMR/TDEE calculations, and
meal-plan scaffolding.
"""

from __future__ import annotations

from typing import Any


class NutritionService:
    """Provides nutrition lookup, calorie calculations, and meal planning."""

    # ------------------------------------------------------------------
    # Common food nutrition database (per 100 g)
    # Keys: calories (kcal), protein (g), carbs (g), fat (g)
    # ------------------------------------------------------------------
    FOOD_DB: dict[str, dict[str, float]] = {
        "apple": {"calories": 52, "protein": 0.3, "carbs": 14, "fat": 0.2},
        "banana": {"calories": 89, "protein": 1.1, "carbs": 23, "fat": 0.3},
        "orange": {"calories": 47, "protein": 0.9, "carbs": 12, "fat": 0.1},
        "strawberry": {"calories": 32, "protein": 0.7, "carbs": 7.7, "fat": 0.3},
        "blueberry": {"calories": 57, "protein": 0.7, "carbs": 14, "fat": 0.3},
        "chicken breast": {"calories": 165, "protein": 31, "carbs": 0, "fat": 3.6},
        "salmon": {"calories": 208, "protein": 20, "carbs": 0, "fat": 13},
        "tuna": {"calories": 132, "protein": 28, "carbs": 0, "fat": 1.3},
        "egg": {"calories": 155, "protein": 13, "carbs": 1.1, "fat": 11},
        "rice": {"calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3},
        "brown rice": {"calories": 123, "protein": 2.7, "carbs": 26, "fat": 1},
        "pasta": {"calories": 131, "protein": 5, "carbs": 25, "fat": 1.1},
        "bread": {"calories": 265, "protein": 9, "carbs": 49, "fat": 3.2},
        "oats": {"calories": 389, "protein": 17, "carbs": 66, "fat": 6.9},
        "milk": {"calories": 42, "protein": 3.4, "carbs": 5, "fat": 1},
        "greek yogurt": {"calories": 59, "protein": 10, "carbs": 3.6, "fat": 0.4},
        "cheese": {"calories": 402, "protein": 25, "carbs": 1.3, "fat": 33},
        "tofu": {"calories": 76, "protein": 8, "carbs": 1.9, "fat": 4.8},
        "lentils": {"calories": 116, "protein": 9, "carbs": 20, "fat": 0.4},
        "chickpeas": {"calories": 164, "protein": 8.9, "carbs": 27, "fat": 2.6},
        "broccoli": {"calories": 34, "protein": 2.8, "carbs": 7, "fat": 0.4},
        "spinach": {"calories": 23, "protein": 2.9, "carbs": 3.6, "fat": 0.4},
        "carrot": {"calories": 41, "protein": 0.9, "carbs": 10, "fat": 0.2},
        "potato": {"calories": 77, "protein": 2, "carbs": 17, "fat": 0.1},
        "sweet potato": {"calories": 86, "protein": 1.6, "carbs": 20, "fat": 0.1},
        "avocado": {"calories": 160, "protein": 2, "carbs": 9, "fat": 15},
        "almond": {"calories": 579, "protein": 21, "carbs": 22, "fat": 50},
        "peanut butter": {"calories": 588, "protein": 25, "carbs": 20, "fat": 50},
        "olive oil": {"calories": 884, "protein": 0, "carbs": 0, "fat": 100},
        "honey": {"calories": 304, "protein": 0.3, "carbs": 82, "fat": 0},
    }

    # Activity-level multipliers for TDEE
    _ACTIVITY_MULTIPLIERS: dict[str, float] = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def estimate_nutrition(self, food_name: str) -> dict[str, Any]:
        """Look up or approximate the nutrition for *food_name* (per 100 g).

        Returns a dict with keys: ``calories``, ``protein``, ``carbs``, ``fat``,
        ``source`` (``"database"`` or ``"estimate"``).
        """
        key = food_name.strip().lower()

        # Exact match
        if key in self.FOOD_DB:
            return {**self.FOOD_DB[key], "source": "database"}

        # Partial / fuzzy match — pick first entry whose key is contained
        for db_key, values in self.FOOD_DB.items():
            if db_key in key or key in db_key:
                return {**values, "source": "database"}

        # No match — return a generic estimate
        return {
            "calories": 150,
            "protein": 5,
            "carbs": 20,
            "fat": 5,
            "source": "estimate",
        }

    def calculate_daily_needs(
        self,
        age: int,
        weight_kg: float,
        height_cm: float,
        gender: str,
        activity_level: str = "moderate",
    ) -> dict[str, Any]:
        """Calculate BMR (Mifflin-St Jeor) and TDEE.

        Returns a dict with ``bmr``, ``tdee``, ``protein_g``, ``carbs_g``,
        ``fat_g`` recommendations.
        """
        gender = gender.strip().lower()
        activity_level = activity_level.strip().lower()

        # Mifflin-St Jeor equation
        if gender == "male":
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        else:
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

        multiplier = self._ACTIVITY_MULTIPLIERS.get(activity_level, 1.55)
        tdee = bmr * multiplier

        # Macro split: 30 % protein, 40 % carbs, 30 % fat
        protein_g = round(tdee * 0.30 / 4, 1)
        carbs_g = round(tdee * 0.40 / 4, 1)
        fat_g = round(tdee * 0.30 / 9, 1)

        return {
            "bmr": round(bmr, 1),
            "tdee": round(tdee, 1),
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g,
        }

    def generate_meal_plan(
        self,
        calories_target: float,
        dietary_preference: str = "",
        allergies: list[str] | None = None,
    ) -> dict[str, Any]:
        """Generate a basic daily meal-plan scaffold matching *calories_target*.

        This is deterministic and can be enriched later by the AI service.
        """
        allergies = allergies or []
        pref = dietary_preference.strip().lower()

        # ---- Build food pools based on preference ----
        protein_sources = ["chicken breast", "salmon", "egg", "greek yogurt", "tuna"]
        carb_sources = ["brown rice", "oats", "sweet potato", "bread", "pasta"]
        fat_sources = ["avocado", "almond", "olive oil"]
        veggie_sources = ["broccoli", "spinach", "carrot"]

        if pref in ("vegetarian", "vegan"):
            protein_sources = ["tofu", "lentils", "chickpeas", "greek yogurt"]
            if pref == "vegan":
                protein_sources = ["tofu", "lentils", "chickpeas"]
                fat_sources = ["avocado", "almond", "peanut butter"]

        # Remove allergens (simple keyword check)
        def filter_allergens(foods: list[str]) -> list[str]:
            return [f for f in foods if not any(a.lower() in f for a in allergies)]

        protein_sources = filter_allergens(protein_sources)
        carb_sources = filter_allergens(carb_sources)
        fat_sources = filter_allergens(fat_sources)

        # Distribute calories roughly: Breakfast 25%, Lunch 35%, Dinner 30%, Snack 10%
        meals = [
            {
                "name": "Breakfast",
                "foods": [carb_sources[0] if carb_sources else "oats", "banana", "milk"],
                "calories": round(calories_target * 0.25),
                "macros": {
                    "protein": round(calories_target * 0.25 * 0.25 / 4, 1),
                    "carbs": round(calories_target * 0.25 * 0.45 / 4, 1),
                    "fat": round(calories_target * 0.25 * 0.30 / 9, 1),
                },
            },
            {
                "name": "Lunch",
                "foods": [
                    protein_sources[0] if protein_sources else "lentils",
                    carb_sources[1] if len(carb_sources) > 1 else "rice",
                    veggie_sources[0] if veggie_sources else "broccoli",
                ],
                "calories": round(calories_target * 0.35),
                "macros": {
                    "protein": round(calories_target * 0.35 * 0.30 / 4, 1),
                    "carbs": round(calories_target * 0.35 * 0.40 / 4, 1),
                    "fat": round(calories_target * 0.35 * 0.30 / 9, 1),
                },
            },
            {
                "name": "Dinner",
                "foods": [
                    protein_sources[1] if len(protein_sources) > 1 else protein_sources[0] if protein_sources else "tofu",
                    carb_sources[2] if len(carb_sources) > 2 else "potato",
                    veggie_sources[1] if len(veggie_sources) > 1 else "spinach",
                ],
                "calories": round(calories_target * 0.30),
                "macros": {
                    "protein": round(calories_target * 0.30 * 0.30 / 4, 1),
                    "carbs": round(calories_target * 0.30 * 0.40 / 4, 1),
                    "fat": round(calories_target * 0.30 * 0.30 / 9, 1),
                },
            },
            {
                "name": "Snack",
                "foods": [
                    fat_sources[0] if fat_sources else "almond",
                    "apple",
                ],
                "calories": round(calories_target * 0.10),
                "macros": {
                    "protein": round(calories_target * 0.10 * 0.20 / 4, 1),
                    "carbs": round(calories_target * 0.10 * 0.40 / 4, 1),
                    "fat": round(calories_target * 0.10 * 0.40 / 9, 1),
                },
            },
        ]

        total_macros = {
            "protein": round(sum(m["macros"]["protein"] for m in meals), 1),
            "carbs": round(sum(m["macros"]["carbs"] for m in meals), 1),
            "fat": round(sum(m["macros"]["fat"] for m in meals), 1),
        }

        return {
            "daily_calories": round(calories_target),
            "meals": meals,
            "total_macros": total_macros,
        }


# Module-level singleton
nutrition_service = NutritionService()
