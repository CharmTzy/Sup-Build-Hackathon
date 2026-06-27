# Radar Image Backfill

## What Changed

- Added `relatedImageUrls` to Radar post data so each post can keep multiple relevant source images.
- Increased Exa image metadata retrieval to keep up to four source images per crawled result.
- Added source-image rendering to the full Radar detail article page.
- Added `scripts/backfill-radar-images.mjs` to update old database posts from Exa image metadata.
- Added `npm run db:backfill-images`.

## Finished

- Existing configured Neon database posts were backfilled.
- Backfill checked 66 posts, updated 65 posts, and discovered 206 source images.
- Database count after backfill: 65 of 66 posts now have `coverImageUrl` and `relatedImageUrls`.
- `npm run lint` passes.
- `npm run build` passes.

## Still Missing

- One existing post still has no image metadata available from Exa.
- The backfill updates `radar_posts.raw_post`; old browser-local saved posts will refresh images only after reloading from the database.

## Hackathon Improvements

- Add an admin button to run image backfill from the app instead of the command line.
- Add visual quality checks to skip tiny icons or unrelated decorative images.
- Add source-domain captions under detail-page images.
