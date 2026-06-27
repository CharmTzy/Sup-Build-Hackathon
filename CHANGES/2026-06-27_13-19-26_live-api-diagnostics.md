# Live API Diagnostics

Date/time: 2026-06-27 13:19:26 +08
Task: expose Exa/OpenAI live-data failures instead of silent mock fallback

## Changed

- Added `LiveDataError` in `lib/live.ts` with provider, status code, and response detail fields.
- Updated Exa search, Exa crawl, OpenAI transform, and OpenAI answer calls to throw typed live-data errors.
- Updated `/api/radar` so mock fallback responses include a safe `liveError` object when a live provider fails.
- Added `/api/health` to check database setup, Exa API access, and OpenAI key presence without exposing secrets.
- Updated README with health-check instructions.

## Finished

- Exa `401` errors now surface as `Exa authentication failed with 401. Check EXA_API_KEY, then restart the dev server.`
- `/api/health` can confirm whether Exa is configured and whether the key is accepted.
- The UI can still fall back to mock data for demo safety.

## Still Missing

- A visible UI status badge for live/mock/error state.
- Full OpenAI validation in `/api/health`; it currently checks only whether `OPENAI_API_KEY` is configured.
- Retry/backoff for transient provider failures.

## Hackathon Improvements

- Show provider health in a small demo/admin panel.
- Add a "Why am I seeing mock data?" drawer when live data fails.
- Add rate-limit and quota messaging for sponsor API calls.
