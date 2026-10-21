from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from parser import extract_text
from ai import generate_cards

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

class Notes(BaseModel):
    text: str = Field(min_length=1, max_length=100_000)

@app.get('/')
def root():
    return {'status': 'ok'}

@app.post('/upload')
async def upload(file: UploadFile = File(...)):
    if not file.filename or file.filename.rsplit('.', 1)[-1].lower() not in {'pdf', 'png', 'jpg', 'jpeg', 'webp', 'txt'}:
        raise HTTPException(400, 'Choose a PDF, image, or text file.')
    contents = await file.read(20 * 1024 * 1024 + 1)
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(413, 'File must be smaller than 20 MB.')
    try:
        text = await run_in_threadpool(extract_text, file.filename, contents)
    except Exception as exc:
        raise HTTPException(400, 'Could not read that file.') from exc
    if not text.strip():
        raise HTTPException(400, 'No readable notes found.')
    return {'cards': await run_in_threadpool(generate_cards, text)}

@app.post('/manual')
def manual(data: Notes):
    if not data.text.strip():
        raise HTTPException(400, 'Add some notes first.')
    return {'cards': generate_cards(data.text)}
