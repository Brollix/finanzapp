from fastapi import FastAPI, File, UploadFile
from fastapi.responses import Response, JSONResponse
from paddleocr import PaddleOCR
from PIL import Image, ImageFont
import io
import numpy as np

app = FastAPI()
ocr = PaddleOCR(use_angle_cls=False, lang='es') # Disable angle cls for speed

def make_serializable(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.generic):
        return obj.item()
    if isinstance(obj, (ImageFont.FreeTypeFont, ImageFont.ImageFont)):
        return str(obj)
    if isinstance(obj, dict):
        return {k: make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [make_serializable(x) for x in obj]
    return obj

@app.post("/ocr")
async def ocr_endpoint(
    file: UploadFile = File(...)
):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Resize image for optimal OCR performance and accuracy
        min_size = 600
        max_size = 1000 # Reduced for faster processing

        # Downscale if too large
        if image.width > max_size or image.height > max_size:
            scale = min(max_size / image.width, max_size / image.height)
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.LANCZOS)
        # Upscale if too small
        elif image.width < min_size or image.height < min_size:
            scale = max(min_size / image.width, min_size / image.height)
            new_size = (int(image.width * scale), int(image.height * scale))
            image = image.resize(new_size, Image.LANCZOS)

        # Ensure image is in RGB format before converting to numpy array
        image_rgb = image.convert('RGB')
        image_np = np.array(image_rgb)

        # Convert RGB to BGR for PaddleOCR
        result = ocr.ocr(image_np[:, :, ::-1])
        # The OCR result is a list containing one dictionary.
        # The recognized text lines are in the 'rec_texts' key of that dictionary.
        if result and result[0]:
            # Safely access the dictionary and the list of texts
            result_data = result[0]
            lines = result_data.get('rec_texts', [])
            text = " ".join(lines) # Join with spaces instead of newlines
        else:
            # Handle cases where OCR returns no result
            text = "No text found."

        return JSONResponse(content={"text": text})
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
