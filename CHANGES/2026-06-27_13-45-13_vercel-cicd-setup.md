# Vercel hosting and CI/CD setup

## What changed

- Added `.github/workflows/ci.yml` for lint + production build on push/PR to `main`.
- Added `.github/workflows/deploy.yml` for Vercel production deploys on push to `main`.
- Added `vercel.json` with Next.js framework defaults and `npm ci` install command.
- Added `DEPLOYMENT.md` with one-time Vercel + GitHub secrets checklist.
- Updated `README.md` with a Deploy on Vercel section and workflow summary.

## What is finished

- Local `npm run build` succeeds (verified before adding workflows).
- CI/CD workflow definitions are ready to run once pushed to GitHub.
- Documentation covers dashboard import, GitHub secrets, and post-deploy health check.

## What is still missing

- **Live Vercel deployment** — requires one-time user auth (`npx vercel login`) and GitHub secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
- Production env vars (`EXA_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL`) must be set in Vercel project settings.
- Uncommitted local changes (including this CI/CD work) still need to be committed and pushed to `main`.

## Hackathon demo improvements

- After first deploy, share the Vercel URL and `/api/health` output in the demo script.
- Add a GitHub `production` environment with optional required reviewers before auto-deploy.
- Consider Vercel preview deployments for pull requests once secrets are configured.
