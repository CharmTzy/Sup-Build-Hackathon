# Radar Launchpad Simplification

## What Changed

- Removed the right-side Radar dashboard column with updates loaded, saved tools, completed projects, live pipeline, and system status.
- Removed the Radar hero `Refresh Radar` and `Daily briefing` buttons.
- Added a newest-post preview inside the `Today's AI Radar` box using the same practical fields as the crawl data cards.
- Removed the Launchpad `Portfolio Progress` box.
- Removed the Launchpad `Saved Tutorials` box.
- Removed the now-unused client-side health polling and progress bar helper.

## Finished

- Radar top area now focuses on the newest crawled content instead of dashboard metrics.
- Launchpad now prioritizes mini projects without the old left sidebar boxes.
- `npm run lint` passes.
- `npm run build` passes.

## Still Missing

- The newest-post preview is still an in-page preview, not a shareable dedicated post route.
- The Radar hero does not yet let users manually switch between several newest crawled posts.

## Hackathon Improvements

- Add a compact carousel for the newest 3 crawled posts in the Radar hero.
- Add direct `/radar/[id]` URLs so judges can open a crawl-generated article directly.
- Add score explanations beside `Actually useful` and `Student fit`.
