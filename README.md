# AI Radar

Turn AI news into things you can actually use.

AI Radar is a mobile-first Next.js app for a hackathon MVP: live AI news becomes scored cards, tutorials, prompt packs, practical perks, mini projects, and proof-of-work exports.

## Features

- Radar feed with category chips, Today's Pick, Hype Filter scores, perks, limitations, tutorials, prompt packs, mini projects, save, and share actions.
- Search page with popular searches, real-time results, filters, details modal, save, tutorial, and compare flow.
- Build page with saved tutorials, mini project progress, completion tracking, prompt-copy counts, streaks, LinkedIn post export, and GitHub README export.
- Ask Radar assistant with OpenAI-backed answers when configured and local fallback answers when offline.
- Server-side Exa + OpenAI integration with mock fallback so the demo still works without API keys.

## Tech Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS
- Lucide icons
- Framer Motion
- `localStorage` for user state
- Exa Search API + OpenAI Responses API for live content

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Live API Setup

Create `.env.local`:

```bash
EXA_API_KEY=your_exa_key
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-5.5
```

Without keys, the app uses the full mock dataset in `lib/mock-data.ts`.

With keys, these route handlers become live:

- `app/api/radar/route.ts`: Exa news search -> OpenAI structured AI Radar cards
- `app/api/search/route.ts`: Exa semantic search -> OpenAI structured result cards
- `app/api/ask/route.ts`: OpenAI answer synthesis over the current Radar dataset

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Main Files

- `components/ai-radar-app.tsx`: product UI and interactions
- `lib/live.ts`: Exa + OpenAI server utilities
- `lib/mock-data.ts`: offline/demo dataset
- `lib/radar-utils.ts`: filters, search, score messages, exports, progress helpers
