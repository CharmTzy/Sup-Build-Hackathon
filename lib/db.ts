import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import type { AIUpdate } from "@/lib/types";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

let client: Queryable | null = null;
let schemaReady = false;

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
  return Boolean(process.env.DATABASE_URL);
}

async function ensureSchema(db: Queryable) {
  if (schemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS radar_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      category TEXT NOT NULL,
      summary TEXT NOT NULL,
      long_explanation TEXT NOT NULL,
      why_it_matters TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      published_date DATE,
      difficulty TEXT NOT NULL,
      best_for JSONB NOT NULL DEFAULT '[]'::jsonb,
      access JSONB NOT NULL DEFAULT '{}'::jsonb,
      perks JSONB NOT NULL DEFAULT '[]'::jsonb,
      limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
      tutorial JSONB NOT NULL DEFAULT '{}'::jsonb,
      prompt_pack JSONB NOT NULL DEFAULT '{}'::jsonb,
      mini_project JSONB NOT NULL DEFAULT '{}'::jsonb,
      source_type TEXT NOT NULL DEFAULT 'Live',
      source_url TEXT,
      raw_post JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS radar_feed_items (
      cache_key TEXT NOT NULL,
      post_id TEXT NOT NULL REFERENCES radar_posts(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (cache_key, post_id)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS radar_feed_items_cache_position_idx
    ON radar_feed_items (cache_key, position)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS saved_items (
      client_id TEXT NOT NULL,
      post_id TEXT NOT NULL REFERENCES radar_posts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (client_id, post_id)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS saved_items_client_created_idx
    ON saved_items (client_id, created_at DESC)
  `);

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

function rowToAIUpdate(row: Record<string, unknown>): AIUpdate {
  return {
    id: String(row.id),
    title: String(row.title),
    toolName: String(row.tool_name),
    category: String(row.category),
    summary: String(row.summary),
    longExplanation: String(row.long_explanation),
    whyItMatters: String(row.why_it_matters),
    tags: (row.tags ?? []) as AIUpdate["tags"],
    date: row.published_date ? new Date(row.published_date as string | Date).toISOString().slice(0, 10) : "",
    hypeScore: Number(row.hype_score ?? (row.raw_post as AIUpdate | undefined)?.hypeScore ?? 0),
    usefulScore: Number(row.useful_score ?? (row.raw_post as AIUpdate | undefined)?.usefulScore ?? 0),
    studentRelevanceScore: Number(
      row.student_relevance_score ?? (row.raw_post as AIUpdate | undefined)?.studentRelevanceScore ?? 0,
    ),
    difficulty: row.difficulty as AIUpdate["difficulty"],
    bestFor: (row.best_for ?? []) as AIUpdate["bestFor"],
    access: (row.access ?? {}) as AIUpdate["access"],
    perks: (row.perks ?? []) as AIUpdate["perks"],
    limitations: (row.limitations ?? []) as AIUpdate["limitations"],
    tutorial: (row.tutorial ?? {}) as AIUpdate["tutorial"],
    promptPack: (row.prompt_pack ?? {}) as AIUpdate["promptPack"],
    miniProject: (row.mini_project ?? {}) as AIUpdate["miniProject"],
    sourceType: row.source_type as AIUpdate["sourceType"],
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    isSaved: false,
    isFeatured: Boolean((row.raw_post as AIUpdate | undefined)?.isFeatured),
  };
}

async function upsertRadarPost(db: Queryable, item: AIUpdate) {
  await db.query(
    `
    INSERT INTO radar_posts (
      id,
      title,
      tool_name,
      category,
      summary,
      long_explanation,
      why_it_matters,
      tags,
      published_date,
      difficulty,
      best_for,
      access,
      perks,
      limitations,
      tutorial,
      prompt_pack,
      mini_project,
      source_type,
      source_url,
      raw_post,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12::jsonb,
      $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18, $19, $20::jsonb, NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      title = EXCLUDED.title,
      tool_name = EXCLUDED.tool_name,
      category = EXCLUDED.category,
      summary = EXCLUDED.summary,
      long_explanation = EXCLUDED.long_explanation,
      why_it_matters = EXCLUDED.why_it_matters,
      tags = EXCLUDED.tags,
      published_date = EXCLUDED.published_date,
      difficulty = EXCLUDED.difficulty,
      best_for = EXCLUDED.best_for,
      access = EXCLUDED.access,
      perks = EXCLUDED.perks,
      limitations = EXCLUDED.limitations,
      tutorial = EXCLUDED.tutorial,
      prompt_pack = EXCLUDED.prompt_pack,
      mini_project = EXCLUDED.mini_project,
      source_type = EXCLUDED.source_type,
      source_url = EXCLUDED.source_url,
      raw_post = EXCLUDED.raw_post,
      updated_at = NOW()
  `,
    [
      item.id,
      item.title,
      item.toolName,
      item.category,
      item.summary,
      item.longExplanation,
      item.whyItMatters,
      JSON.stringify(item.tags),
      item.date || null,
      item.difficulty,
      JSON.stringify(item.bestFor),
      JSON.stringify(item.access),
      JSON.stringify(item.perks),
      JSON.stringify(item.limitations),
      JSON.stringify(item.tutorial),
      JSON.stringify(item.promptPack),
      JSON.stringify(item.miniProject),
      item.sourceType,
      item.sourceUrl ?? null,
      JSON.stringify(item),
    ],
  );
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

  const postRows = await db.query<Record<string, unknown>>(
    `
    SELECT p.*
    FROM radar_feed_items f
    JOIN radar_posts p ON p.id = f.post_id
    WHERE f.cache_key = $1
      AND f.updated_at > NOW() - INTERVAL '6 hours'
    ORDER BY f.position ASC, f.created_at DESC
  `,
    [cacheKey],
  );

  if (postRows.length) {
    const metaRows = await db.query<{ updated_at?: string | Date }>(
      `
      SELECT MAX(updated_at) AS updated_at
      FROM radar_feed_items
      WHERE cache_key = $1
    `,
      [cacheKey],
    );

    return {
      items: postRows.map(rowToAIUpdate),
      updatedAt: new Date(metaRows[0]?.updated_at ?? new Date()).toISOString(),
    };
  }

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

  await Promise.all(items.map((item) => upsertRadarPost(db, item)));

  await Promise.all(
    items.map((item, index) =>
      db.query(
        `
        INSERT INTO radar_feed_items (cache_key, post_id, position, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (cache_key, post_id)
        DO UPDATE SET
          position = EXCLUDED.position,
          updated_at = NOW()
      `,
        [cacheKey, item.id, index],
      ),
    ),
  );

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

export async function getSavedItems(clientId: string) {
  const db = getClient();
  if (!db || !clientId) return null;

  await ensureSchema(db);

  const rows = await db.query<Record<string, unknown>>(
    `
    SELECT p.*
    FROM saved_items s
    JOIN radar_posts p ON p.id = s.post_id
    WHERE s.client_id = $1
    ORDER BY s.created_at DESC
  `,
    [clientId],
  );

  return rows.map((row) => ({ ...rowToAIUpdate(row), isSaved: true }));
}

export async function saveItemForClient(clientId: string, item: AIUpdate) {
  const db = getClient();
  if (!db || !clientId) return false;

  await ensureSchema(db);
  await upsertRadarPost(db, item);
  await db.query(
    `
    INSERT INTO saved_items (client_id, post_id)
    VALUES ($1, $2)
    ON CONFLICT (client_id, post_id) DO NOTHING
  `,
    [clientId, item.id],
  );

  return true;
}

export async function deleteSavedItemForClient(clientId: string, postId: string) {
  const db = getClient();
  if (!db || !clientId || !postId) return false;

  await ensureSchema(db);
  await db.query(
    `
    DELETE FROM saved_items
    WHERE client_id = $1 AND post_id = $2
  `,
    [clientId, postId],
  );

  return true;
}
