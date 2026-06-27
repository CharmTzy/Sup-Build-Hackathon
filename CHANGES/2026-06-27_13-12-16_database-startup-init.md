# Database Startup Init

Date/time: 2026-06-27 13:12:16 +08
Task: auto-create database tables on server start

## Changed

- Added `initializeDatabaseSchema()` in `lib/db.ts`.
- Added root `instrumentation.ts` so Next.js runs database schema initialization when a server instance starts.
- Kept lazy schema creation in database read/write helpers as a fallback.

## Finished

- The app now attempts to create required tables on server startup when `DATABASE_URL` is configured.
- Existing tables are not recreated because schema setup uses `CREATE TABLE IF NOT EXISTS`.
- The server does not crash if `DATABASE_URL` is missing; database features stay optional.

## Still Missing

- User-state tables for saves, project progress, prompt copy events, and exports.
- Search/crawl cache tables.
- A migration/versioning system for future schema changes.

## Hackathon Improvements

- Add a `/api/health` endpoint that reports whether Neon schema initialization succeeded.
- Add visible demo status in the UI for `Database connected`, `Live API connected`, and `Using mock fallback`.
