# Backend Foundation Report

Date/time: 2026-06-27 13:05:38 +08
Task: backend foundation for Neon, Exa crawl, OpenAI pairing, and project reporting

## Changed

- Added the repository instruction that every future code/documentation change must create a dated report in `CHANGES/`.
- Added `@neondatabase/serverless` and `lib/db.ts` for an optional Neon Postgres cache.
- Updated `/api/radar` so live Exa + OpenAI cards are cached in Neon when `DATABASE_URL` is configured.
- Added `/api/crawl` for URL-based Exa content extraction followed by OpenAI Radar-card generation.
- Exported reusable Exa/OpenAI helpers from `lib/live.ts`.
- Added `DATABASE_URL` to `.env.example`.
- Improved `README.md` with live setup, crawl API usage, Neon cache behavior, and hackathon status.

## Finished

- Exa web search is already paired with OpenAI for live Radar and Search routes.
- Ask Radar already uses OpenAI over the current Radar dataset when configured.
- The app still has mock fallbacks for demo safety when API keys are missing or live calls fail.
- Neon cache foundation is implemented for the daily Radar feed.
- Crawl foundation is implemented as a server route that accepts one URL or up to 6 URLs.
- Documentation now explains what is live, cached, and still missing.

## Still Missing

- A frontend crawl/search input that lets users paste URLs from the app UI.
- Database persistence for saved tutorials, mini project progress, completed projects, prompt-copy counts, exports, and streaks.
- Database-backed Search and Crawl cache tables keyed by normalized query or URL hash.
- A scheduled refresh job for daily Exa -> OpenAI -> Neon generation.
- Authentication or anonymous session IDs for user-specific database state.
- Production rate limiting, request logging, and admin controls for API cost management.
- End-to-end tests around live/mock fallback behavior.

## Hackathon Improvements

- Add a small source badge in the UI showing `Live`, `Cached`, or `Mock` so judges can see sponsor tech working.
- Add a "Generate from URL" action in Search or Build that calls `/api/crawl`.
- Add a "Refresh live Radar" admin/demo button guarded by an environment secret.
- Cache Search results in Neon to make repeated judge demos faster and cheaper.
- Add a one-page demo script explaining why Exa retrieval plus OpenAI transformation is central to the product.
- Add sample Neon schema screenshots or seed data for the pitch deck.

## Notes

- `DATABASE_URL` is optional. Without it, live Exa/OpenAI routes still work and fall back to mock data when needed.
- API keys remain server-side only; no `NEXT_PUBLIC_` secrets were added.
- The current cache TTL is 6 hours.
