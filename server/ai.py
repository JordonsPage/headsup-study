import json
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_cards(text: str) -> list:
    
    if text.startswith("IMAGE:"):
        encoded = text.replace("IMAGE:", "")
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": encoded,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Extract all vocabulary terms and definitions from this image. Return them as a JSON array like: [{\"term\": \"word\", \"definition\": \"meaning\"}]. Only return the JSON, nothing else."
                        }
                    ],
                }
            ],
        )
    else:
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"Extract all vocabulary terms and definitions from this text. Return them as a JSON array like: [{{\"term\": \"word\", \"definition\": \"meaning\"}}]. Only return the JSON, nothing else.\n\n{text}"
                }
            ],
        )

    result = message.content[0].text.strip()
    if result.startswith("```"):
        result = result.split("```")[1]
        if result.startswith("json"):
            result = result[4:]
        result = result.strip()
    return json.loads(result)