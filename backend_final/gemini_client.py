import os
import re
import time
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# gemini-2.0-flash is often exhausted on free tier; prefer newer models with separate quotas
DEFAULT_MODELS = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]

CONFIGURED_MODEL = os.getenv("GEMINI_MODEL", "").strip()
MODEL_CANDIDATES = (
    [CONFIGURED_MODEL] + [m for m in DEFAULT_MODELS if m != CONFIGURED_MODEL]
    if CONFIGURED_MODEL
    else DEFAULT_MODELS
)


API_KEY_LIMIT_MESSAGE = "API Key Limit Reached"


def _is_api_key_issue(exc: Exception) -> bool:
    message = str(exc).lower()
    return (
        "429" in message
        or "quota" in message
        or "rate limit" in message
        or "api key" in message
        or "api_key" in message
        or "invalid key" in message
        or "permission denied" in message
        or "401" in message
        or "403" in message
    )


def _retry_delay_seconds(exc: Exception) -> float:
    match = re.search(r"retry in ([0-9.]+)s", str(exc), re.IGNORECASE)
    if match:
        return min(float(match.group(1)) + 0.5, 30.0)
    return 2.0


def get_ingredient_report(prompt_text: str) -> str:
    last_error: Exception | None = None

    for model_name in MODEL_CANDIDATES:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt_text)
            return response.text
        except Exception as exc:
            last_error = exc
            if _is_api_key_issue(exc):
                time.sleep(_retry_delay_seconds(exc))
                continue
            raise

    if last_error is not None:
        if _is_api_key_issue(last_error):
            raise RuntimeError(API_KEY_LIMIT_MESSAGE) from last_error
        raise last_error

    raise RuntimeError("No Gemini model configured")
