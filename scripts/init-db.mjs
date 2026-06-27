import { neon } from "@neondatabase/serverless";
import pg from "pg";
import { loadDotEnvLocal, maskDatabaseUrl } from "./env-utils.mjs";

const { Pool } = pg;

const schemaSql = `
  CREATE TABLE IF NOT EXISTS radar_cache (
    cache_key TEXT PRIMARY KEY,
    items JSONB NOT NULL,
    source TEXT NOT NULL DEFAULT 'live',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

function isLocalDatabaseUrl(databaseUrl) {
  try {
    const { hostname } = new URL(databaseUrl);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

async function query(databaseUrl, sqlText, params = []) {
  if (isLocalDatabaseUrl(databaseUrl)) {
    if (process.env.ALLOW_LOCAL_DATABASE_URL !== "true") {
      throw new Error(
        "DATABASE_URL points to localhost. Use a Neon connection string, or set ALLOW_LOCAL_DATABASE_URL=true for local Postgres.",
      );
    }

    const pool = new Pool({ connectionString: databaseUrl });
    try {
      return await pool.query(sqlText, params);
    } finally {
      await pool.end();
    }
  }

  const sql = neon(databaseUrl);
  return sql.query(sqlText, params);
}

loadDotEnvLocal();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured. Add a Neon connection string to .env.local first.");
  process.exit(1);
}

console.log(`Initializing schema with DATABASE_URL=${maskDatabaseUrl(process.env.DATABASE_URL)}`);

try {
  await query(process.env.DATABASE_URL, schemaSql);
  console.log("Database connected and radar_cache schema is ready.");
} catch (error) {
  console.error("Database initialization failed.");
  console.error(error);
  process.exit(1);
}
