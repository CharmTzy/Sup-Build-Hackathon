# Preferences Live Only Feed

Date/time: 2026-06-27 14:38:29 +08
Task: remove mock feed data, add preferences, fix filters/infinite scroll, and support unsave

## Changed

- Removed client-side mock seeding from the main app.
- `/api/radar` no longer returns mock posts; it returns stored posts or an empty live response while background refresh runs.
- `/api/search` no longer returns mock search results; it searches stored Radar posts and triggers background Exa/OpenAI refresh.
- Added `/api/preferences` for loading and saving user preferences by anonymous client ID.
- Added `user_preferences` table creation in the database schema.
- Added Preferences tab with audience, interests, access preference, and difficulty.
- Radar and Search pass `clientId` so API routes can use saved preferences.
- Radar filters now request filter-aware rows from the database instead of only filtering already-loaded client rows.
- Infinite scroll now pages `/api/radar?offset=&limit=` and does not call OpenAI in the scroll path.
- Save is now a toggle: saved items can be unsaved from Radar, Search, Saved, and Launchpad.
- Launchpad saved tutorial cards and project cards now include explicit remove controls.

## Finished

- Mock data is no longer shown as feed/search fallback.
- User preferences are saved locally and to the database when configured.
- Radar/Search use preferences to retrieve suitable stored posts and to guide background crawling.
- Radar filter behavior is backed by server-side filtering.
- Infinite scrolling loads stored posts efficiently without making users wait for live generation.
- Saved/Launchpad items can be removed.

## Still Missing

- A production background worker or cron that continuously crawls based on every user's preferences.
- Database-backed Launchpad statuses such as signed up, trial started, tried, locked, and saved for later.
- Search result polling after background crawl finishes; users currently refresh live search manually.
- Recommendation of free alternatives for paid/pro-only tools.
- Authenticated accounts beyond anonymous browser client IDs.

## Hackathon Improvements

- Add a small `Personalized for ...` badge on Radar/Search results.
- Add a background job queue for Exa/OpenAI refreshes.
- Add a seed command that crawls preference-specific content before a demo.
- Add Launchpad access-state controls and free-alternative cards.
