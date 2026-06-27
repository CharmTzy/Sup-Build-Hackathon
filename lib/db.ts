import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import type { AIUpdate } from "@/lib/types";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

let client: Queryable | null = null;
let schemaReady = false;
let warnedLocalDatabaseUrl = false;

function isLocalDatabaseUrl(databaseUrl: string) {
  try {
    const { hostname } = new URL(databaseUrl);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  if (!client) {
    if (isLocalDatabaseUrl(databaseUrl)) {
      if (process.env.ALLOW_LOCAL_DATABASE_URL !== "true") {
        if (!warnedLocalDatabaseUrl) {
          console.warn(
            "DATABASE_URL points to localhost. Skipping database connection. Set DATABASE_URL to a Neon connection string, or set ALLOW_LOCAL_DATABASE_URL=true to use local Postgres.",
          );
          warnedLocalDatabaseUrl = true;
        }

        return null;
      }

      const pool = new Pool({ connectionString: databaseUrl });
      client = {
        async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
          const result = await pool.query(sql, params);
          return result.rows as T[];
        },
      };
    } else {
      const sql = neon(databaseUrl);
      client = {
        async query<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
          return (await sql.query(text, params)) as T[];
        },
      };
    }
  }

  return client;
}

export function isDatabaseConfigured() {
  return getDatabaseConfigurationStatus().configured;
}

export function getDatabaseConfigurationStatus() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {
      configured: false,
      message: "DATABASE_URL is not configured.",
    };
  }

  if (isLocalDatabaseUrl(databaseUrl) && process.env.ALLOW_LOCAL_DATABASE_URL !== "true") {
    return {
      configured: false,
      message:
        "DATABASE_URL points to localhost and is ignored. Use a Neon connection string, or set ALLOW_LOCAL_DATABASE_URL=true for local Postgres.",
    };
  }

  return {
    configured: true,
    message: "DATABASE_URL is configured.",
  };
}

async function ensureSchema(db: Queryable) {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS radar_cache (
      cache_key TEXT PRIMARY KEY,
      items JSONB NOT NULL,
      source TEXT NOT NULL DEFAULT 'live',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  schemaReady = true;
}

export async function initializeDatabaseSchema() {
  const db = getClient();
  if (!db) return false;

  await ensureSchema(db);
  return true;
}

export async function getCachedRadarItems(cacheKey: string) {
  const db = getClient();
  if (!db) return null;

  await ensureSchema(db);

  const rows = await db.query<{ items?: AIUpdate[]; updated_at?: string | Date }>(
    `
    SELECT items, updated_at
    FROM radar_cache
    WHERE cache_key = $1
    LIMIT 1
  `,
    [cacheKey],
  );

  const row = rows[0];
  if (!row?.items || !row.updated_at) return null;

  const updatedAt = new Date(row.updated_at).getTime();
  if (Number.isNaN(updatedAt) || Date.now() - updatedAt > CACHE_TTL_MS) return null;

  return {
    items: row.items,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function saveRadarItems(cacheKey: string, items: AIUpdate[]) {
  const db = getClient();
  if (!db || !items.length) return false;

  await ensureSchema(db);

  await db.query(
    `
    INSERT INTO radar_cache (cache_key, items, source, updated_at)
    VALUES ($1, $2::jsonb, 'live', NOW())
    ON CONFLICT (cache_key)
    DO UPDATE SET
      items = EXCLUDED.items,
      source = EXCLUDED.source,
      updated_at = NOW()
  `,
    [cacheKey, JSON.stringify(items)],
  );

  return true;
}
