# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Heads Up Study** — AI-powered flashcard generation and study app. Users upload text, PDFs, or images; the server uses Claude AI to extract vocabulary cards; the client presents them in a timed game or review mode.

## Repository Structure

```
backend/
├── client/        # React Native / Expo frontend (TypeScript)
└── server/        # Python FastAPI backend
```

## Commands

### Client (React Native / Expo)

```bash
cd client
npm install           # install dependencies
npx expo start        # start dev server (scan QR with Expo Go)
npx expo start --android
npx expo start --ios
npx expo start --web
npm run lint          # run ESLint
```

### Server (Python / FastAPI)

```bash
cd server
pip install -r requirements.txt   # (if requirements.txt exists)
uvicorn main:app --reload         # start dev server on :8000
```

The root `.env` holds `ANTHROPIC_API_KEY`.

## Architecture

### Client

- **Expo Router** (file-based routing) under `client/app/`
- Tab navigator at `app/(tabs)/` with Home (`index.tsx`) and Explore tabs
- Key screens: `game.tsx` (timed mode), `review.tsx` (untimed), `results.tsx`, `my-sets.tsx`, `settings.tsx`
- **AsyncStorage** persists card sets locally on device
- **Accelerometer** (`expo-sensors`) drives tilt-based pass/fail in game mode
- API base URL is hardcoded in `app/(tabs)/index.tsx` → `http://137.99.168.249:8000`

### Server

| File | Responsibility |
|---|---|
| `main.py` | FastAPI app, CORS, routes (`POST /upload`, `POST /manual`) |
| `ai.py` | Calls Claude (Opus 4.5) to extract term/definition pairs as JSON |
| `parser.py` | PDF parsing (`pdfplumber`) and image-to-text (`PIL`) |

### Data Flow

1. Client sends text or file to `/upload` or `/manual`
2. Server extracts raw text (PDF → pdfplumber, image → PIL)
3. `ai.py` prompts Claude to return structured JSON cards
4. Cards returned to client, stored in AsyncStorage
5. User launches game or review session from saved sets

## Key Notes

- The project uses **React Native new architecture** (`newArchEnabled: true`) and the **React Compiler** (`reactCompiler: true`)
- `expo-router` typed routes are enabled (`typedRoutes: true`)
- TypeScript strict mode is on; path alias `@/*` maps to `client/*`
