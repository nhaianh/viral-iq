# ViralIQ OpenAI

ViralIQ is a React/Vite app for scoring Instagram viral potential. This version keeps the OpenAI API key on a local Node/Express backend, so the key is not exposed in browser code.

## Requirements

- Node.js 20 or newer
- npm
- An OpenAI API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Open `.env` and replace the placeholder with your real OpenAI API key:

```env
OPENAI_API_KEY=sk-your-real-key-here
OPENAI_MODEL=gpt-4o-mini
PORT=8787
```

Do not put the OpenAI API key in `src/` or any `VITE_` environment variable. Anything in frontend code can be seen by users.

## Run in development

Start both the Vite frontend and Express backend:

```bash
npm run dev
```

Open the frontend URL printed by Vite, usually:

```text
http://localhost:5173
```

The frontend sends AI requests to `/api/advice`. Vite proxies that path to the backend at `http://localhost:8787`.

## Use the OpenAI advisor

1. Go to `Viral Predictor`.
2. Click `Predict Viral Score`.
3. Click `AI Strategy Advice`.

If `.env` is configured correctly and your OpenAI key has access, the advice card will show OpenAI-generated strategy tips.

## Production-style local run

Build the frontend:

```bash
npm run build
```

Run the Express server, which also serves the built frontend from `dist/`:

```bash
npm start
```

Open:

```text
http://localhost:8787
```

## Useful commands

```bash
npm run lint
npm run build
npm start
```

## Project structure

```text
viraliq-openai/
  src/             React frontend
  server/          Express backend and OpenAI API call
  .env.example     Environment variable template
  package.json     Scripts and dependencies
  README.md        This guide
```

## Troubleshooting

If the AI card says the advice is unavailable, check:

- `.env` exists in the project root.
- `OPENAI_API_KEY` is set correctly.
- The backend terminal has no OpenAI authentication or quota errors.
- You clicked `Predict Viral Score` before clicking `AI Strategy Advice`.
