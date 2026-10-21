import base64
import io

import pdfplumber
from PIL import Image


MAX_IMAGE_BYTES = 3 * 1024 * 1024  # 3 MB raw → safely under 5 MB base64


def _encode_image(image: Image.Image) -> str:
    """Resize and JPEG-compress image until under MAX_IMAGE_BYTES, return base64."""
    image = image.convert("RGB")
    quality = 85
    while True:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality)
        if buffer.tell() <= MAX_IMAGE_BYTES:
            break
        if quality > 30:
            quality = max(30, quality - 15)
        else:
            w, h = image.size
            if w == 1 and h == 1:
                raise ValueError("Could not compress image")
            image = image.resize((max(1, int(w * 0.75)), max(1, int(h * 0.75))), Image.Resampling.LANCZOS)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")


def _pdf_to_images(contents: bytes) -> str:
    """Render each PDF page as an image and encode the first page with content."""
    try:
        import fitz  # PyMuPDF
        with fitz.open(stream=contents, filetype="pdf") as doc:
            if not len(doc):
                return ""
            page = doc[0]
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
                text += (page.extract_text() or "") + "\n"
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
