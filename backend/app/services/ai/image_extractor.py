import os
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def extract_text_from_image(image_bytes: bytes, filename: Optional[str] = None) -> str:
    """
    Extract civic complaint description, visual hazard details, and OCR text from uploaded image bytes.
    Supports Google Gemini Vision (gemini-1.5-flash / gemini-2.0-flash) and Groq API.
    Falls back gracefully to visual heuristics if cloud APIs are unavailable.
    """
    if not image_bytes:
        return ""

    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    # 1. Try Gemini Vision API if valid key is set
    if gemini_key and len(gemini_key.strip()) > 15 and not any(gemini_key.lower().startswith(p) for p in ["your-", "your_", "placeholder", "xxx"]):
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            
            # Use fast gemini-1.5-flash with a strict request_options timeout
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = (
                "You are an expert AI municipal inspector analyzing a citizen grievance photo. "
                "1. Perform OCR to read visible text. "
                "2. Describe the civic issue in 2-3 sentences. "
                "3. Identify the hazard category."
            )
            image_part = {
                "mime_type": "image/jpeg" if not filename or filename.endswith(('.jpg', '.jpeg')) else "image/png",
                "data": image_bytes
            }
            response = model.generate_content([prompt, image_part], request_options={"timeout": 3.5})
            if response and response.text and len(response.text.strip()) > 10:
                logger.info("Gemini Vision successfully extracted image details")
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini Vision extraction skipped or timed out: {e}")

    # 2. Try Groq Vision API if valid key is set
    if groq_key and len(groq_key.strip()) > 15 and not any(groq_key.lower().startswith(p) for p in ["your-", "your_", "placeholder", "gsk_your"]):
        try:
            import requests
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.2-11b-vision-preview",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Describe the civic grievance and visible text in this image."},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                "max_tokens": 200
            }
            res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=3.0)
            if res.status_code == 200:
                data = res.json()
                extracted_txt = data["choices"][0]["message"]["content"].strip()
                if extracted_txt:
                    logger.info("Groq Vision extracted details successfully")
                    return extracted_txt
        except Exception as e:
            logger.warning(f"Groq Vision extraction skipped or timed out: {e}")

    # 3. Fallback: Category-Neutral Photo Evidence Description
    fname = filename or "uploaded_image.jpg"
    img_kb = len(image_bytes) / 1024.0
    
    dims_str = ""
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes))
        dims_str = f", {img.width}x{img.height}px"
    except Exception:
        pass

    return f"Photo evidence attached ({fname}{dims_str}, Size: {img_kb:.1f} KB) showing reported civic issue."
