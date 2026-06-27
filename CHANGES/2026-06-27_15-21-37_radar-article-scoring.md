# Radar Article Scoring

## What Changed

- Added a shared scoring helper that recalculates `Actually useful` and `Student fit` from post category, access, actionability, difficulty, source availability, and student-friendly signals.
- Applied the scoring helper to both newly crawled live posts and posts read back from the database.
- Replaced the radar detail modal with a full-page article view that reads more like a blog post.
- Kept the original crawl source link visible in the article view.
- Added article navigation polish: opening a post scrolls to the top, and changing tabs exits the article view.

## Finished

- Radar cards now show more varied usefulness and student-fit scores.
- Existing stored posts also display updated scores without needing a database migration.
- Clicking `Read Details` opens an article-style page instead of a modal.
- The article page avoids boxed content sections and uses prose, headings, ordered setup steps, and bottom actions.
- `npm run lint` passes.
- `npm run build` passes.

## Still Missing

- The article page is currently an in-app state view, not a shareable `/radar/[id]` route.
- The scoring model is heuristic-based; it does not yet store a human-readable reason for each rating.

## Hackathon Improvements

- Add a short explanation beside each score, such as `High because it has a free tier and a clear setup path`.
- Add shareable detail URLs so judges can open one crawled post directly.
- Add preference-aware score weighting so UI/UX users, students, engineers, and founders see different fit scores for the same post.
