# Radar Reading Feed

Date/time: 2026-06-27 13:34:59 +08
Task: redesign Radar as readable tutorial/news feed with saved page and cached crawl posts

## Changed

- Reworked Radar cards into a consistent single-column post layout.
- Removed the Hype Filter block from Radar cards and details.
- Removed Radar card actions for Prompt Pack and Mini Project.
- Added original source links to Radar cards and the detail modal when `sourceUrl` exists.
- Added a top-level `Saved` tab for bookmarked Radar/Search posts.
- Added scroll-triggered loading that expands the feed and fetches more live posts near the bottom.
- Updated the OpenAI generation prompt to produce practical reading/tutorial posts instead of score-oriented cards.
- Cached generated crawl posts in the database by URL hash.
- `/api/radar` now returns cached posts first and runs a background refresh to update the database.
- Cleaned up unused Radar/Hype/Prompt UI code.

## Finished

- Radar now shows one post per row, closer to a readable social/news feed.
- Saved items are visible from the new Saved page.
- Detail view includes the original source link.
- Crawled/generated content is saved in the database cache and reused on repeat crawl requests.
- Cached Radar content can display first while live refresh updates the cache.

## Still Missing

- A frontend input for users to paste a URL and call `/api/crawl`.
- True database persistence for user-specific saved items; saves still use `localStorage`.
- Background refresh job outside request handling.
- Better post schema fields for `what happened`, `setup guide`, and `examples` instead of reusing the original Hype Filter data shape.
- Visual QA in browser after the user tests the new feed.

## Hackathon Improvements

- Add a `Generate from URL` composer at the top of Radar.
- Add a status badge showing `Cached`, `Refreshing`, or `Live`.
- Add DB tables for saved posts and anonymous user sessions.
- Add a judge/demo mode seeded with several cached live posts.
