import base64
import io

import pdfplumber
from PIL import Image


MAX_IMAGE_BYTES = 3 * 1024 * 1024  # 3 MB raw → safely under 5 MB base64


def _encode_image(image: Image.Image) -> str:
    """Resize and JPEG-compress image until under MAX_IMAGE_BYTES, return base64."""
    image = image.convert("RGB")
    quality = 85
    scale = 1.0
    while True:
        w, h = image.size
        resized = image.resize((int(w * scale), int(h * scale)), Image.LANCZOS) if scale < 1.0 else image
        buffer = io.BytesIO()
        resized.save(buffer, format="JPEG", quality=quality)
        if buffer.tell() <= MAX_IMAGE_BYTES or quality <= 30:
            break
        quality -= 15
        if quality < 30:
            quality = 30
            scale *= 0.75
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _pdf_to_images(contents: bytes) -> str:
    """Render each PDF page as an image and encode the first page with content."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=contents, filetype="pdf")
        for page in doc:
            mat = fitz.Matrix(2, 2)  # 2x zoom for readability
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            encoded = _encode_image(img)
            return f"IMAGE:{encoded}"
    except ImportError:
        pass
    return ""


def extract_text(filename: str, contents: bytes) -> str:
    ext = filename.lower().split(".")[-1]

    if ext == "pdf":
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        if text.strip():
            return text
        # Scanned PDF — fall back to rendering as image
        return _pdf_to_images(contents)

    elif ext in ["png", "jpg", "jpeg", "webp"]:
        image = Image.open(io.BytesIO(contents))
        encoded = _encode_image(image)
        return f"IMAGE:{encoded}"

    else:
        return contents.decode("utf-8")
