# Heads Up Study

Turn class notes into a clue-giving party game, or practice on your own. Built with Expo / React Native and a FastAPI + Anthropic generation service.

## Play

- **Create & play:** paste notes, choose a PDF, or upload a photo to generate flashcards. Name and save the deck on your device.
- **Starter round:** play the built-in five-card deck without a server or API key.
- **Game:** hold the screen toward your clue crew. They describe the term; you guess. Tilt back for correct, forward to pass, and return upright between answers. Buttons also work on devices without motion sensors.
- **Practice:** reveal definitions with no timer, then revisit the cards you are still learning.
- **My decks:** replay or practice your saved decks. Existing saved sets and settings keep their original storage keys.

## Run locally

### Server

Use Python 3.10+:

```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Add your Anthropic API key to .env.
uvicorn main:app --reload --host 0.0.0.0
```

`ANTHROPIC_MODEL` can override the existing default model. Scanned PDFs currently use the first page only; text PDFs extract all pages. Uploads are limited to 20 MB.

### Client

```bash
cd client
npm ci
cp .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to your backend URL. On a physical phone, use your computer's LAN address, for example `http://192.168.1.20:8000`; localhost refers to the phone itself. Restart Expo after changing environment variables. Hosted HTTPS web builds need an HTTPS backend.

```bash
npm run typecheck
npm run lint
npx expo export --platform web
```

## Structure

- `client/app/(tabs)`: create screen and saved deck shelf
- `client/app/game.tsx`: timed play, sensor handling, and feedback
- `client/app/review.tsx`: untimed practice and missed-card loop
- `client/hooks/use-card-game.ts`: shared loading, round settings, scoring, and results navigation
- `client/components/play-ui.tsx`: colors, icons, accessible buttons, card art, and reduced-motion-aware entrance animations
- `client/lib`: card types, validation, shuffle, settings, and upload helpers
- `server`: upload parsing and AI generation

The visual identity uses bold blue, sunny yellow, coral, thick outlined cards, and vector icons. Motion respects the device's reduced-motion setting. The app uses a consistent light theme.
