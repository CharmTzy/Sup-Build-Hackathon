# Stricter Radar Scoring

## Summary
- Made the fallback `Actually useful` and `Student fit` scoring less generous.
- Added realistic caps for posts with unknown pricing/access, API-only setup, waitlists, enterprise access, or skipped OpenAI enrichment.
- Tightened OpenAI scoring instructions so most useful/student scores land in the 5-8 range and 10 is reserved for exceptional posts.
- Recalibrated OpenAI-generated posts with the stricter heuristic when the dedicated scoring pass is skipped or times out.
- Rescored the existing Neon `radar_posts` rows with OpenAI so the hosted data no longer clusters at `10/10`.

## Verification
- `npm run lint`
- `npm run build`
- `npm run db:rescore` updated 66 stored posts.
