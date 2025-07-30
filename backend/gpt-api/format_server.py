"""Combined server: starts llama-cpp OpenAI server and exposes FastAPI `/format` endpoint
   that receives raw OCR text and returns structured JSON using the same prompt logic.
"""
import os
import sys
import subprocess
import time
import json
from typing import Any, Dict

RETRY_ATTEMPTS = int(os.environ.get("LLAMA_RETRIES", 5))
RETRY_DELAY = float(os.environ.get("LLAMA_DELAY", 2))

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# -------------------- Llama server bootstrap --------------------
MODEL_FILE = os.environ.get("MODEL_PATH")
if not MODEL_FILE:
    MODEL_DIR = os.environ.get("MODEL_DIR", ".")
    MODEL_NAME = os.environ.get("MODEL_NAME", "nous-hermes-2-mistral-7b-dpo.Q4_K_M.gguf")
    MODEL_FILE = os.path.join(MODEL_DIR, MODEL_NAME)

LLAMA_PORT = int(os.environ.get("LLAMA_PORT", 4891))
LLAMA_HOST = os.environ.get("LLAMA_HOST", "0.0.0.0")


def _start_llama_server() -> None:
    """Launch llama-cpp-python OpenAI-compatible server in a background subprocess."""
    cmd = [
        sys.executable,
        "-m",
        "llama_cpp.server",
        "--model",
        MODEL_FILE,
        "--host",
        LLAMA_HOST,
        "--port",
        str(LLAMA_PORT),
    ]
    # Spawn in background – don't wait/block.
    subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)


# Only launch if not already running (e.g., when reloaded by uvicorn)
if os.environ.get("RUN_MAIN") != "true":
    print(f"✅ Spawning llama-cpp server on http://{LLAMA_HOST}:{LLAMA_PORT}, model={MODEL_FILE}")
    _start_llama_server()

# -------------------- FastAPI app --------------------
app = FastAPI(title="Receipt Formatter API")


class FormatRequest(BaseModel):
    text: str


PROMPT_TEMPLATE = (
    "Please analyze the following text from an OCR scan of a supermarket receipt.\n"
    "Extract the key information and format it into a single JSON object.\n\n"
    "**VERY IMPORTANT RULE FOR NUMBERS:**\n"
    "The source text uses the Argentinian number format. The period '.' is a thousands separator "
    "and the comma ',' is the decimal separator.\n"
    "To create a valid JSON number (float), you MUST first REMOVE all periods '.' from the number string, "
    "and then REPLACE the comma ',' with a period '.'.\n"
    "For example, the text \"5.850,00\" must be converted to the number 5850.00 in the JSON. "
    "Always positive numbers except for discounts, which may be negative.\n"
    "Try to understand different formats, recognize products, differentiate between price, quantity and possible weight in grams, "
    "recognize discounts.\n\n"
    "The JSON object should have the following structure:\n"
    "- \"supermarket\": The name of the supermarket (string).\n"
    "- \"datetime\": The date and time of the purchase (string). Look for a line containing a date (e.g., DD/MM/YYYY) "
    "and a time (e.g., HH:MM:SS). Ignore other dates, such as \"INICIO ACTIVIDAD\".\n"
    "- \"total\": The final total amount of the ticket (float).\n"
    "- \"items\": A list of all purchased items. Each item in the list should be a JSON object with:\n"
    "    - \"item\": The name of the product (string).\n"
    "    - \"quantity\": The quantity of the item (float).\n"
    "    - \"price\": The total price for that item line (float).\n\n"
    "Here is the OCR text:\n---\n{ocr_text}\n---\n\n"
    "Return ONLY the JSON object, without any additional text or explanations."
)

def _build_prompt(text: str) -> str:
    return PROMPT_TEMPLATE.format(ocr_text=text)


def _call_llama(payload: Dict[str, Any]) -> Dict[str, Any]:
    """POST to llama server with simple retry/backoff if it is not yet up."""
    last_err = None
    for attempt in range(RETRY_ATTEMPTS):
        try:
            resp = requests.post(
                f"http://localhost:{LLAMA_PORT}/v1/completions", json=payload, timeout=120
            )
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.ConnectionError as e:
            # Server not ready yet – maybe still loading model
            last_err = e
            if attempt == 0:
                # Ensure server has been launched at least once
                _start_llama_server()
            time.sleep(RETRY_DELAY)
        except requests.RequestException as e:
            # Other request error – propagate
            raise e
    raise requests.ConnectionError(f"Cannot reach llama server after {RETRY_ATTEMPTS} attempts: {last_err}")


@app.post("/format", response_model=Dict[str, Any])
def format_receipt(req: FormatRequest):
    """Format raw OCR receipt text into structured JSON via local llama server."""
    prompt = _build_prompt(req.text)
    payload = {
        "prompt": prompt,
        "temperature": 0.1,
        "max_tokens": 1500,
    }
    try:
        data = _call_llama(payload)
        raw_text = (data.get("choices", [{}])[0].get("text") or "").strip()
        if not raw_text:
            raise ValueError("Model returned empty response")

        # Attempt direct parse
        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Try to extract JSON object substring
            start = raw_text.find('{')
            end = raw_text.rfind('}')
            if start != -1 and end != -1 and end > start:
                candidate = raw_text[start : end + 1]
                try:
                    return json.loads(candidate)
                except json.JSONDecodeError as e2:
                    raise HTTPException(status_code=422, detail=f"Invalid JSON from model (after extraction): {e2}\nRaw: {raw_text}")
            # Fallback error
            raise HTTPException(status_code=422, detail=f"Invalid JSON from model. Raw: {raw_text}")
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=str(e))
