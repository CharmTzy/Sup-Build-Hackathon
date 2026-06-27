# Local Postgres Support

Date/time: 2026-06-27 13:16:32 +08
Task: support local Postgres connection strings

## Changed

- Added `pg` and `@types/pg`.
- Updated `lib/db.ts` to choose the database client automatically:
  - `localhost`, `127.0.0.1`, and `::1` use `pg`.
  - Hosted database URLs continue to use `@neondatabase/serverless`.
- Updated README with the local Postgres `DATABASE_URL` format.

## Finished

- Local development can use `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sup_hackathon?schema=public`.
- Neon production/free-tier URLs remain supported.
- Tables still auto-create with `CREATE TABLE IF NOT EXISTS`, so existing tables are left alone.

## Still Missing

- The app still does not create the database itself; `sup_hackathon` must exist before startup.
- There is no migration history table yet.
- Only the `radar_cache` table is currently managed.

## Hackathon Improvements

- Add a setup script that creates the local database if missing.
- Add a health endpoint to show whether the active database is `local`, `neon`, or disconnected.
