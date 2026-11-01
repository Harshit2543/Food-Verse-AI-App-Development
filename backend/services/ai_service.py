"""
AI Service — wraps Google Generative AI (Gemini) for image analysis, text
generation, and multi-turn chat.

If no API key is configured the service returns helpful mock / demo data so the
rest of the application can still be exercised.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import google.generativeai as genai

from config import get_settings

logger = logging.getLogger(__name__)

# Default Gemini model for all operations
_MODEL_NAME = "gemini-2.0-flash"


class AIService:
    """Thin wrapper around the Google Generative AI SDK."""

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.GOOGLE_API_KEY
        self._configured = bool(self._api_key)

        if self._configured:
            genai.configure(api_key=self._api_key)
            logger.info("Google Generative AI configured successfully.")
        else:
            logger.warning(
                "GOOGLE_API_KEY is not set. AI Service will return demo/mock data."
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def analyze_image(self, image_bytes: bytes, prompt: str) -> str:
        """Analyse an image using Gemini vision capabilities.

        Args:
            image_bytes: Raw bytes of the image.
            prompt: Instructions describing what to analyse.

        Returns:
            The text response from the model.
        """
        if not self._configured:
            return self._mock_image_response(prompt)

        try:
            model = genai.GenerativeModel(_MODEL_NAME)
            image_part = {
                "mime_type": "image/jpeg",
                "data": image_bytes,
            }
            response = model.generate_content([prompt, image_part])
            return response.text
        except Exception as exc:
            logger.error("Image analysis failed: %s", exc)
            raise RuntimeError(f"AI image analysis failed: {exc}") from exc

    async def generate_text(self, prompt: str) -> str:
        """Generate text using Gemini (no image).

        Args:
            prompt: The prompt string.

        Returns:
            The generated text.
        """
        if not self._configured:
            return self._mock_text_response(prompt)

        try:
            model = genai.GenerativeModel(_MODEL_NAME)
            response = model.generate_content(prompt)
            return response.text
        except Exception as exc:
            logger.error("Text generation failed: %s", exc)
            raise RuntimeError(f"AI text generation failed: {exc}") from exc

    async def chat(self, messages: list[dict[str, str]], system_prompt: str = "") -> str:
        """Multi-turn chat using Gemini.

        Args:
            messages: List of ``{"role": "user"|"model", "content": "..."}``
            system_prompt: Optional system-level instruction prepended to the
                conversation.

        Returns:
            The assistant's reply text.
        """
        if not self._configured:
            return self._mock_chat_response(messages)

        try:
            model = genai.GenerativeModel(
                _MODEL_NAME,
                system_instruction=system_prompt if system_prompt else None,
            )
            # Build history (all but last message)
            history = []
            for msg in messages[:-1]:
                role = "model" if msg["role"] == "assistant" else "user"
                history.append({"role": role, "parts": [msg["content"]]})

            chat_session = model.start_chat(history=history)
            last_content = messages[-1]["content"] if messages else ""
            response = chat_session.send_message(last_content)
            return response.text
        except Exception as exc:
            logger.error("Chat generation failed: %s", exc)
            raise RuntimeError(f"AI chat failed: {exc}") from exc

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def parse_json_response(text: str) -> dict[str, Any]:
        """Best-effort extraction of a JSON object from model output.

        The model sometimes wraps JSON inside markdown code fences; this
        method handles that gracefully.
        """
        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to extract from markdown code block ```json ... ``` or ``` ... ```
        patterns = [
            r"```json\s*([\s\S]*?)```",
            r"```\s*([\s\S]*?)```",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return json.loads(match.group(1).strip())
                except json.JSONDecodeError:
                    continue

        # Last resort — find first { and last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse JSON from AI response: {text[:300]}")

    # ------------------------------------------------------------------
    # Mock / demo responses when API key is absent
    # ------------------------------------------------------------------

    @staticmethod
    def _mock_image_response(prompt: str) -> str:
        """Return demo JSON for image analysis prompts."""
        if "freshness" in prompt.lower():
            return json.dumps(
                {
                    "food_name": "Apple (Demo)",
                    "freshness_score": 85,
                    "freshness_status": "Fresh",
                    "days_remaining": 5,
                    "storage_tips": [
                        "Store in refrigerator crisper drawer",
                        "Keep away from ethylene-producing fruits",
                    ],
                    "indicators": [
                        "Firm skin with no bruising",
                        "Vibrant color",
                        "No wrinkles or soft spots",
                    ],
                }
            )
        if "hygiene" in prompt.lower():
            return json.dumps(
                {
                    "overall_score": 78,
                    "grade": "B",
                    "categories": [
                        {"name": "Surface Cleanliness", "score": 80, "issues": []},
                        {"name": "Food Storage", "score": 75, "issues": ["Some items not covered"]},
                        {"name": "Equipment Condition", "score": 82, "issues": []},
                    ],
                    "recommendations": [
                        "Cover all stored food items",
                        "Increase cleaning frequency",
                    ],
                    "critical_violations": [],
                }
            )
        if "recipe" in prompt.lower() or "ingredient" in prompt.lower() or "cooking" in prompt.lower():
            return json.dumps(
                {
                    "recipe_name": "Garden Vegetable Stir-Fry (Demo)",
                    "cuisine": "Asian Fusion",
                    "difficulty": "Easy",
                    "prep_time": "15 minutes",
                    "cook_time": "10 minutes",
                    "servings": 2,
                    "ingredients": [
                        {"name": "Bell Pepper", "quantity": "1", "unit": "whole"},
                        {"name": "Broccoli", "quantity": "1", "unit": "cup"},
                        {"name": "Soy Sauce", "quantity": "2", "unit": "tbsp"},
                    ],
                    "instructions": [
                        {"step": 1, "description": "Wash and chop all vegetables."},
                        {"step": 2, "description": "Heat oil in a wok over high heat."},
                        {"step": 3, "description": "Stir-fry vegetables for 5-7 minutes."},
                    ],
                    "tips": ["Use high heat for best results", "Don't overcook vegetables"],
                    "nutrition_per_serving": {"calories": 180, "protein": 6, "carbs": 22, "fat": 8},
                }
            )
        # Default food recognition mock
        return json.dumps(
            {
                "food_name": "Grilled Chicken Salad (Demo)",
                "confidence": 92.5,
                "calories_estimate": 350,
                "protein": 30,
                "carbs": 15,
                "fat": 18,
                "fiber": 4,
                "description": "A fresh grilled chicken salad with mixed greens. (Demo data — set GOOGLE_API_KEY for real analysis.)",
                "health_benefits": [
                    "High in lean protein",
                    "Rich in vitamins A and C",
                    "Good source of dietary fiber",
                ],
                "serving_size": "1 bowl (~300g)",
            }
        )

    @staticmethod
    def _mock_text_response(prompt: str) -> str:
        """Return demo JSON for text generation prompts."""
        if "meal plan" in prompt.lower() or "nutrition" in prompt.lower():
            return json.dumps(
                {
                    "daily_calories": 2000,
                    "meals": [
                        {
                            "name": "Breakfast",
                            "foods": ["Oatmeal with berries", "Greek yogurt", "Green tea"],
                            "calories": 450,
                            "macros": {"protein": 20, "carbs": 60, "fat": 12},
                        },
                        {
                            "name": "Lunch",
                            "foods": ["Grilled chicken wrap", "Side salad", "Fruit"],
                            "calories": 600,
                            "macros": {"protein": 35, "carbs": 55, "fat": 20},
                        },
                        {
                            "name": "Dinner",
                            "foods": ["Salmon fillet", "Brown rice", "Steamed broccoli"],
                            "calories": 650,
                            "macros": {"protein": 40, "carbs": 50, "fat": 25},
                        },
                        {
                            "name": "Snacks",
                            "foods": ["Almonds", "Apple"],
                            "calories": 300,
                            "macros": {"protein": 8, "carbs": 30, "fat": 18},
                        },
                    ],
                    "total_macros": {"protein": 103, "carbs": 195, "fat": 75},
                    "recommendations": [
                        "Stay hydrated — aim for 8 glasses of water daily",
                        "Eat slowly and mindfully",
                    ],
                    "weekly_variety_suggestions": [
                        "Swap salmon for tuna on alternate days",
                        "Try quinoa instead of brown rice",
                    ],
                }
            )
        if "recipe" in prompt.lower():
            return json.dumps(
                {
                    "recipe_name": "Pasta Primavera (Demo)",
                    "cuisine": "Italian",
                    "difficulty": "Easy",
                    "prep_time": "10 minutes",
                    "cook_time": "20 minutes",
                    "servings": 4,
                    "ingredients": [
                        {"name": "Penne Pasta", "quantity": "400", "unit": "g"},
                        {"name": "Mixed Vegetables", "quantity": "2", "unit": "cups"},
                        {"name": "Olive Oil", "quantity": "3", "unit": "tbsp"},
                    ],
                    "instructions": [
                        {"step": 1, "description": "Boil pasta according to package directions."},
                        {"step": 2, "description": "Sauté vegetables in olive oil."},
                        {"step": 3, "description": "Toss pasta with vegetables and serve."},
                    ],
                    "tips": ["Reserve pasta water for the sauce"],
                    "nutrition_per_serving": {"calories": 380, "protein": 12, "carbs": 58, "fat": 12},
                }
            )
        return json.dumps({"message": "Demo response — set GOOGLE_API_KEY for real AI analysis."})

    @staticmethod
    def _mock_chat_response(messages: list[dict[str, str]]) -> str:
        """Return a mock chat reply."""
        return (
            "This is a demo response. Please set the GOOGLE_API_KEY environment "
            "variable to enable real AI-powered conversations. How can I help you "
            "with food, nutrition, or cooking questions?"
        )


# Module-level singleton for convenience
ai_service = AIService()
