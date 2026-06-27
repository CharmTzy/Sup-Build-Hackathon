# AI Radar

Turn AI news into things you can actually use.

AI Radar is a mobile-first Next.js app for a hackathon MVP: live AI news becomes scored cards, tutorials, prompt packs, practical perks, mini projects, and proof-of-work exports.

## Features

- Radar feed with category chips and one readable tutorial/news post per row, with source links, save/share actions, and scroll-based loading.
- Search page with popular searches, real-time results, filters, details modal, save, tutorial, and compare flow.
- Build page with saved tutorials, mini project progress, completion tracking, prompt-copy counts, streaks, LinkedIn post export, and GitHub README export.
- Saved page for bookmarked Radar/Search posts.
- Ask Radar assistant with OpenAI-backed answers when configured and local fallback answers when offline.
- Server-side Exa + OpenAI integration with mock fallback so the demo still works without API keys.
- Optional Neon Postgres cache for live Radar cards.
- URL crawl endpoint that uses Exa content extraction and OpenAI card generation.
- Normalized database tables for Radar posts, feed membership, crawl cache, and saved items.

## Tech Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS
- Lucide icons
- Framer Motion
- `localStorage` for user state
- Exa Search/Contents API + OpenAI Responses API for live content
- Neon Postgres for optional live-content caching

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
DATABASE_URL=postgresql://...
```

Without API keys, the app uses the full mock dataset in `lib/mock-data.ts`.
Without `DATABASE_URL`, live Exa/OpenAI still works but does not persist generated cards.

With keys, these route handlers become live:

- `app/api/radar/route.ts`: Exa news search -> OpenAI structured AI Radar cards -> optional Neon cache
- `app/api/search/route.ts`: Exa semantic search -> OpenAI structured result cards
- `app/api/ask/route.ts`: OpenAI answer synthesis over the current Radar dataset
- `app/api/crawl/route.ts`: Exa URL crawl/content extraction -> OpenAI structured AI Radar cards
- `app/api/health/route.ts`: safe server-side checks for database, Exa, and OpenAI configuration

### Crawl API

```bash
curl -X POST http://localhost:3000/api/crawl \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/ai-product-update","query":"Make this useful for student builders"}'
```

You can also send `urls` with up to 6 URLs.

### Neon Cache

Set `DATABASE_URL` to a Neon Postgres connection string. The app creates a small
`radar_cache` table automatically on first use and caches the daily Radar feed for
6 hours. This is intentionally server-side only; do not expose `DATABASE_URL` with
`NEXT_PUBLIC_`.

For local Postgres during development, this format is supported too:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sup_hackathon?schema=public
```

The database itself must already exist. The app auto-creates required tables with
`CREATE TABLE IF NOT EXISTS`.

Current tables:

- `radar_posts`: one row per generated/crawled Radar post.
- `radar_feed_items`: connects posts to feed/cache keys in display order.
- `saved_items`: saved posts by anonymous client ID.
- `radar_cache`: legacy JSON cache kept for compatibility.

### Health Check

Use this when the UI shows mock data and you expect live data:

```bash
curl http://localhost:3000/api/health
```

If Exa returns `401`, the API key is missing, invalid, copied with extra
characters, or the dev server was not restarted after changing `.env.local`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Main Files

- `components/ai-radar-app.tsx`: product UI and interactions
- `lib/live.ts`: Exa + OpenAI server utilities
- `lib/db.ts`: optional Neon cache utilities
- `lib/mock-data.ts`: offline/demo dataset
- `lib/radar-utils.ts`: filters, search, score messages, exports, progress helpers

## Hackathon Status

Finished:

- Mobile-first Radar/Search/Build product flow with mock fallback data.
- Server routes for Radar, Search, and Ask Radar.
- Live Exa search paired with OpenAI structured generation.
- Optional Neon cache for the Radar feed.
- URL crawl route for Exa contents plus OpenAI transformation.
- Saved tab and single-column Radar reading feed.
- Database-backed saved posts linked to generated Radar posts.

Still missing:

- A visible UI control for submitting crawl URLs.
- Database persistence for project progress, prompt-copy events, and exports.
- Scheduled refresh job for daily Radar generation.
- Auth or anonymous session IDs for multi-device persistence.
- Production observability, rate limits, and admin controls.

High-impact improvements:

- Add a hackathon demo toggle showing `Live`, `Cached`, and `Mock` source states.
- Cache Search and Crawl results by normalized query/URL hash.
- Add one-click "Generate from URL" in the Search or Build tab.
- Add seed SQL or a setup script for judges who want to inspect Neon tables.
