import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";
import type { AIUpdate, ProjectStatus, UserAccount, UserPreferences } from "@/lib/types";
import { clampScore } from "@/lib/radar-utils";

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface PostQueryOptions {
  limit?: number | null;
  offset?: number;
  filter?: string;
  query?: string;
  preferences?: UserPreferences;
}

export interface UserAccountRecord extends UserAccount {
  passwordHash: string;
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

  return {
    configured: true,
    message: isLocalDatabaseUrl(databaseUrl)
      ? "Local Postgres DATABASE_URL is configured."
      : "DATABASE_URL is configured.",
  };
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
    ALTER TABLE radar_posts
    ADD COLUMN IF NOT EXISTS hype_score NUMERIC,
    ADD COLUMN IF NOT EXISTS useful_score NUMERIC,
    ADD COLUMN IF NOT EXISTS student_relevance_score NUMERIC
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
    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS user_accounts_email_idx
    ON user_accounts (email)
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
    CREATE TABLE IF NOT EXISTS user_preferences (
      client_id TEXT PRIMARY KEY,
      preferences JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS launchpad_items (
      client_id TEXT NOT NULL,
      post_id TEXT NOT NULL REFERENCES radar_posts(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'Not signed up',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (client_id, post_id)
    )
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS launchpad_items_client_updated_idx
    ON launchpad_items (client_id, updated_at DESC)
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS prompt_copy_events (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT NOT NULL,
      post_id TEXT REFERENCES radar_posts(id) ON DELETE SET NULL,
      prompt_type TEXT NOT NULL DEFAULT 'starter',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS generated_exports (
      id BIGSERIAL PRIMARY KEY,
      client_id TEXT NOT NULL,
      post_id TEXT REFERENCES radar_posts(id) ON DELETE SET NULL,
      export_type TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  const rawPost = row.raw_post as AIUpdate | undefined;

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
    hypeScore: clampScore(Number(row.hype_score ?? rawPost?.hypeScore ?? 0)),
    usefulScore: clampScore(Number(row.useful_score ?? rawPost?.usefulScore ?? 0)),
    studentRelevanceScore: clampScore(Number(row.student_relevance_score ?? rawPost?.studentRelevanceScore ?? 0)),
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
    coverImageUrl: rawPost?.coverImageUrl,
    isSaved: false,
    isFeatured: Boolean(rawPost?.isFeatured),
  };
}

function accountClientId(userId: string) {
  return `account:${userId}`;
}

function rowToUserAccount(row: Record<string, unknown>): UserAccountRecord {
  const id = String(row.id);

  return {
    id,
    email: String(row.email),
    name: String(row.name ?? ""),
    passwordHash: String(row.password_hash),
    clientId: accountClientId(id),
    createdAt: new Date(row.created_at as string | Date).toISOString(),
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function publicUser(user: UserAccountRecord): UserAccount {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    clientId: user.clientId,
    createdAt: user.createdAt,
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
      hype_score,
      useful_score,
      student_relevance_score,
      raw_post,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11::jsonb, $12::jsonb,
      $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18, $19, $20, $21, $22, $23::jsonb, NOW()
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
      hype_score = EXCLUDED.hype_score,
      useful_score = EXCLUDED.useful_score,
      student_relevance_score = EXCLUDED.student_relevance_score,
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
      item.hypeScore,
      item.usefulScore,
      item.studentRelevanceScore,
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

function buildPostWhere(options: PostQueryOptions, params: unknown[]) {
  const clauses: string[] = [];
  const textClause = (value: string) => {
    params.push(`%${value}%`);
    const ref = `$${params.length}`;
    return `(
      title ILIKE ${ref}
      OR tool_name ILIKE ${ref}
      OR category ILIKE ${ref}
      OR summary ILIKE ${ref}
      OR long_explanation ILIKE ${ref}
      OR why_it_matters ILIKE ${ref}
      OR raw_post::text ILIKE ${ref}
    )`;
  };

  if (options.query?.trim()) clauses.push(textClause(options.query.trim()));

  if (options.filter && options.filter.toLowerCase() !== "all") {
    const normalized = options.filter.toLowerCase();
    if (normalized === "free tools") {
      clauses.push(`((access->>'freeTier')::boolean = true OR (access->>'openSource')::boolean = true OR raw_post::text ILIKE '%free%')`);
    } else if (normalized === "portfolio") {
      clauses.push(`(mini_project->>'portfolioValue' = 'High' OR raw_post::text ILIKE '%portfolio%')`);
    } else {
      clauses.push(textClause(options.filter));
    }
  }

  const preferenceTerms = [
    ...(options.preferences?.audience && options.preferences.audience !== "General" ? [options.preferences.audience] : []),
    ...(options.preferences?.interests ?? []),
  ].filter(Boolean);

  if (!options.query && preferenceTerms.length) {
    const preferenceClauses = preferenceTerms.map((term) => textClause(term));
    clauses.push(`(${preferenceClauses.join(" OR ")})`);
  }

  if (options.preferences?.difficulty && options.preferences.difficulty !== "Any") {
    clauses.push(`difficulty = $${params.length + 1}`);
    params.push(options.preferences.difficulty);
  }

  const access = options.preferences?.access;
  if (access === "Free") clauses.push(`(access->>'freeTier')::boolean = true`);
  if (access === "Trial") clauses.push(`access->>'trialCredits' = 'Yes'`);
  if (access === "Paid") clauses.push(`(access->>'paidOnly')::boolean = true`);
  if (access === "Open Source") clauses.push(`(access->>'openSource')::boolean = true`);

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export async function getRadarPosts(options: PostQueryOptions = {}) {
  const db = getClient();
  if (!db) return null;

  await ensureSchema(db);
  const params: unknown[] = [];
  const where = buildPostWhere(options, params);
  let pagination = "";

  if (options.limit !== null) {
    const limit = Math.min(options.limit ?? 10, 50);
    const offset = Math.max(options.offset ?? 0, 0);
    params.push(limit, offset);
    pagination = `LIMIT $${params.length - 1} OFFSET $${params.length}`;
  }

  const rows = await db.query<Record<string, unknown>>(
    `
    SELECT *
    FROM radar_posts
    ${where}
    ORDER BY updated_at DESC, created_at DESC
    ${pagination}
  `,
    params,
  );

  return rows.map(rowToAIUpdate);
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

export async function createUserAccount({
  id,
  email,
  name,
  passwordHash,
}: {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
}) {
  const db = getClient();
  if (!db) return null;

  await ensureSchema(db);
  const rows = await db.query<Record<string, unknown>>(
    `
    INSERT INTO user_accounts (id, email, name, password_hash, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING *
  `,
    [id, normalizeEmail(email), name?.trim() || null, passwordHash],
  );

  return rows[0] ? rowToUserAccount(rows[0]) : null;
}

export async function getUserAccountByEmail(email: string) {
  const db = getClient();
  if (!db) return null;

  await ensureSchema(db);
  const rows = await db.query<Record<string, unknown>>(
    `
    SELECT *
    FROM user_accounts
    WHERE email = $1
    LIMIT 1
  `,
    [normalizeEmail(email)],
  );

  return rows[0] ? rowToUserAccount(rows[0]) : null;
}

export async function getUserAccountById(id: string) {
  const db = getClient();
  if (!db || !id) return null;

  await ensureSchema(db);
  const rows = await db.query<Record<string, unknown>>(
    `
    SELECT *
    FROM user_accounts
    WHERE id = $1
    LIMIT 1
  `,
    [id],
  );

  return rows[0] ? rowToUserAccount(rows[0]) : null;
}

export async function migrateClientDataToAccount(fromClientId: string | undefined, toClientId: string) {
  const db = getClient();
  const sourceClientId = fromClientId?.trim();
  if (!db || !sourceClientId || !toClientId || sourceClientId === toClientId) return false;

  await ensureSchema(db);
  await db.query(
    `
    INSERT INTO saved_items (client_id, post_id, created_at)
    SELECT $2, post_id, created_at
    FROM saved_items
    WHERE client_id = $1
    ON CONFLICT (client_id, post_id) DO NOTHING
  `,
    [sourceClientId, toClientId],
  );
  await db.query(
    `
    INSERT INTO launchpad_items (client_id, post_id, status, notes, created_at, updated_at)
    SELECT $2, post_id, status, notes, created_at, updated_at
    FROM launchpad_items
    WHERE client_id = $1
    ON CONFLICT (client_id, post_id) DO NOTHING
  `,
    [sourceClientId, toClientId],
  );
  await db.query(
    `
    INSERT INTO user_preferences (client_id, preferences, created_at, updated_at)
    SELECT $2, preferences, created_at, updated_at
    FROM user_preferences
    WHERE client_id = $1
    ON CONFLICT (client_id) DO NOTHING
  `,
    [sourceClientId, toClientId],
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

  await db.query(
    `
    INSERT INTO launchpad_items (client_id, post_id, status, updated_at)
    VALUES ($1, $2, 'Not signed up', NOW())
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
  await db.query(
    `
    DELETE FROM launchpad_items
    WHERE client_id = $1 AND post_id = $2
  `,
    [clientId, postId],
  );

  return true;
}

export async function getPreferences(clientId: string) {
  const db = getClient();
  if (!db || !clientId) return null;

  await ensureSchema(db);
  const rows = await db.query<{ preferences?: UserPreferences }>(
    `
    SELECT preferences
    FROM user_preferences
    WHERE client_id = $1
    LIMIT 1
  `,
    [clientId],
  );

  return rows[0]?.preferences ?? null;
}

export async function savePreferences(clientId: string, preferences: UserPreferences) {
  const db = getClient();
  if (!db || !clientId) return false;

  await ensureSchema(db);
  await db.query(
    `
    INSERT INTO user_preferences (client_id, preferences, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (client_id)
    DO UPDATE SET
      preferences = EXCLUDED.preferences,
      updated_at = NOW()
  `,
    [clientId, JSON.stringify(preferences)],
  );

  return true;
}

export async function getLaunchpadStatuses(clientId: string) {
  const db = getClient();
  if (!db || !clientId) return null;

  await ensureSchema(db);
  const rows = await db.query<{ post_id: string; status: ProjectStatus }>(
    `
    SELECT post_id, status
    FROM launchpad_items
    WHERE client_id = $1
    ORDER BY updated_at DESC
  `,
    [clientId],
  );

  return Object.fromEntries(rows.map((row) => [row.post_id, row.status]));
}

export async function setLaunchpadStatus(clientId: string, postId: string, status: ProjectStatus) {
  const db = getClient();
  if (!db || !clientId || !postId) return false;

  await ensureSchema(db);
  await db.query(
    `
    INSERT INTO launchpad_items (client_id, post_id, status, updated_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (client_id, post_id)
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = NOW()
  `,
    [clientId, postId, status],
  );

  return true;
}

export async function recordPromptCopy(clientId: string, postId?: string, promptType = "starter") {
  const db = getClient();
  if (!db || !clientId) return false;

  await ensureSchema(db);
  await db.query(
    `
    INSERT INTO prompt_copy_events (client_id, post_id, prompt_type)
    VALUES ($1, $2, $3)
  `,
    [clientId, postId ?? null, promptType],
  );

  return true;
}

export async function saveGeneratedExport(clientId: string, postId: string | undefined, exportType: string, content: string) {
  const db = getClient();
  if (!db || !clientId || !content) return false;

  await ensureSchema(db);
  await db.query(
    `
    INSERT INTO generated_exports (client_id, post_id, export_type, content)
    VALUES ($1, $2, $3, $4)
  `,
    [clientId, postId ?? null, exportType, content],
  );

  return true;
}

export async function getSchemaHealth() {
  const db = getClient();
  if (!db) return null;

  await ensureSchema(db);
  const tables = [
    "user_accounts",
    "radar_posts",
    "radar_feed_items",
    "saved_items",
    "user_preferences",
    "launchpad_items",
    "prompt_copy_events",
    "generated_exports",
    "radar_cache",
  ];
  const rows = await db.query<{ table_name: string }>(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1)
  `,
    [tables],
  );
  const present = new Set(rows.map((row) => row.table_name));
  return Object.fromEntries(tables.map((table) => [table, present.has(table)]));
}
