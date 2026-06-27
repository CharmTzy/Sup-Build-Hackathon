# Load More Live Radar

Date/time: 2026-06-27 15:07:15 +08
Task: make Radar load more posts reliably when stored pages run out

## Changed

- Added `/api/radar?live=1` support so Radar can request a fresh Exa + OpenAI batch and receive the generated posts in the same response.
- Changed infinite scroll to page broad stored Radar posts first instead of over-filtering with a discovery query.
- Added a persistent `Load more` button at the bottom of the Radar feed.
- Added a `Crawl fresh posts` button that appears when stored rows are exhausted.
- Removed the indefinite `Still retrieving more posts for your preferences...` footer.
- Kept scrolling lightweight: normal scroll loads stored DB rows; explicit live crawling happens only when needed.

## Finished

- Users can keep scrolling through stored crawl data.
- When stored data runs out, users can explicitly crawl fresh preference-based posts.
- The feed no longer appears stuck on a retrieval message with no new content.

## Still Missing

- A backend job queue to pre-fill future pages before users reach the bottom.
- Cursor-based pagination for very large datasets.
- Deeper deduplication across multiple live batches.

## Hackathon Improvements

- Seed enough curated Radar posts before demo so most scrolling uses fast stored data.
- Use `Crawl fresh posts` during judging to show Exa + OpenAI working live.
