# Fast Live Fallback

Date/time: 2026-06-27 13:23:03 +08
Task: prevent blank spinner while live Radar generation is slow

## Changed

- The UI now starts with mock Radar cards immediately instead of an empty feed.
- `/api/radar` now caps live Exa + OpenAI generation at 18 seconds before returning mock fallback with a timeout message.
- Live Radar generation now requests fewer Exa results for the main feed.
- OpenAI structured generation now has a smaller output budget and a lower maximum live-card count.

## Finished

- Users should see content immediately even when Exa/OpenAI is slow.
- Valid live Exa/OpenAI requests can still replace the demo cards when they finish inside the timeout.
- Slow provider calls now return a clear fallback message instead of leaving the user staring at a blank loading state.

## Still Missing

- Background refresh that continues after returning mock data and later writes live data into the cache.
- UI status for `loading live`, `live timeout`, and `cached live`.
- Search route timeout tuning.

## Hackathon Improvements

- Add a visible demo switch for `Fast demo mode` versus `Full live generation`.
- Add a small source/debug panel so judges can see Exa/OpenAI timing and cache status.
