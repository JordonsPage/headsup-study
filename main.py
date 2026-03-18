from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from parser import extract_text
from ai import generate_cards

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    contents = await file.read()
    text = extract_text(file.filename, contents)
    cards = generate_cards(text)
    return {"cards": cards}

@app.post("/manual")
async def manual(data: dict):
    cards = generate_cards(data["text"])
    return {"cards": cards}