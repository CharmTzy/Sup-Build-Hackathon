# Nonblocking Radar Crawl Feed

Date/time: 2026-06-27 14:08:48 +08
Task: complete Radar plan from updated spec and fix live timeout/crawl display

## Changed

- Removed the blocking 18-second `/api/radar` live-generation wait path.
- `/api/radar` now returns normalized database posts immediately, or mock posts immediately if no database posts exist.
- Live Exa + OpenAI generation now runs only in the background for Radar refresh.
- Added paginated `/api/radar?offset=&limit=` behavior for infinite scroll.
- Changed Radar infinite scroll to fetch more posts from `/api/radar` instead of unrelated `/api/search` queries.
- Added a Radar URL composer that calls `/api/crawl` and prepends generated posts to the feed.
- `/api/crawl` now stores generated URL posts in the URL cache and the main Radar feed/post tables.
- Updated cards to match the updated spec action loop: access label, usefulness/student scores, Try Tutorial, Copy Prompt, Launchpad save, source link.
- Renamed the Build navigation/page copy toward Launchpad.
- Local Postgres URLs are supported directly again without requiring `ALLOW_LOCAL_DATABASE_URL`.

## Finished

- The timeout error should stop because `/api/radar` no longer waits for live generation.
- Crawled URL posts can now show on the Radar page immediately after generation.
- Crawled URL posts are stored as individual `radar_posts`, not a single JSON blob row.
- Infinite scroll uses stored/paginated Radar posts and does not block on OpenAI.
- Radar is closer to the updated spec: discover -> decide -> learn -> launch.

## Still Missing

- True video/reels rendering; current UI is still card/feed based.
- Launchpad access-state management such as `Not signed up`, `Trial started`, `Tried`, `Locked`, and `Save for later`.
- Free alternative recommendations for paid/pro-only/locked tools.
- Database tables for Launchpad status, prompt-copy events, and generated exports.
- Scheduled background refresh outside request handling.

## Hackathon Improvements

- Add source health/status chips: `Stored`, `Refreshing`, `Generated from URL`, `Mock`.
- Add Launchpad status controls per saved tool.
- Add a judge seed script that crawls 5 known AI update URLs into `radar_posts`.
- Add a lightweight worker or cron job for daily Exa -> OpenAI -> Postgres refresh.
