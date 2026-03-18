import pdfplumber
import base64
from PIL import Image
import io

def extract_text(filename: str, contents: bytes) -> str:
    ext = filename.lower().split(".")[-1]

    if ext == "pdf":
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text

    elif ext in ["png", "jpg", "jpeg", "webp"]:
        image = Image.open(io.BytesIO(contents))
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"IMAGE:{encoded}"

    else:
        return contents.decode("utf-8")