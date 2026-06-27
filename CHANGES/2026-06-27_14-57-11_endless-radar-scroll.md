# Endless Radar Scroll

Date/time: 2026-06-27 14:57:11 +08
Task: remove terminal feed state and keep Radar scrolling like a social feed

## Changed

- Removed the `You are caught up for now` Radar footer.
- Removed the client-side hard stop based on `hasMoreRadar`.
- Radar infinite scroll now keeps requesting more posts even when the previous stored page is empty.
- Added rotating preference-based discovery queries for deeper scrolling.
- `/api/radar` now triggers background Exa/OpenAI retrieval for later pages, not only the first page.
- `/api/radar` returns `hasMore: true` for empty later pages so the feed does not present an end state.
- Empty/duplicate scroll fetches now show a temporary `Retrieving more posts for your preferences...` message instead of ending the feed.

## Finished

- Radar behaves more like a Facebook-style feed and no longer tells users they are done.
- Scrolling continues to request older or preference-matched content from stored posts while background refresh works.
- The scroll path still does not block on Exa/OpenAI generation.

## Still Missing

- A true backend worker/queue that continuously fills future pages before the user reaches them.
- Deeper ranking/diversification to avoid repeated near-duplicate topics.
- Cursor-based pagination; current pagination still uses offset.

## Hackathon Improvements

- Pre-seed 5-8 curated URLs before judging so the endless feed has enough high-quality stored posts.
- Add a background cron to crawl preference-based topics every morning.
