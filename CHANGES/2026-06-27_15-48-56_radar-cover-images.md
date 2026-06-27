# Radar Cover Images

## What Changed

- Added optional `coverImageUrl` support to Radar post data.
- Requested Exa image metadata with `imageLinks` during search and crawl.
- Preserved the representative source image or first image link when Exa returns one.
- Rendered cover images in Radar feed posts and the newest-post preview only when a cover image exists.
- Added a defensive image renderer that hides broken third-party image URLs.
- Configured Next Image for HTTPS remote cover images.

## Finished

- Radar posts can now display source cover images when Exa provides one.
- Posts without cover images render exactly without image placeholders.
- Stored database posts can read `coverImageUrl` from the existing `raw_post` JSON payload.
- `npm run lint` passes.
- `npm run build` passes.

## Still Missing

- Existing database posts need to be crawled again before they can gain cover images if their previous raw payload did not include image metadata.
- Cover images are not yet backfilled from Open Graph tags outside Exa metadata.

## Hackathon Improvements

- Add a backfill script that re-crawls saved Radar sources and updates missing cover images.
- Add cover images to the detail article page as a blog hero image.
- Add image source attribution or a small source-domain label below covers.
