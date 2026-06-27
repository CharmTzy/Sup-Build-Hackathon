# Normalized DB Saved Items

Date/time: 2026-06-27 13:47:57 +08
Task: normalized post storage, database-backed saves, richer details, and full-width infinite feed

## Changed

- Added normalized database tables:
  - `radar_posts` stores one generated/crawled Radar post per row.
  - `radar_feed_items` links posts to feed/cache keys in display order.
  - `saved_items` links anonymous clients to saved Radar posts.
- Kept `radar_cache` as a legacy compatibility table.
- Updated Radar cache reads/writes to use `radar_posts` and `radar_feed_items` first.
- Added `/api/saved` for loading, saving, and deleting saved posts.
- Added anonymous `clientId` generation in local storage so saved posts can be linked in the database without auth.
- Updated the Saved tab to hydrate saved posts from the database while keeping local storage fallback.
- Expanded detail content with plain-language explanation, setup path, expected output, starter prompt/checklist, common mistakes, and limitations.
- Made Radar and Saved post cards full-width to match the filter/content container.
- Removed the manual load-more button so scroll position drives loading.

## Finished

- Saved items are now stored in the database when `DATABASE_URL` is configured.
- Saved rows link to normalized `radar_posts` instead of duplicating entire feed blobs.
- Radar generated/crawled posts are stored separately and reusable across feed/cache keys.
- Non-technical users get more explanation in detail view before opening the original source.
- The feed uses infinite scroll behavior and full-width post cards.

## Still Missing

- Authenticated user accounts; current saves use anonymous client IDs.
- Database-backed project progress, prompt-copy events, and exports.
- A visible URL composer for creating a Radar post from `/api/crawl`.
- A migration/versioning system for future schema changes.
- Browser visual QA from the in-app browser, which was unavailable in this session.

## Hackathon Improvements

- Add a `/api/health` schema section that lists table readiness.
- Add a `Generate from URL` composer at the top of Radar.
- Add a save/remove toggle and sync status badge.
- Add seed data for demo accounts or judge mode.
