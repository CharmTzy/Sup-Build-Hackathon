# Account Scoped Saved Launchpad

## What Changed

- Made Saved Radar API access require an authenticated session.
- Made Launchpad API access require an authenticated session.
- Stopped hydrating saved items and Launchpad statuses from browser local storage.
- Saved and Launchpad database loads now replace visible account state instead of merging with stale local state.
- Logging out immediately clears saved items, saved item payloads, Launchpad statuses, and selected comparisons.
- Saving Radar posts and using Launchpad now prompts for login when the user is signed out.
- Saved and Launchpad pages show login prompts when signed out.

## Finished

- Saved items disappear immediately after logout.
- Launchpad items and statuses disappear immediately after logout.
- Logged-in users load saved items and Launchpad statuses from the database.
- `npm run lint` passes.
- `npm run build` passes.

## Still Missing

- Anonymous local saved items are no longer shown; users must log in to persist saved posts.
- Existing anonymous browser-only local saved data is not migrated unless it was previously synced to the database by client ID.

## Hackathon Improvements

- Add a small onboarding note explaining that saved posts sync after login.
- Add an account settings page for changing password and deleting account data.
- Add end-to-end auth tests for save, logout, login, and database restore.
