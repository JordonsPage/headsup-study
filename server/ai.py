import json
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_cards(text: str) -> list:
    
    prompt = ('Extract vocabulary terms and definitions. Return only a JSON array '
              'of objects with string "term" and "definition" fields.')
    if text.startswith("IMAGE:"):
        content = [
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": text.removeprefix("IMAGE:")}},
            {"type": "text", "text": prompt},
        ]
    else:
        content = f"{prompt}\n\n{text}"
    message = client.messages.create(
        model=os.getenv("ANTHROPIC_MODEL", "claude-opus-4-5"),
        max_tokens=4096,
        messages=[{"role": "user", "content": content}],
    )

    result = message.content[0].text.strip()
    if result.startswith("```"):
        result = result.split("```")[1]
        if result.startswith("json"):
            result = result[4:]
        result = result.strip()
    cards = json.loads(result)
    if not isinstance(cards, list):
        raise ValueError("Expected a list of cards")
    return [
        {"term": card["term"].strip(), "definition": card["definition"].strip()}
        for card in cards
        if isinstance(card, dict)
        and isinstance(card.get("term"), str)
        and isinstance(card.get("definition"), str)
        and card["term"].strip() and card["definition"].strip()
    ]
